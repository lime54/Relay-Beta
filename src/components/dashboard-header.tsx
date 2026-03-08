"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function DashboardHeader() {
    const [pendingCount, setPendingCount] = useState(0);
    const [userName, setUserName] = useState("Athlete");
    const [userInitials, setUserInitials] = useState("AT");
    const [userAvatar, setUserAvatar] = useState("");
    const supabase = createClient();

    useEffect(() => {
        async function getInitialData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Set user name from metadata or email
            const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Athlete';
            setUserName(name);
            setUserInitials(
                name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            );

            // Try to get avatar from athlete_profiles
            const { data: profile } = await supabase
                .from('athlete_profiles')
                .select('avatar_url')
                .eq('user_id', user.id)
                .single();

            if (profile?.avatar_url) {
                setUserAvatar(profile.avatar_url);
            }

            const { count } = await supabase
                .from('requests')
                .select('*', { count: 'exact', head: true })
                .neq('requester_id', user.id)
                .eq('status', 'pending');

            if (count !== null) setPendingCount(count);
        }

        getInitialData();

        // Subscribe to changes (optional for real-time, but good for MVP)
        const channel = supabase
            .channel('requests-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'requests'
            }, () => {
                getInitialData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 md:hidden">
                <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                </Button>
                <span className="font-bold text-lg">Relay</span>
            </div>

            <div className="hidden md:flex items-center bg-muted/50 rounded-full px-4 py-1.5 w-full max-w-md border border-border/20 focus-within:border-secondary/50 focus-within:ring-1 focus-within:ring-secondary/50 transition-all">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <input
                    placeholder="Search for alumni or students..."
                    className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
                />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <Link href="/requests">
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                        <Bell className="w-5 h-5" />
                        {pendingCount > 0 && (
                            <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 bg-secondary text-[10px] font-bold text-white rounded-full border-2 border-background">
                                {pendingCount > 9 ? '9+' : pendingCount}
                            </span>
                        )}
                    </Button>
                </Link>

                <div className="h-8 w-[1px] bg-border/50 mx-2 hidden md:block" />

                <Link href="/profile" className="flex items-center gap-3 pl-2 group">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-semibold leading-none group-hover:text-secondary transition-colors">{userName}</p>
                        <p className="text-xs text-muted-foreground group-hover:text-secondary/80 transition-colors">View Profile</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Avatar className="h-9 w-9 border-2 border-secondary/20 cursor-pointer group-hover:border-secondary/50 transition-colors">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback className="bg-secondary/10 text-secondary font-bold text-xs">{userInitials}</AvatarFallback>
                        </Avatar>
                    </motion.div>
                </Link>
            </div>
        </header>
    );
}
