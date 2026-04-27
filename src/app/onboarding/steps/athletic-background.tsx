"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OnboardingData } from "../onboarding-form";
import { SportSelect } from "../sport-select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Plus, Trash2 } from "lucide-react";

interface AthleticBackgroundStepProps {
  data: OnboardingData["athletic"];
  updateData: (values: Partial<OnboardingData["athletic"]>) => void;
}

export function AthleticBackgroundStep({ data, updateData }: AthleticBackgroundStepProps) {
  const handleSportToggle = (selectedNames: string[]) => {
    // Sync sports array
    const currentSports = [...data.sports];
    
    // Add new sports
    const updatedSports = selectedNames.map(name => {
      const existing = currentSports.find(s => s.name === name);
      if (existing) return existing;
      return { name, division: "NCAA Division I", role: "Starter / key rotation", start_year: "", end_year: "" };
    });

    updateData({ sports: updatedSports });
  };

  const updateSportDetail = (index: number, values: any) => {
    const newSports = [...data.sports];
    newSports[index] = { ...newSports[index], ...values };
    updateData({ sports: newSports });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="text-sm font-medium">Are you a current or former college student-athlete?</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => updateData({ is_athlete: true })}
            className={`flex-1 py-4 rounded-lg border-2 font-medium transition-all ${
              data.is_athlete === true ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:border-border"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => updateData({ is_athlete: false })}
            className={`flex-1 py-4 rounded-lg border-2 font-medium transition-all ${
              data.is_athlete === false ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:border-border"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {data.is_athlete ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary college / university</label>
              <Input
                value={data.college}
                onChange={(e) => updateData({ college: e.target.value })}
                placeholder="Yale University"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary college / university (optional)</label>
              <Input
                value={data.secondary_college}
                onChange={(e) => updateData({ secondary_college: e.target.value })}
                placeholder="Grad school or transfer"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-primary">Sport(s) played</label>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Select all that apply</span>
            </div>
            <SportSelect 
              selectedSports={data.sports.map(s => s.name)} 
              onChange={handleSportToggle} 
            />
          </div>

          {data.sports.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-border/40">
              <label className="text-sm font-medium text-primary">Provide details for each sport</label>
              {data.sports.map((sport, index) => (
                <Card key={sport.name} className="border-border/40 bg-muted/10">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary">{sport.name}</span>
                      <button 
                        onClick={() => updateData({ sports: data.sports.filter((_, i) => i !== index) })}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Competition Level</label>
                        <Select
                          value={sport.division}
                          onChange={(e) => updateSportDetail(index, { division: e.target.value })}
                        >
                          <option>NCAA Division I</option>
                          <option>NCAA Division II</option>
                          <option>NCAA Division III</option>
                          <option>NAIA</option>
                          <option>NJCAA / Community College</option>
                          <option>Club / Non-NCAA Collegiate</option>
                          <option>Other</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Team Role</label>
                        <Select
                          value={sport.role}
                          onChange={(e) => updateSportDetail(index, { role: e.target.value })}
                        >
                          <option>Starter / key rotation</option>
                          <option>Squad member / depth</option>
                          <option>Redshirted</option>
                          <option>Walk-on</option>
                          <option>Other</option>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Start Year</label>
                        <Select
                          value={sport.start_year}
                          onChange={(e) => updateSportDetail(index, { start_year: e.target.value })}
                        >
                          <option value="" disabled>Year</option>
                          {Array.from({ length: 40 }, (_, i) => 2029 - i).map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">End Year</label>
                        <Select
                          value={sport.end_year}
                          onChange={(e) => updateSportDetail(index, { end_year: e.target.value })}
                        >
                          <option value="" disabled>Year</option>
                          <option value="Present">Present</option>
                          {Array.from({ length: 40 }, (_, i) => 2029 - i).map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex gap-3 italic text-primary text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Relay is primarily for college athletes, but we welcome everyone in the ecosystem!
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">Have you competed at a high level in any sport (e.g., national, pro, or equivalent)?</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => updateData({ high_level: true })}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                  data.high_level === true ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:border-border"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => updateData({ high_level: false })}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                  data.high_level === false ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:border-border"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {data.high_level && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sport(s)</label>
                <Input
                  value={data.high_level_sports}
                  onChange={(e) => updateData({ high_level_sports: e.target.value })}
                  placeholder="e.g. Soccer, Swimming"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Level and organization</label>
                <Input
                  value={data.high_level_details}
                  onChange={(e) => updateData({ high_level_details: e.target.value })}
                  placeholder="e.g. Major League Soccer, US National Team"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
