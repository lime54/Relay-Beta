"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Users,
    ShieldCheck,
    FileText,
    SlidersHorizontal,
    CalendarClock,
    Sparkles,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";

const SEEN_KEY = "relay_welcome_seen_v1";

type Step = {
    icon: React.ReactNode;
    title: string;
    body: React.ReactNode;
};

const STEPS: Step[] = [
    {
        icon: <Sparkles className="h-7 w-7" />,
        title: "Welcome to Relay 👋",
        body: (
            <>
                You&apos;re now part of a private network built for student-athletes and alumni who
                get where you&apos;re coming from. Here&apos;s a 60-second tour of what you can do.
            </>
        ),
    },
    {
        icon: <Users className="h-7 w-7" />,
        title: "Connect with people who get it",
        body: (
            <>
                Reach out to <strong>alumni</strong> for advice, or to <strong>fellow student-athletes</strong> just
                to network. When you send a request you choose <em>why</em> you&apos;re reaching out — from
                <span className="whitespace-nowrap"> &ldquo;Just to network&rdquo;</span> and
                <span className="whitespace-nowrap"> &ldquo;Found your background interesting&rdquo;</span> to
                career advice, referrals, or mentorship. No pressure to be transactional.
            </>
        ),
    },
    {
        icon: <ShieldCheck className="h-7 w-7" />,
        title: "Get verified",
        body: (
            <>
                Tap <strong>Verify Now</strong> on your profile. We check your official team roster
                automatically to confirm you&apos;re a real athlete — verified members get noticeably more
                responses. If we can&apos;t auto-confirm it, our team reviews it by hand.
            </>
        ),
    },
    {
        icon: <FileText className="h-7 w-7" />,
        title: "Build your profile in seconds",
        body: (
            <>
                Hit <strong>Update Resume</strong> and upload a PDF — we auto-fill your experience and
                education for you. Add your <strong>LinkedIn</strong> so people can learn more, and set a
                custom title under your name.
            </>
        ),
    },
    {
        icon: <SlidersHorizontal className="h-7 w-7" />,
        title: "Find the right people",
        body: (
            <>
                On the <strong>Network</strong> page, filter by <strong>sport</strong>, <strong>industry</strong>,
                and <strong>student-athlete vs. alumni</strong>. We even suggest people you&apos;ll click with
                based on what you have in common — so you always know who to reach out to.
            </>
        ),
    },
    {
        icon: <CalendarClock className="h-7 w-7" />,
        title: "Message & book meetings",
        body: (
            <>
                Once you connect, <strong>message</strong> each other directly. Add your
                <strong> booking link</strong> (Calendly, Cal.com, anything) under Settings → Scheduling, and
                people can grab a time with you in one tap — no back-and-forth texting.
            </>
        ),
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
            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-3xl border-none">
                <DialogTitle className="sr-only">{current.title}</DialogTitle>

                {/* Branded header */}
                <div className="bg-gradient-to-br from-[#10193f] to-[#223a86] px-7 pt-7 pb-8 text-white">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/relay-logo.png" alt="Relay" className="h-6 w-auto brightness-0 invert" />
                        </div>
                        <button onClick={finish} className="text-[11px] font-semibold uppercase tracking-wider text-white/50 hover:text-white/80 transition-colors">
                            Skip
                        </button>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white">
                        {current.icon}
                    </div>
                    <h2 className="text-2xl font-bold mt-4 leading-tight">{current.title}</h2>
                </div>

                {/* Body */}
                <div className="px-7 py-6">
                    <p className="text-[15px] leading-relaxed text-muted-foreground">{current.body}</p>

                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5 mt-7">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                aria-label={`Go to step ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-secondary" : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"}`}
                            />
                        ))}
                    </div>

                    {/* Nav */}
                    <div className="flex items-center justify-between mt-5">
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
