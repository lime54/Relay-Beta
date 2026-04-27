"use client";

import { useEffect, useState } from "react";
import { getSimilarityScore } from "@/app/(dashboard)/profile/actions";
import { Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SimilarityScoreProps {
  targetUserId: string;
  className?: string;
}

export function SimilarityScore({ targetUserId, className }: SimilarityScoreProps) {
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchScore() {
      try {
        const result = await getSimilarityScore(targetUserId);
        setScore(result.score);
      } catch (error) {
        console.error("Failed to fetch similarity score:", error);
        setScore(0);
      } finally {
        setIsLoading(false);
      }
    }
    fetchScore();
  }, [targetUserId]);

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/5 border border-secondary/10", className)}>
        <Loader2 className="h-3 w-3 animate-spin text-secondary" />
        <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">Calculating...</span>
      </div>
    );
  }

  if (score === null) return null;

  // Color logic based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return "bg-green-500/10 text-green-600 border-green-500/20";
    if (s >= 50) return "bg-secondary/10 text-secondary border-secondary/20";
    if (s > 0) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-muted/80 text-muted-foreground border-border/50";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Strong Match";
    if (s >= 50) return "Good Match";
    if (s > 0) return "Some Overlap";
    return "New Connection";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm transition-all hover:scale-105",
          getScoreColor(score),
          className
        )}
      >
        <Sparkles className="h-3 w-3" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {score > 0 ? `${score}% Match` : getScoreLabel(score)}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
