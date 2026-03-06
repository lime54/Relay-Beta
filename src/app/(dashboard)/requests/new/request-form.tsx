"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { refineRequestDraft, submitRequest } from "./actions";
import { Wand2, Send, Clock, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Recipient {
    id: string;
    name: string;
    sport: string;
    school: string;
    role: string;
    imageUrl?: string;
}

export function RequestForm({
    recipient,
    onSuccess,
}: {
    recipient?: Recipient;
    onSuccess?: () => void;
}) {
    const [context, setContext] = useState("");
    const [offer, setOffer] = useState("");
    const [isRefining, setIsRefining] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRefine = async () => {
        if (!context && !offer) {
            toast.error("Please add some context first so I can help you refine it!");
            return;
        }

        setIsRefining(true);
        try {
            const result = await refineRequestDraft(context, offer);
            setContext(result.refinedContext);
            setOffer(result.refinedOffer);
            toast.success("Draft refined!", {
                description: "Your message is now more professional and clear."
            });
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
                        <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="default" className="text-[10px] uppercase tracking-wider py-0 px-2 bg-secondary/10 text-secondary border-none hover:bg-secondary/20 transition-colors pointer-events-none">{recipient.sport}</Badge>
                            <span className="text-xs text-muted-foreground">• {recipient.school}</span>
                        </div>
                    </div>
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
                    <Select name="time_commitment" required className="rounded-2xl h-12 bg-muted/20 border-border/50">
                        <option value="">Select duration...</option>
                        <option value="15min">15 min Coffee Chat</option>
                        <option value="30min">30 min Deep Dive</option>
                        <option value="email">Quick Email Chat</option>
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

            <div className="space-y-3">
                <label className="text-sm font-bold">What You Offer in Return</label>
                <Input
                    name="offer"
                    value={offer}
                    className="h-12 rounded-2xl bg-muted/20 border-border/50 px-6 focus-visible:ring-secondary/50 font-medium text-sm"
                    onChange={(e) => setOffer(e.target.value)}
                    placeholder="e.g. I'll share my current network, provide campus insights..."
                    required
                />
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1">
                    Reciprocity builds long-term mentorship
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
                <Button
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl border-secondary/30 text-secondary font-bold hover:bg-secondary/5 gap-2 group transition-all"
                    type="button"
                    onClick={handleRefine}
                    disabled={isRefining}
                >
                    <Wand2 className={cn("h-5 w-5", isRefining && "animate-spin")} />
                    {isRefining ? "AI Writing..." : "AI Refine Draft"}
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
