"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, User, MessageSquare, ShieldCheck, Home, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [athletes, setAthletes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setAthletes([]);
            return;
        }
        
        setLoading(true);
        const timer = setTimeout(async () => {
            const { data } = await supabase
                .from('users')
                .select('id, name, athlete_profiles(school, sport, is_athlete, avatar_url)')
                .ilike('name', `%${query}%`)
                .limit(5);
            if (data) setAthletes(data);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, supabase]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 backdrop-blur-sm bg-background/80" onClick={() => setOpen(false)}>
            <Command
                className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95"
                shouldFilter={false}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center border-b border-border/50 px-4">
                    <Search className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
                    <Command.Input
                        className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Type a command or search for athletes..."
                        value={query}
                        onValueChange={setQuery}
                        autoFocus
                    />
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                        {loading ? "Searching..." : "No results found."}
                    </Command.Empty>

                    {athletes.length > 0 && (
                        <Command.Group heading="Athletes" className="px-2 text-xs font-medium text-muted-foreground mb-2">
                            {athletes.map((athlete) => (
                                <Command.Item
                                    key={athlete.id}
                                    onSelect={() => runCommand(() => router.push(`/profile/${athlete.id}`))}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer hover:bg-muted aria-selected:bg-muted text-foreground"
                                >
                                    {athlete.athlete_profiles?.avatar_url ? (
                                        <img src={athlete.athlete_profiles.avatar_url} alt="" className="h-8 w-8 rounded-full border border-border/50 object-cover" />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold text-xs">
                                            {athlete.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{athlete.name}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {athlete.athlete_profiles?.sport || "Multi-Sport"} • {athlete.athlete_profiles?.school || "Athlete"}
                                        </span>
                                    </div>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    <Command.Group heading="Quick Links" className="px-2 text-xs font-medium text-muted-foreground mt-4">
                        <Command.Item onSelect={() => runCommand(() => router.push('/dashboard'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer hover:bg-muted aria-selected:bg-muted text-foreground mb-1">
                            <Home className="h-4 w-4 text-primary" /> Dashboard
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push('/network'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer hover:bg-muted aria-selected:bg-muted text-foreground mb-1">
                            <Users className="h-4 w-4 text-blue-500" /> Network
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push('/messages'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer hover:bg-muted aria-selected:bg-muted text-foreground mb-1">
                            <MessageSquare className="h-4 w-4 text-green-500" /> Messages
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push('/profile'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer hover:bg-muted aria-selected:bg-muted text-foreground mb-1">
                            <User className="h-4 w-4 text-amber-500" /> Profile
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push('/profile/verify'))} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer hover:bg-muted aria-selected:bg-muted text-foreground">
                            <ShieldCheck className="h-4 w-4 text-purple-500" /> Verify Identity
                        </Command.Item>
                    </Command.Group>
                </Command.List>
                
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5 text-[10px] text-muted-foreground bg-muted/20">
                    <div className="flex items-center gap-1">
                        Navigate with <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">↑</kbd> <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">↓</kbd>
                    </div>
                    <div className="flex items-center gap-1">
                        Select with <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">Enter</kbd>
                    </div>
                </div>
            </Command>
        </div>
    );
}
