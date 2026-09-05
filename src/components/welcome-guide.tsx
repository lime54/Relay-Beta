"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Users,
    ShieldCheck,
    FileText,
    SlidersHorizontal,
    Sparkles,
    MapPin,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";

const SEEN_KEY = "relay_welcome_seen_v2";

type Step = {
    icon: React.ReactNode;
    title: string;
    line: string;
    where?: string;
};

const STEPS: Step[] = [
    {
        icon: <Sparkles className="h-6 w-6" />,
        title: "Welcome to Relay",
        line: "Your private network of verified student-athletes and alumni. Here's what you can do in 30 seconds.",
    },
    {
        icon: <Users className="h-6 w-6" />,
        title: "Connect with anyone",
        line: "Reach out to alumni for advice or fellow athletes just to network — you pick the reason.",
        where: "Network → Send Personal Request",
    },
    {
        icon: <ShieldCheck className="h-6 w-6" />,
        title: "Get verified",
        line: "We confirm you're a real athlete from your team roster. Verified members get more replies.",
        where: "Sidebar → Verify Now",
    },
    {
        icon: <FileText className="h-6 w-6" />,
        title: "Set up your profile fast",
        line: "Upload your resume and we auto-fill your experience. Add your LinkedIn too.",
        where: "Profile → Update Resume",
    },
    {
        icon: <SlidersHorizontal className="h-6 w-6" />,
        title: "Find people & meet up",
        line: "Filter by sport & industry, message your connections, and share a booking link.",
        where: "Network → Filters · Settings → Scheduling",
    },
];

export function WelcomeGuide() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        try {
            if (!localStorage.getItem(SEEN_KEY)) {
                const t = setTimeout(() => setOpen(true), 600);
                return () => clearTimeout(t);
            }
        } catch {
            /* storage blocked — just don't show it */
        }
    }, []);

    const finish = () => {
        try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
        setOpen(false);
    };

    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-3xl border border-border/60">
                <DialogTitle className="sr-only">{current.title}</DialogTitle>

                {/* Header with the real Relay logo */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/relay-logo.png" alt="Relay" className="h-7 w-auto" />
                    <button onClick={finish} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors">
                        Skip
                    </button>
                </div>

                {/* Step */}
                <div className="px-6 py-7 text-center">
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                        {current.icon}
                    </div>
                    <h2 className="text-xl font-bold text-primary">{current.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-[320px] mx-auto">{current.line}</p>

                    {current.where && (
                        <div className="inline-flex items-center gap-1.5 mt-4 rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-foreground/70">
                            <MapPin className="h-3.5 w-3.5 text-secondary" />
                            {current.where}
                        </div>
                    )}

                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-1.5 mt-7">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                aria-label={`Go to step ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-secondary" : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between px-6 pb-6">
                    <Button
                        variant="ghost"
                        className="gap-1.5 text-muted-foreground disabled:opacity-0"
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                        disabled={step === 0}
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    {isLast ? (
                        <Button onClick={finish} className="rounded-xl px-6 gap-1.5 bg-secondary hover:bg-secondary/90 text-white">
                            Get started <Sparkles className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="rounded-xl px-6 gap-1.5">
                            Next <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
