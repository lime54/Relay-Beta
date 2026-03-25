"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { DashboardSidebar } from "./dashboard-sidebar";
import { Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function DashboardHeader() {
    const [pendingCount, setPendingCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
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

            const { data: incomingRequests } = await supabase
                .from('requests')
                .select('id, request_type, status, created_at, users:requester_id(name)')
                .neq('requester_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            const { data: acceptedRequests } = await supabase
                .from('requests')
                .select('id, request_type, status, updated_at, users:requester_id(name)')
                .eq('requester_id', user.id)
                .eq('status', 'accepted')
                .order('updated_at', { ascending: false })
                .limit(5);

            const allNotifications = [
                ...(incomingRequests || []).map(r => ({
                    id: `incoming-${r.id}`,
                    type: 'request',
                    title: 'New Connection Request',
                    description: `${(Array.isArray(r.users) ? r.users[0]?.name : (r.users as any)?.name) || 'An athlete'} wants to connect.`,
                    time: r.created_at,
                    href: `/requests/${r.id}`,
                    icon: UserPlus
                })),
                ...(acceptedRequests || []).map(r => ({
                    id: `accepted-${r.id}`,
                    type: 'acceptance',
                    title: 'Request Accepted!',
                    description: `Your request for ${r.request_type.replace('_', ' ')} was accepted by ${(Array.isArray(r.users) ? r.users[0]?.name : (r.users as any)?.name) || 'an athlete'}.`,
                    time: r.updated_at,
                    href: `/requests/${r.id}`,
                    icon: Check
                }))
            ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

            setNotifications(allNotifications);
            setPendingCount(allNotifications.length);
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
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64 border-r-0">
                        <DashboardSidebar className="border-r-0" />
                    </SheetContent>
                </Sheet>
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
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                            <Bell className="w-5 h-5" />
                            {pendingCount > 0 && (
                                <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 bg-secondary text-[10px] font-bold text-white rounded-full border-2 border-background">
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md p-0">
                        <SheetHeader className="p-6 border-b">
                            <SheetTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-secondary" />
                                Notifications
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium">All caught up!</p>
                                    <p className="text-xs text-muted-foreground">No new notifications at this time.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((notif) => (
                                        <Link
                                            key={notif.id}
                                            href={notif.href}
                                            className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors group"
                                        >
                                            <div className={cn(
                                                "mt-1 p-2 rounded-full",
                                                notif.type === 'request' ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"
                                            )}>
                                                <notif.icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-semibold group-hover:text-secondary transition-colors">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{notif.description}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider pt-1">
                                                    {new Date(notif.time).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t mt-auto bg-muted/20">
                            <Link href="/requests">
                                <Button variant="outline" className="w-full text-xs h-9 rounded-xl">View All Activity</Button>
                            </Link>
                        </div>
                    </SheetContent>
                </Sheet>

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
