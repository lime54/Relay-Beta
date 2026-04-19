"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingData } from "../onboarding-form";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Mail, Globe, Upload, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationStepProps {
  data: OnboardingData["verification"];
  updateData: (values: Partial<OnboardingData["verification"]>) => void;
  profileEmail: string;
}

export function VerificationStep({ data, updateData, profileEmail }: VerificationStepProps) {
  const toggleMethod = (method: string) => {
    const current = [...data.methods];
    if (current.includes(method)) {
      updateData({ methods: current.filter(m => m !== method) });
    } else {
      updateData({ methods: [...current, method] });
    }
  };

  const methods = [
    { id: "A", title: "School email + roster link", icon: Mail, desc: "Fastest verification" },
    { id: "B", title: "Official roster or stats URL", icon: Globe, desc: "For alumni without .edu access" },
    { id: "C", title: "Upload proof", icon: Upload, desc: "Signed letter or team photo" },
    { id: "D", title: "Vouching", icon: Users, desc: "Verified teammate or coach" },
  ];

  return (
    <div className="space-y-8">
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex gap-4">
        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6 text-accent" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-accent italic">Trust & Safety</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Verification protects the community. A <strong>Relay-Verified</strong> badge signals that your athletic background is confirmed.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-primary">How would you like to verify?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => toggleMethod(method.id)}
              className={cn(
                "flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all group",
                data.methods.includes(method.id)
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border/40 hover:border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <method.icon className={cn(
                  "h-5 w-5 transition-colors",
                  data.methods.includes(method.id) ? "text-primary" : "text-muted-foreground"
                )} />
                {data.methods.includes(method.id) && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </div>
              <div>
                <p className={cn("text-xs font-bold", data.methods.includes(method.id) ? "text-primary" : "text-foreground")}>
                  {method.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{method.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {data.methods.includes("A") && (
          <div className="space-y-4 pt-6 border-t border-border/40 animate-in fade-in duration-300">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary italic">Option A: School Email + Roster</h4>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm .edu email</label>
              <Input
                value={data.edu_email || profileEmail}
                onChange={(e) => updateData({ edu_email: e.target.value })}
                placeholder="you@university.edu"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Link to official roster or bio page</label>
              <Input
                value={data.roster_link}
                onChange={(e) => updateData({ roster_link: e.target.value })}
                placeholder="https://goyale.com/sports/football/roster/your-name"
              />
            </div>
          </div>
        )}

        {data.methods.includes("B") && (
          <div className="space-y-4 pt-6 border-t border-border/40 animate-in fade-in duration-300">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary italic">Option B: Legacy Roster URL</h4>
            <div className="space-y-2">
              <label className="text-sm font-medium">Official roster link</label>
              <Input
                value={data.legacy_roster_link}
                onChange={(e) => updateData({ legacy_roster_link: e.target.value })}
                placeholder="Archived roster URL"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Season(s) covered</label>
              <Input
                value={data.legacy_seasons}
                onChange={(e) => updateData({ legacy_seasons: e.target.value })}
                placeholder="e.g. 2018-2022"
              />
            </div>
          </div>
        )}

        {data.methods.includes("C") && (
          <div className="space-y-4 pt-6 border-t border-border/40 animate-in fade-in duration-300">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary italic">Option C: Upload Proof</h4>
            <div className="h-32 rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer group">
              <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <p className="text-xs font-medium text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-[10px] text-muted-foreground mt-1">PDF, PNG, JPG (max 10MB)</p>
            </div>
            <Textarea
              value={data.proof_description}
              onChange={(e) => updateData({ proof_description: e.target.value })}
              placeholder="Briefly describe what you uploaded..."
              className="resize-none h-20"
            />
          </div>
        )}

        {data.methods.includes("D") && (
          <div className="space-y-4 pt-6 border-t border-border/40 animate-in fade-in duration-300">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary italic">Option D: Vouching</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Name</label>
                <Input value={data.vouch_name} onChange={(e) => updateData({ vouch_name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Email</label>
                <Input value={data.vouch_email} onChange={(e) => updateData({ vouch_email: e.target.value })} placeholder="vouch@email.com" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-6 border-t border-border/40">
        <label className="text-sm font-medium italic text-muted-foreground">Any additional context? (Injury, transfer, etc.)</label>
        <Textarea
          value={data.missed_time}
          onChange={(e) => updateData({ missed_time: e.target.value })}
          placeholder="Briefly explain here so we can verify you correctly..."
          className="resize-none h-20"
        />
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-border/40 flex items-start gap-3">
        <button
          type="button"
          onClick={() => updateData({ honesty_consent: !data.honesty_consent })}
          className={`h-5 w-5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
            data.honesty_consent ? "bg-primary border-primary" : "border-muted"
          }`}
        >
          {data.honesty_consent && <ShieldCheck className="h-3 w-3 text-white" />}
        </button>
        <div className="space-y-1">
          <p className="text-xs font-medium leading-tight">
            I confirm that the information I've provided is accurate. Falsifying credentials may result in removal from Relay.
          </p>
        </div>
      </div>
    </div>
  );
}
