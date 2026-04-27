"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StepProgress } from "./step-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitOnboarding } from "./actions";
import { toast } from "sonner";

/* 
  Imports for sub-steps (to be created)
*/
import { BasicProfileStep } from "./steps/basic-profile";
import { AthleticBackgroundStep } from "./steps/athletic-background";
import { AcademicDetailsStep } from "./steps/academic-details";
import { CareerInterestsStep } from "./steps/career-interests";
import { VerificationStep } from "./steps/verification";

export type OnboardingData = {
  step: number;
  profile: {
    first_name: string;
    last_name: string;
    preferred_name: string;
    email: string;
    country: string;
    linkedin: string;
    status: string;
  };
  athletic: {
    is_athlete: boolean;
    college: string;
    secondary_college: string;
    sports: Array<{
      name: string;
      division: string;
      role: string;
      start_year: string;
      end_year: string;
    }>;
    high_level: boolean | null;
    high_level_sports: string;
    high_level_details: string;
  };
  academic: {
    year: string;
    majors: string;
    minors: string;
    grad_year: string;
    gpa: string;
    citizenship: string;
    work_auth: string;
    international_interest: boolean;
    target_countries: string;
  };
  career: {
    goals: string[];
    sectors: string[];
    locations: string;
    hours: string;
    aspiration: string;
    scheduling: string;
  };
  verification: {
    methods: string[];
    edu_email: string;
    roster_link: string;
    roster_name: string;
    legacy_roster_link: string;
    legacy_seasons: string;
    proof_description: string;
    vouch_name: string;
    vouch_role: string;
    vouch_school: string;
    vouch_email: string;
    missed_time: string;
    honesty_consent: boolean;
  };
};

const initialData: OnboardingData = {
  step: 1,
  profile: {
    first_name: "",
    last_name: "",
    preferred_name: "",
    email: "",
    country: "United States",
    linkedin: "",
    status: "",
  },
  athletic: {
    is_athlete: true,
    college: "",
    secondary_college: "",
    sports: [],
    high_level: null,
    high_level_sports: "",
    high_level_details: "",
  },
  academic: {
    year: "",
    majors: "",
    minors: "",
    grad_year: "",
    gpa: "",
    citizenship: "United States",
    work_auth: "",
    international_interest: false,
    target_countries: "",
  },
  career: {
    goals: [],
    sectors: [],
    locations: "",
    hours: "",
    aspiration: "",
    scheduling: "",
  },
  verification: {
    methods: [],
    edu_email: "",
    roster_link: "",
    roster_name: "",
    legacy_roster_link: "",
    legacy_seasons: "",
    proof_description: "",
    vouch_name: "",
    vouch_role: "",
    vouch_school: "",
    vouch_email: "",
    missed_time: "",
    honesty_consent: false,
  },
};

