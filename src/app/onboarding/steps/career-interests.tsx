"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingData } from "../onboarding-form";
import { cn } from "@/lib/utils";

interface CareerInterestsStepProps {
  data: OnboardingData["career"];
  updateData: (values: Partial<OnboardingData["career"]>) => void;
}

const goals = [
  "Career exploration / informational chats",
  "Internship opportunities",
  "Full-time job opportunities",
  "Industry-specific advice",
  "Transition support after sport",
  "Mentorship / role models",
  "Giving back / mentoring others"
];

const sectors = [
  "Finance & Banking", "Consulting", "Technology & Software", 
  "Healthcare & Medicine", "Law", "Sports Management & Coaching",
  "Media, Entertainment & Content", "Marketing & Advertising", 
  "Real Estate", "Education", "Government & Public Policy",
  "Nonprofit & Social Impact", "Entrepreneurship / Startups", 
  "Engineering", "Sales & Business Development"
];

const hoursOptions = [
  "Less than 2 hours", "2–5 hours", "5–10 hours", "10+ hours"
];

export function CareerInterestsStep({ data, updateData }: CareerInterestsStepProps) {
  const toggleGoal = (goal: string) => {
    const current = [...data.goals];
    if (current.includes(goal)) {
      updateData({ goals: current.filter(g => g !== goal) });
    } else {
      updateData({ goals: [...current, goal] });
    }
  };

  const toggleSector = (sector: string) => {
    const current = [...data.sectors];
    if (current.includes(sector)) {
      updateData({ sectors: current.filter(s => s !== sector) });
    } else {
      updateData({ sectors: [...current, sector] });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="text-sm font-medium text-primary uppercase tracking-wider">What are you primarily looking for on Relay?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {goals.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm",
                data.goals.includes(goal)
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : "border-border/40 hover:border-border hover:bg-muted/30 text-muted-foreground"
              )}
            >
              <div className={cn(
                "h-4 w-4 rounded-sm border flex items-center justify-center transition-colors",
                data.goals.includes(goal) ? "bg-primary border-primary" : "border-muted"
              )}>
                {data.goals.includes(goal) && <div className="h-2 w-2 bg-white rounded-full" />}
              </div>
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/40">
        <label className="text-sm font-medium text-primary uppercase tracking-wider">Which sectors or fields interest you most?</label>
        <div className="flex flex-wrap gap-2">
          {sectors.map((sector) => (
            <button
              key={sector}
              type="button"
              onClick={() => toggleSector(sector)}
              className={cn(
                "px-4 py-2 rounded-full border text-xs font-semibold transition-all",
                data.sectors.includes(sector)
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border/60 hover:border-border hover:bg-muted text-muted-foreground"
              )}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/40">
        <div className="space-y-2">
          <label className="text-sm font-medium">Desired locations (cities/countries)</label>
          <Input
            value={data.locations}
            onChange={(e) => updateData({ locations: e.target.value })}
            placeholder="e.g. New York, London, Remote"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Weekly commitment (hours)</label>
          <Select
            value={data.hours}
            onChange={(e) => updateData({ hours: e.target.value })}
          >
            <option value="" disabled>Select range</option>
            {hoursOptions.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground italic">Factoring in practice, travel, and classes.</p>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-sm font-medium flex items-center gap-2">
            Meeting / Scheduling Link (optional)
            <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded uppercase font-bold">New</span>
          </label>
          <Input
            value={data.scheduling}
            onChange={(e) => updateData({ scheduling: e.target.value })}
            placeholder="calendly.com/your-name"
            type="url"
          />
          <p className="text-xs text-muted-foreground">Add your Calendly, SavvyCal, or a link to your booking page to allow users to meet with you.</p>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-border/40">
        <label className="text-sm font-medium">What do you hope to achieve on Relay?</label>
        <Textarea
          value={data.aspiration}
          onChange={(e) => updateData({ aspiration: e.target.value })}
          placeholder="In 1–2 sentences, describe what you hope Relay can help you with over the next 12–24 months."
          className="min-h-[100px] resize-none"
        />
        <p className="text-xs text-right text-muted-foreground">{data.aspiration.length}/250</p>
      </div>
    </div>
  );
}
