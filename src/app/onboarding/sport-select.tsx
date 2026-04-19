"use client";

import React, { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ncaaSports = [
  "Football", "Men's Basketball", "Women's Basketball", "Baseball", "Softball",
  "Men's Soccer", "Women's Soccer", "Men's Lacrosse", "Women's Lacrosse",
  "Field Hockey", "Ice Hockey", "Volleyball", "Beach Volleyball", "Tennis", "Golf",
  "Swimming & Diving", "Track & Field (Indoor)", "Track & Field (Outdoor)",
  "Cross Country", "Wrestling", "Gymnastics", "Rowing", "Fencing", "Squash",
  "Rugby", "Water Polo", "Equestrian", "Sailing", "Skiing", "Bowling", "Rifle"
];

interface SportSelectProps {
  selectedSports: string[];
  onChange: (sports: string[]) => void;
}

export function SportSelect({ selectedSports, onChange }: SportSelectProps) {
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const filteredSports = ncaaSports.filter(sport => 
    sport.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      onChange(selectedSports.filter(s => s !== sport));
    } else {
      onChange([...selectedSports, sport]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredSports.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredSports.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && activeIndex !== -1) {
      e.preventDefault();
      toggleSport(filteredSports[activeIndex]);
    }
  };

  // Reset active index when search changes
  React.useEffect(() => {
    setActiveIndex(search ? 0 : -1);
  }, [search]);

  // Scroll active item into view
  React.useEffect(() => {
    if (activeIndex !== -1 && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 h-11 focus-visible:ring-primary"
        />
        {search && (
          <button 
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-2 min-h-6">
        {selectedSports.map(sport => (
          <div 
            key={sport} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold animate-in zoom-in-50 duration-200"
          >
            {sport}
            <button onClick={() => toggleSport(sport)}>
              <X className="h-3 w-3 hover:text-destructive transition-colors" />
            </button>
          </div>
        ))}
      </div>

      <div 
        ref={scrollContainerRef}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"
      >
        {filteredSports.map((sport, index) => {
          const isSelected = selectedSports.includes(sport);
          const isActive = index === activeIndex;
          return (
            <button
              key={sport}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => toggleSport(sport)}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-lg border-2 text-left transition-all text-sm font-medium",
                isSelected 
                  ? "border-primary bg-primary/5 text-primary" 
                  : isActive
                    ? "border-primary/50 bg-muted/50"
                    : "border-border/40 hover:border-border hover:bg-muted/30"
              )}
            >
              {sport}
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          );
        })}
        {filteredSports.length === 0 && (
          <p className="col-span-2 text-center py-8 text-muted-foreground italic">No sports found matching "{search}"</p>
        )}
      </div>
    </div>
  );
}
