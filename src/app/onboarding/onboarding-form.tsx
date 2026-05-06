"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, Trophy, Target, Check, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitOnboarding } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type OnboardingData = {
  step: number;
  first_name: string;
  last_name: string;
  preferred_name: string;
  grad_year: string;
  sectors: string[];
  aspiration: string;
};

const SECTORS = [
  "Finance & Banking", "Consulting", "Technology & Software",
  "Healthcare & Medicine", "Law", "Sports Management & Coaching",
  "Media, Entertainment & Content", "Marketing & Advertising",
  "Real Estate", "Education", "Government & Public Policy",
  "Nonprofit & Social Impact", "Entrepreneurship / Startups",
  "Engineering", "Sales & Business Development",
];

const STEP_COUNT = 3;

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            s === current ? "w-8 bg-primary" : s < current ? "w-2 bg-primary/50" : "w-2 bg-muted"
          )}
        />
      ))}
    </div>
  );
}

export function OnboardingForm({ user }: { user: any }) {
  const fullName = user?.user_metadata?.name || "";
  const [firstName, ...lastParts] = fullName.split(" ");
  const lastName = lastParts.join(" ");
  const signupRole = user?.user_metadata?.role || "student";
  const signupSport = user?.user_metadata?.sport || "";
  const signupSchool = user?.user_metadata?.school || "";

  const [data, setData] = useState<OnboardingData>({
    step: 1,
    first_name: firstName || "",
    last_name: lastName || "",
    preferred_name: "",
    grad_year: "",
    sectors: [],
    aspiration: "",
  });

  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const update = (values: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...values }));

  const toggleSector = (sector: string) => {
    const current = [...data.sectors];
    if (current.includes(sector)) {
      update({ sectors: current.filter((s) => s !== sector) });
    } else {
      update({ sectors: [...current, sector] });
    }
  };

  const canGoNext = () => {
    if (data.step === 1) {
      if (!data.first_name.trim()) return "First name is required";
      if (!data.last_name.trim()) return "Last name is required";
      if (!/^\d{4}$/.test(data.grad_year)) return "Enter a valid 4-digit graduation year";
      return null;
    }
    if (data.step === 2) {
      if (data.sectors.length === 0) return "Pick at least one sector";
      return null;
    }
    return null;
  };

  const nextStep = async () => {
    const err = canGoNext();
    if (err) { toast.error(err); return; }

    if (data.step < STEP_COUNT) {
      setDir(1);
      update({ step: data.step + 1 });
      return;
    }

    // Final step — submit
    setIsSubmitting(true);
    try {
      const status = signupRole === "alum" ? "former" : "current";
      const result = await submitOnboarding({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        preferred_name: data.preferred_name.trim(),
        email: user?.email || "",
        status,
        school: signupSchool,
        sport: signupSport,
        grad_year: data.grad_year,
        sectors: data.sectors,
        aspiration: data.aspiration.trim(),
      });

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success("Welcome to Relay!");
      update({ step: STEP_COUNT + 1 });
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    if (data.step > 1) { setDir(-1); update({ step: data.step - 1 }); }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 60 : -60, opacity: 0 }),
  };

  // Success screen
  if (data.step > STEP_COUNT) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-20 space-y-6"
      >
        <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Rocket className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">You&apos;re all set, {data.preferred_name || data.first_name}!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your profile is live. Start connecting with athletes, explore the network, and build your career.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="rounded-full px-8 h-12 text-base font-semibold gap-2">
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <StepDots current={data.step} />

      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={data.step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
            className="w-full"
          >
            <Card className="border-border/40 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">

                {/* ── Step 1: Welcome ── */}
                {data.step === 1 && (
                  <div className="space-y-6">
                    <header className="text-center mb-8">
                      <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Trophy className="h-7 w-7 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">Welcome to Relay</h2>
                      <p className="text-muted-foreground mt-1">Confirm your info to get started — takes 30 seconds.</p>

                      {(signupSchool || signupSport) && (
                        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                          {signupSchool && (
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{signupSchool}</span>
                          )}
                          {signupSport && (
                            <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">{signupSport}</span>
                          )}
                        </div>
                      )}
                    </header>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First name</label>
                        <Input value={data.first_name} onChange={(e) => update({ first_name: e.target.value })} placeholder="John" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last name</label>
                        <Input value={data.last_name} onChange={(e) => update({ last_name: e.target.value })} placeholder="Doe" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preferred name <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <Input value={data.preferred_name} onChange={(e) => update({ preferred_name: e.target.value })} placeholder="Johnny" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Graduation year</label>
                        <Input
                          value={data.grad_year}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            update({ grad_year: v });
                          }}
                          placeholder="2027"
                          inputMode="numeric"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Career Interests ── */}
                {data.step === 2 && (
                  <div className="space-y-6">
                    <header className="text-center mb-8">
                      <div className="h-14 w-14 mx-auto rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                        <Target className="h-7 w-7 text-secondary" />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">What interests you?</h2>
                      <p className="text-muted-foreground mt-1">Pick the sectors you&apos;re curious about — you can always change these later.</p>
                    </header>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {SECTORS.map((sector) => (
                        <button
                          key={sector}
                          type="button"
                          onClick={() => toggleSector(sector)}
                          className={cn(
                            "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                            data.sectors.includes(sector)
                              ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                              : "border-border/60 hover:border-primary/40 hover:bg-muted text-muted-foreground"
                          )}
                        >
                          {data.sectors.includes(sector) && <Check className="inline h-3.5 w-3.5 mr-1.5 -ml-1" />}
                          {sector}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 pt-4">
                      <label className="text-sm font-medium">Anything specific you&apos;re hoping to get from Relay? <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <Input
                        value={data.aspiration}
                        onChange={(e) => update({ aspiration: e.target.value })}
                        placeholder="e.g. Land a summer internship in consulting"
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 3: Review & Submit ── */}
                {data.step === 3 && (
                  <div className="space-y-6">
                    <header className="text-center mb-6">
                      <div className="h-14 w-14 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                        <Sparkles className="h-7 w-7 text-accent" />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">Looking good!</h2>
                      <p className="text-muted-foreground mt-1">Here&apos;s a quick summary. Hit submit to join the network.</p>
                    </header>

                    <div className="space-y-3 max-w-md mx-auto">
                      <div className="flex justify-between items-center py-2 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm font-medium">{data.first_name} {data.last_name}</span>
                      </div>
                      {signupSchool && (
                        <div className="flex justify-between items-center py-2 border-b border-border/40">
                          <span className="text-sm text-muted-foreground">School</span>
                          <span className="text-sm font-medium">{signupSchool}</span>
                        </div>
                      )}
                      {signupSport && (
                        <div className="flex justify-between items-center py-2 border-b border-border/40">
                          <span className="text-sm text-muted-foreground">Sport</span>
                          <span className="text-sm font-medium">{signupSport}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2 border-b border-border/40">
                        <span className="text-sm text-muted-foreground">Graduation</span>
                        <span className="text-sm font-medium">{data.grad_year}</span>
                      </div>
                      <div className="flex justify-between items-start py-2">
                        <span className="text-sm text-muted-foreground">Interests</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                          {data.sectors.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground pt-2">
                      You can always update your profile, add a resume, and set up your calendar later.
                    </p>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-border/40">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={data.step === 1 || isSubmitting}
                    className="gap-2 h-11 px-6 rounded-full group"
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="gap-2 h-11 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 group font-semibold"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                    ) : data.step === STEP_COUNT ? (
                      <><Sparkles className="h-4 w-4" /> Submit</>
                    ) : (
                      <>Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