export function OnboardingForm({ user }: { user: any }) {
  const [data, setData] = useState<OnboardingData>(() => {
    // Check local storage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('relay_onboarding_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only use saved if it's the same user or if we don't care
          return parsed;
        } catch (e) {
          console.error("Failed to parse saved onboarding data", e);
        }
      }
    }

    const fullName = user?.user_metadata?.name || "";
    const [first_name, ...lastParts] = fullName.split(" ");
    const last_name = lastParts.join(" ");

    return {
      ...initialData,
      profile: {
        ...initialData.profile,
        first_name: first_name || "",
        last_name: last_name || "",
        email: user?.email || "",
      }
    };
  });

  // Save to local storage on change
  React.useEffect(() => {
    localStorage.setItem('relay_onboarding_data', JSON.stringify(data));
  }, [data]);

  const [dir, setDir] = useState<number>(1); // 1 for forward, -1 for backward
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const canGoNext = () => {
    if (data.step === 1) {
      if (data.profile.first_name.trim() === "") return { valid: false, message: "First name is required" };
      if (data.profile.last_name.trim() === "") return { valid: false, message: "Last name is required" };
      if (data.profile.email.trim() === "") return { valid: false, message: "Email is required" };
      if (data.profile.status === "") return { valid: false, message: "Please select your current status" };
      return { valid: true };
    }
    if (data.step === 2) {
      if (data.athletic.is_athlete) {
        if (data.athletic.college.trim() === "") return { valid: false, message: "College/University is required" };
        if (data.athletic.sports.length === 0) return { valid: false, message: "Please select at least one sport" };
        if (!data.athletic.sports.every(s => s.start_year.trim() !== "" && s.end_year.trim() !== "")) {
          return { valid: false, message: "Please provide start and end years for all sports" };
        }
      } else {
        if (data.athletic.high_level === null) return { valid: false, message: "Please select if you competed at a high level" };
      }
      return { valid: true };
    }
    if (data.step === 3) {
      // Academic details are now required for everyone
      if (data.academic.year === "") return { valid: false, message: "Current school year is required" };
      if (data.academic.majors.trim() === "") return { valid: false, message: "Major(s) is required" };
      if (data.academic.grad_year === "") return { valid: false, message: "Graduation year is required" };
      if (data.academic.work_auth === "") return { valid: false, message: "Work authorization status is required" };
      return { valid: true };
    }
    if (data.step === 4) {
      if (data.career.goals.length === 0) return { valid: false, message: "Please select at least one career goal" };
      if (data.career.sectors.length === 0) return { valid: false, message: "Please select at least one sector" };
      if (data.career.hours === "") return { valid: false, message: "Please select your preferred work hours" };
      if (data.career.aspiration.trim() === "") return { valid: false, message: "Aspiration description is required" };
      return { valid: true };
    }
    if (data.step === 5) {
      if (data.verification.methods.length === 0) return { valid: false, message: "Please select at least one verification method" };
      if (!data.verification.honesty_consent) return { valid: false, message: "Please consent to the honesty agreement" };
      return { valid: true };
    }
    return { valid: true };
  };

  const nextStep = async () => {
    const check = canGoNext();
    if (!check.valid) {
      import("sonner").then(({ toast }) => {
        toast.error(check.message || "Please fill in all required fields.");
      });
      return;
    }
    
    setIsSubmitting(true);
    // Add a tiny delay to ensure smooth transitions and feedback
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (data.step < 5) {
      setDir(1);
      setData((prev) => ({ ...prev, step: prev.step + 1 }));
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await submitForm();
    }
  };

  const prevStep = () => {
    if (data.step > 1) {
      setDir(-1);
      setData((prev) => ({ ...prev, step: prev.step - 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const updateData = (section: keyof OnboardingData, values: any) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as any), ...values },
    }));
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await submitOnboarding(data);
      
      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success("Welcome to Relay! Your profile is ready.");
      
      // Clear persistence
      localStorage.removeItem('relay_onboarding_data');
      
      // Delay slightly for the toast to be seen
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
      
    } catch (err) {
      console.error("Onboarding submission error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full">
      <StepProgress currentStep={data.step} />

      <div className="relative overflow-hidden min-h-[500px]">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={data.step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full"
          >
            <Card className="border-border/40 shadow-xl shadow-slate-200/50 dark:shadow-none bg-card/60 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                {/* Render current step - placeholder for now */}
                <div className="space-y-6">
                  <header className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-primary font-serif">
                      {["Basic Profile", "Athletic Background", "Academic Details", "Career Interests", "Verification"][data.step - 1]}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {["Let's get the basics down.", "Tell us about your sports career.", "Academic and eligibility info.", "What's next for you?", "Final check to verify your status."][data.step - 1]}
                    </p>
                  </header>

                  {data.step === 1 && (
                    <BasicProfileStep
                      data={data.profile}
                      updateData={(values) => updateData("profile", values)}
                    />
                  )}

                  {data.step === 2 && (
                    <AthleticBackgroundStep
                      data={data.athletic}
                      updateData={(values) => updateData("athletic", values)}
                    />
                  )}

                  {data.step === 3 && (
                    <AcademicDetailsStep
                      data={data.academic}
                      updateData={(values) => updateData("academic", values)}
                    />
                  )}

                  {data.step === 4 && (
                    <CareerInterestsStep
                      data={data.career}
                      updateData={(values) => updateData("career", values)}
                    />
                  )}

                  {data.step === 5 && (
                    <VerificationStep
                      data={data.verification}
                      updateData={(values) => updateData("verification", values)}
                      profileEmail={data.profile.email}
                    />
                  )}
                </div>

                <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-border/40">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={data.step === 1 || isSubmitting}
                    className="gap-2 h-11 px-6 rounded-full group transition-base"
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="gap-2 h-11 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 group font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {data.step === 5 ? "Submit" : "Continue"}
                        {data.step < 5 && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                      </>
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
