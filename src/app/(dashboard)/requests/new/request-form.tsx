"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { refineRequestDraft } from "./actions";
import { submitRequest } from "../actions";
import { Lightbulb, Send, Clock, Sparkles, Loader2, CheckCircle, AlertTriangle, Heart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Recipient {
    id: string;
    name: string;
    sport: string;
    school: string;
    role: string;
    imageUrl?: string;
    industry?: string;
    company?: string;
    position?: string;
}

export function RequestForm({
    recipient,
    onSuccess,
}: {
    recipient?: Recipient;
    onSuccess?: () => void;
}) {
    const [context, setContext] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isRefining, setIsRefining] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isVerified, setIsVerified] = useState(true); // Default to true while loading
    const [isStudentAthlete, setIsStudentAthlete] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        async function checkVerification() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('athlete_profiles')
                .select('verification_status, status')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                setIsVerified(profile.verification_status === true);
                setIsStudentAthlete(profile.status === 'current');
            }
        }
        checkVerification();
    }, [supabase]);

    const handleRefine = async () => {
        if (!context.trim()) {
            toast.error("Write a bit of your message first, then I can give you feedback.");
            return;
        }

        setIsRefining(true);
        setSuggestions([]);
        try {
            const recipientInfo = recipient
                ? [recipient.name, recipient.role, recipient.industry, recipient.company && `at ${recipient.company}`, `${recipient.sport} · ${recipient.school}`]
                    .filter(Boolean)
                    .join(", ")
                : undefined;
            const result = await refineRequestDraft(context, recipientInfo);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            setSuggestions(result.suggestions);
        } catch {
            toast.error("Could not get suggestions right now. Please try again.");
        } finally {
            setIsRefining(false);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            const result = await submitRequest(formData);
            if (result.success) {
                setIsSuccess(true);
                toast.success("Request sent successfully!", {
                    description: "Your request has been sent and it'll be in the other person's inbox.",
                });
                // We let the user view the inline success state instead of immediately closing
            } else {
                toast.error("Failed to send request", {
                    description: result.error
                });
            }
        } catch (_err) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Request Sent Successfully!</h3>
                <p className="text-muted-foreground max-w-sm text-sm">
                    Your request has been sent and it&apos;ll be in the other person&apos;s inbox. You can check its status anytime in your requests dashboard.
                </p>
                <Button onClick={() => onSuccess && onSuccess()} className="mt-6 w-full max-w-[200px] h-12 rounded-xl text-md">
                    Done
                </Button>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="space-y-8">
            {recipient && (
                <div className="flex items-center gap-5 p-5 rounded-3xl bg-secondary/5 border border-secondary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] grayscale pointer-events-none">
                        <Send className="h-20 w-20 rotate-12" />
                    </div>
                    <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                        <AvatarImage src={recipient.imageUrl} alt={recipient.name} />
                        <AvatarFallback className="bg-gradient-to-br from-muted to-border font-bold">
                            {recipient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <p className="text-base font-bold text-primary">
                            Connecting with {recipient.name}
                        </p>
                        <div className="flex flex-col gap-1 mt-1 font-medium text-xs">
                            {recipient.company && recipient.position ? (
                                <span className="text-primary">{recipient.position} at {recipient.company}</span>
                            ) : null}
                            <div className="flex flex-wrap gap-2 items-center">
                                {recipient.industry && (
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-2 bg-secondary/10 text-secondary border-none pointer-events-none">{recipient.industry}</Badge>
                                )}
                                <Badge variant="default" className="text-[10px] uppercase tracking-wider py-0 px-2 bg-secondary/10 text-secondary border-none hover:bg-secondary/20 transition-colors pointer-events-none">{recipient.sport}</Badge>
                                <span className="text-muted-foreground">• {recipient.school}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isVerified && (
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold">Unverified Profile</p>
                        <p className="text-xs leading-relaxed">
                            Unverified profiles have much harder of a time connecting with others. Consider verifying your profile to build trust.
                        </p>
                    </div>
                </div>
            )}

            {isStudentAthlete && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/5 border border-secondary/15">
                    <Heart className="h-4 w-4 shrink-0 mt-0.5 text-secondary" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        Quick thought before you send this: try not to reach out only when you need
                        something. The best connections here start as real ones — stay in touch, get to
                        know people, and keep an eye out for ways you can help them too, not just what
                        you&apos;re after right now.
                    </p>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-secondary" />
                        Request Type
                    </label>
                    <Select name="type" required className="rounded-2xl h-12 bg-muted/20 border-border/50">
                        <option value="">Select type...</option>
                        <option value="network">Just to network</option>
                        <option value="background_interest">Found your background interesting</option>
                        <option value="chat">Just want to chat</option>
                        <option value="advice">Career Advice</option>
                        <option value="internship">Internship Inquiry</option>
                        <option value="referral">Job Referral</option>
                        <option value="mentorship">Mentorship</option>
                    </Select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-secondary" />
                        Time Commitment
                    </label>
                    <Select name="time_commitment" className="rounded-2xl h-12 bg-muted/20 border-border/50">
                        <option value="">No preference</option>
                        <option value="flexible">Flexible / just connecting</option>
                        <option value="15min">15 min Coffee Chat</option>
                        <option value="30min_call">30 min Call</option>
                        <option value="30min_coffee">30 min Coffee Chat</option>
                        <option value="mentorship">Ongoing Mentorship</option>
                        <option value="review">Resume Review</option>
                    </Select>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-bold">
                    {recipient
                        ? `Tell ${recipient.name.split(" ")[0]} why you're reaching out`
                        : "Context"}
                </label>
                <Textarea
                    name="context"
                    value={context}
                    className="min-h-[140px] rounded-3xl bg-muted/20 border-border/50 p-6 resize-none focus-visible:ring-secondary/50 transition-all font-medium text-sm leading-relaxed"
                    onChange={(e) => setContext(e.target.value)}
                    placeholder={
                        recipient
                            ? `Hi ${recipient.name.split(" ")[0]
                            }, I'm a fellow student-athlete interested in...`
                            : "e.g. D1 Swimmer, Junior year at Stanford, looking to break into finance..."
                    }
                    maxLength={500}
                    required
                />
            </div>

            {suggestions.length > 0 && (
                <div className="rounded-3xl border border-secondary/15 bg-secondary/5 p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-secondary" />
                        <p className="text-sm font-bold">A few ways to make it land</p>
                    </div>
                    <ul className="space-y-2">
                        {suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary/60" />
                                {s}
                            </li>
                        ))}
                    </ul>
                    <p className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-widest pt-1">
                        Your words, your call — edit above as you like
                    </p>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 pt-4">
                <Button
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl border-secondary/30 text-secondary font-bold hover:bg-secondary/5 gap-2 group transition-all"
                    type="button"
                    onClick={handleRefine}
                    disabled={isRefining}
                >
                    <Lightbulb className={cn("h-5 w-5", isRefining && "animate-pulse")} />
                    {isRefining ? "Reviewing..." : "Review my draft"}
                </Button>

                <Button
                    className="flex-2 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 gap-2 min-w-[200px]"
                    type="submit"
                    disabled={isSubmitting || isRefining}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="h-5 w-5" />
                            Send Personal Request
                        </>
                    )}
                </Button>
            </div>

            <input type="hidden" name="recipient_id" value={recipient?.id || ""} />
        </form>
    );
}
