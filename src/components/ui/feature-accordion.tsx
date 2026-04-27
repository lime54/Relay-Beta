"use client";

import React, { useState, useEffect } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, CheckCircle, MessageSquare, TrendingUp, ChevronDown } from "lucide-react";

const features = [
  {
    id: "feature-1",
    title: "Shared athlete experience",
    description: "Athletes develop discipline, resilience, and the ability to handle setbacks. These shared traits drive professional success and create a powerful, instant bond.",
    icon: <Users className="h-5 w-5" />,
    image: "/athlete_professional_transition_png_1777133632148.png",
  },
  {
    id: "feature-2",
    title: "Verified Community",
    description: "Every member is a verified NCAA student-athlete or alumni (D1, D2, D3). No strangers, no spam. Only a shared athletic background.",
    icon: <CheckCircle className="h-5 w-5" />,
    image: "/verified_athlete_community_png_1777133649233.png",
  },
  {
    id: "feature-3",
    title: "Structured Requests",
    description: "No \"picking your brain.\" Every ask is specific, respectful, and actionable—saving time for everyone.",
    icon: <MessageSquare className="h-5 w-5" />,
    image: "/structured_request_ui_png_1777133664229.png",
  },
  {
    id: "feature-4",
    title: "Trackable Outcomes",
    description: "Track your impact. From coffee chats to referrals, see how you're helping the next generation win.",
    icon: <TrendingUp className="h-5 w-5" />,
    image: "/athlete_impact_analytics_png_1777133683063.png",
  },
];

export function FeatureAccordion() {
  const [value, setValue] = useState<string>(features[0].id);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const activeFeature = features.find((f) => f.id === value) || features[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="order-2 lg:order-1">
        <AccordionPrimitive.Root
          type="single"
          defaultValue={features[0].id}
          value={value}
          onValueChange={(val) => val && setValue(val)}
          className="space-y-4"
        >
          {features.map((feature) => (
            <AccordionPrimitive.Item
              key={feature.id}
              value={feature.id}
              className={cn(
                "group rounded-2xl border border-border/50 transition-all duration-300",
                value === feature.id 
                  ? "bg-primary/5 border-primary/20 shadow-sm" 
                  : "hover:bg-muted/50"
              )}
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-6 px-6 text-left font-medium transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      value === feature.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}>
                      {feature.icon}
                    </div>
                    <span className={cn(
                      "text-xl font-semibold tracking-tight",
                      value === feature.id ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {feature.title}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                    value === feature.id && "rotate-180"
                  )} />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-6 pb-6 pt-0 ml-14">
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </div>

      <div className="order-1 lg:order-2 relative aspect-square lg:aspect-auto lg:h-[600px] overflow-hidden rounded-3xl border border-border bg-muted">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center p-4 lg:p-8"
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src={activeFeature.image}
                alt={activeFeature.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 blur-3xl rounded-full" />
      </div>
    </div>
  );
}
