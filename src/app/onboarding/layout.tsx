import React from "react";
import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container flex h-full items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
            <span className="text-xl font-bold tracking-tight text-primary">Relay</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest hidden sm:block">
              Onboarding
            </span>
          </div>
        </div>
      </header>
      <main className="pt-24 pb-12">
        <div className="container px-4 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
