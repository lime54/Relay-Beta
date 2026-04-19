"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OnboardingData } from "../onboarding-form";

interface BasicProfileStepProps {
  data: OnboardingData["profile"];
  updateData: (values: Partial<OnboardingData["profile"]>) => void;
}

const countries = [
  "United States", "Canada", "United Kingdom", "Australia", 
  "Germany", "France", "Japan", "Brazil", "India", "Other"
];

const statuses = [
  { id: "current", label: "Current college student-athlete" },
  { id: "former", label: "Former college student-athlete" },
  { id: "pro", label: "Current high-level athlete (non-NCAA or international)" },
  { id: "alumni", label: "Alumni / professional (non-athlete)" },
  { id: "staff", label: "Coach or staff" },
  { id: "other", label: "Other" },
];

export function BasicProfileStep({ data, updateData }: BasicProfileStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">First name</label>
          <Input
            id="first_name"
            name="first_name"
            value={data.first_name}
            onChange={(e) => updateData({ first_name: e.target.value })}
            placeholder="John"
            required
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Last name</label>
          <Input
            id="last_name"
            name="last_name"
            value={data.last_name}
            onChange={(e) => updateData({ last_name: e.target.value })}
            placeholder="Doe"
            required
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Preferred name (optional)</label>
        <Input
          id="preferred_name"
          name="preferred_name"
          value={data.preferred_name}
          onChange={(e) => updateData({ preferred_name: e.target.value })}
          placeholder="Johnny"
          autoComplete="nickname"
        />
        <p className="text-xs text-muted-foreground">What would you like people to call you?</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email address</label>
        <Input
          id="email"
          name="email"
          type="email"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          placeholder="you@university.edu"
          required
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">We recommend using your .edu email if you have one.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Country of residence</label>
        <Select
          id="country"
          name="country"
          value={data.country}
          onChange={(e) => updateData({ country: e.target.value })}
          autoComplete="country-name"
        >
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">LinkedIn URL (optional)</label>
        <Input
          id="linkedin"
          name="linkedin"
          type="url"
          value={data.linkedin}
          onChange={(e) => updateData({ linkedin: e.target.value })}
          placeholder="https://linkedin.com/in/yourname"
          autoComplete="url"
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-border/40">
        <label className="text-sm font-medium">Which best describes you right now?</label>
        <div className="grid grid-cols-1 gap-2">
          {statuses.map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => updateData({ status: status.id })}
              className={`flex items-center justify-between p-4 rounded-lg border-2 text-left transition-all ${
                data.status === status.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border/40 hover:border-border hover:bg-muted/30"
              }`}
            >
              <span className={`text-sm font-medium ${data.status === status.id ? "text-primary" : "text-foreground"}`}>
                {status.label}
              </span>
              <div
                className={`h-4 w-4 rounded-full border-2 transition-all ${
                  data.status === status.id ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {data.status === status.id && (
                  <div className="h-1.5 w-1.5 m-auto translate-y-[3px] rounded-full bg-white" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
