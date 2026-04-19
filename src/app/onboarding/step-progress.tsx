"use client";

import { motion } from "framer-motion";
import { User, Trophy, GraduationCap, Target, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Profile", icon: User },
  { id: 2, label: "Athletic", icon: Trophy },
  { id: 3, label: "Academic", icon: GraduationCap },
  { id: 4, label: "Career", icon: Target },
  { id: 5, label: "Verify", icon: Shield },
];

interface StepProgressProps {
  currentStep: number;
}

export function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <div className="relative mb-8 px-4">
      <div className="flex justify-between relative z-10">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 group transition-all">
              <div
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isActive 
                    ? "border-primary bg-primary text-primary-foreground shadow-lg scale-110" 
                    : isCompleted 
                    ? "border-accent bg-accent text-accent-foreground" 
                    : "border-muted bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 animate-in zoom-in-50 duration-300" />
                ) : (
                  <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                )}
                
                {/* Connector line for mobile (hidden on lg, but kept logic) */}
                {step.id < steps.length && (
                   <div className="absolute left-full top-1/2 -z-10 h-[2px] w-[calc(100vw/5-40px)] max-w-[100px] -translate-y-1/2 bg-muted transition-colors duration-500 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: isCompleted ? "100%" : "0%" }}
                        className="h-full bg-accent"
                      />
                   </div>
                )}
              </div>
              <span 
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Background track line */}
      <div className="absolute top-[20px] left-[calc(10%+20px)] right-[calc(10%+20px)] h-[2px] bg-muted -z-0" />
    </div>
  );
}
