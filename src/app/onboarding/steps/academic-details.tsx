"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OnboardingData } from "../onboarding-form";

interface AcademicDetailsStepProps {
  data: OnboardingData["academic"];
  updateData: (values: Partial<OnboardingData["academic"]>) => void;
}

const schoolYears = [
  "First-year / Freshman", "Sophomore", "Junior", "Senior", 
  "Fifth-year / Graduate student", "Alumni (0–2 years out)",
  "Alumni (3–5 years out)", "Alumni (6+ years out)"
];

const gpaRanges = [
  "Below 2.0", "2.0 – 2.49", "2.5 – 2.99", "3.0 – 3.49", 
  "3.5 – 3.79", "3.8 – 4.0", "Prefer not to say"
];

const currentYear = new Date().getFullYear();
const gradYears = Array.from({ length: 15 }, (_, i) => (currentYear - 5 + i).toString());

export function AcademicDetailsStep({ data, updateData }: AcademicDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Current school year or status</label>
        <Select
          id="academic-year"
          name="academic-year"
          value={data.year}
          onChange={(e) => updateData({ year: e.target.value })}
        >
          <option value="" disabled>Select status</option>
          {schoolYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Major(s)</label>
          <Input
            id="majors"
            name="majors"
            value={data.majors}
            onChange={(e) => updateData({ majors: e.target.value })}
            placeholder="e.g. Economics, CS"
            required
            autoComplete="organization-title"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Minor(s) (optional)</label>
          <Input
            id="minors"
            name="minors"
            value={data.minors}
            onChange={(e) => updateData({ minors: e.target.value })}
            placeholder="e.g. Psychology"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Graduation year (primary institution)</label>
          <Select
            id="grad-year"
            name="grad-year"
            value={data.grad_year}
            onChange={(e) => updateData({ grad_year: e.target.value })}
          >
            <option value="" disabled>Select year</option>
            {gradYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">GPA range (optional)</label>
          <Select
            id="gpa-range"
            name="gpa-range"
            value={data.gpa}
            onChange={(e) => updateData({ gpa: e.target.value })}
          >
            <option value="" disabled>Select range</option>
            {gpaRanges.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/40">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Citizenship & Authorization</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Country of citizenship</label>
          <Select
            value={data.citizenship}
            onChange={(e) => updateData({ citizenship: e.target.value })}
          >
            <option>United States</option>
            <option>Canada</option>
            <option>United Kingdom</option>
            <option>Other</option>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Do you currently have work authorization in the United States?</label>
          <Select
            value={data.work_auth}
            onChange={(e) => updateData({ work_auth: e.target.value })}
          >
            <option value="" disabled>Select option</option>
            <option>Yes</option>
            <option>No</option>
            <option>Not sure</option>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Are you interested in job opportunities in another country?</label>
            <button
              type="button"
              onClick={() => updateData({ international_interest: !data.international_interest })}
              className={`h-6 w-11 rounded-full p-1 transition-colors ${
                data.international_interest ? "bg-primary" : "bg-muted"
              }`}
            >
              <div className={`h-4 w-4 rounded-full bg-white transition-transform ${
                data.international_interest ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>
          
          {data.international_interest && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Which countries?</label>
              <Input
                value={data.target_countries}
                onChange={(e) => updateData({ target_countries: e.target.value })}
                placeholder="e.g. UK, Germany, Japan"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
