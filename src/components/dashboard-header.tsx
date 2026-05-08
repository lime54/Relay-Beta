"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Search,
    Bell,
    Menu,
    Check,
    UserPlus,
    MessageCircle,
    Calendar,
    ChevronRight,
    X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNotifications } from "@/contexts/notification-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Notification {
    id: string;
    type: "request" | "acceptance" | "message";
    title: string;
    description: string;
    personName: string;
    personAvatar?: string;
    time: string;
    href: string;
    icon: typeof UserPlus;
    iconColor: string;
    iconBg: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getInitials(name?: string) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardHeader() {
    const { unreadMessages, pendingRequests } = useNotifications();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [userName, setUserName] = useState("Athlete");
    const [userInitials, setUserInitials] = useState("AT");
    const [userAvatar, setUserAvatar] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();

    const totalBadge = unreadMessages + pendingRequests;

    const fetchNotifications = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const name =
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Athlete";
        setUserName(name);
        setUserInitials(getInitials(name));

        const { data: profile } = await supabase
            .from("athlete_profiles")
            .select("avatar_url")
            .eq("user_id", user.id)
            .single();
        if (profile?.avatar_url) setUserAvatar(profile.avatar_url);

        // Incoming pending requests
        const { data: incomingRequests } = await supabase
            .from("requests")
            .select(
                "id, request_type, status, created_at, users:requester_id(name, athlete_profiles(avatar_url))"
            )
            .eq("recipient_id", user.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(10);

        // Recent accepted requests
        const { data: acceptedRequests } = await supabase
            .from("requests")
            .select(
                "id, request_type, status, created_at, users:requester_id(name, athlete_profiles(avatar_url))"
            )
            .eq("requester_id", user.id)
            .eq("status", "accepted")
            .order("created_at", { ascending: false })
            .limit(5);

        const extractUser = (r: any) => {
            const u = Array.isArray(r.users) ? r.users[0] : r.users;
            const p = Array.isArray(u?.athlete_profiles)
                ? u.athlete_profiles[0]
                : u?.athlete_profiles;
            return { name: u?.name || "An athlete", avatar: p?.avatar_url };
        };

        const REQUEST_TYPE_LABELS: Record<string, string> = {
            advice: "Career Advice",
            internship: "Internship Inquiry",
            referral: "Job Referral",
            mentorship: "Mentorship",
        };

        const all: Notification[] = [
            ...(incomingRequests || []).map((r) => {
                const person = extractUser(r);
                return {
                    id: `incoming-${r.id}`,
                    type: "request" as const,
                    title: "New Connection Request",
                    description: `${person.name} wants ${REQUEST_TYPE_LABELS[r.request_type] || r.request_type?.replace("_", " ")}`,
                    personName: person.name,
                    personAvatar: person.avatar,
                    time: r.created_at,
                    href: "/requests",
                    icon: UserPlus,
                    iconColor: "text-blue-600",
                    iconBg: "bg-blue-500/10",
                };
            }),
            ...(acceptedRequests || []).map((r) => {
                const person = extractUser(r);
                return {
                    id: `accepted-${r.id}`,
                    type: "acceptance" as const,
                    title: "Request Accepted!",
                    description: `${person.name} accepted your ${REQUEST_TYPE_LABELS[r.request_type] || r.request_type?.replace("_", " ")} request`,
                    personName: person.name,
                    personAvatar: person.avatar,
                    time: r.created_at,
                    href: `/messages?user=${r.id}`,
                    icon: Check,
                    iconColor: "text-green-600",
                    iconBg: "bg-green-500/10",
                };
            }),
        ].sort(
            (a, b) =>
                new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        setNotifications(all);
    }, [supabase]);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel("header-notifications")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "requests" },
                () => fetchNotifications()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchNotifications]);

    return (
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            {/* Mobile sidebar trigger */}
            <div className="flex items-center gap-4 md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="p-0 w-64 border-r-0"
                    >
                        <DashboardSidebar className="border-r-0" />
                    </SheetContent>
                </Sheet>
                <span className="font-bold text-lg">Relay</span>
            </div>

            {/* Desktop search bar */}
            <div className="hidden md:flex items-center bg-muted/50 rounded-full px-4 py-1.5 w-full max-w-md border border-border/20 focus-within:border-secondary/50 focus-within:ring-1 focus-within:ring-secondary/50 transition-all">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <input
                    placeholder="Search for alumni or students..."
                    className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
                />
            </div>

            {/* Right side: bell + avatar */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Notification bell */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "relative h-10 w-10 rounded-full transition-all",
                                totalBadge > 0
                                    ? "text-foreground hover:bg-secondary/10"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Bell className="h-5 w-5" />
                            <AnimatePresence>
                                {totalBadge > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-[10px] font-bold text-white rounded-full border-2 border-background"
                                    >
                                        {totalBadge > 99
                                            ? "99+"
                                            : totalBadge}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                        {/* Panel header */}
                        <SheetHeader className="px-6 py-5 border-b border-border/50 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <SheetTitle className="flex items-center gap-2.5 text-lg">
                                    <div className="p-1.5 rounded-lg bg-secondary/10">
                                        <Bell className="h-4 w-4 text-secondary" />
                                    </div>
                                    Notifications
                                    {totalBadge > 0 && (
                                        <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                                            {totalBadge}
                                        </span>
                                    )}
                                </SheetTitle>
                            </div>
                        </SheetHeader>

                        {/* Notification list */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-72 text-center p-6">
                                    <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                                        <Bell className="w-7 h-7 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-sm font-bold mb-1">
                                        All caught up!
                                    </p>
                                    <p className="text-xs text-muted-foreground max-w-[200px]">
                                        No new notifications. Check back later
                                        for updates.
                                    </p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {notifications.map((notif, idx) => {
                                        const Icon = notif.icon;
                                        return (
                                            <Link
                                                key={notif.id}
                                                href={notif.href}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        x: 10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    transition={{
                                                        delay: idx * 0.03,
                                                    }}
                                                    className="flex items-start gap-3.5 px-6 py-4 hover:bg-muted/50 transition-colors group cursor-pointer"
                                                >
                                                    {/* Person avatar with icon overlay */}
                                                    <div className="relative shrink-0">
                                                        <Avatar className="h-10 w-10 border border-border/50">
                                                            <AvatarImage
                                                                src={
                                                                    notif.personAvatar
                                                                }
                                                            />
                                                            <AvatarFallback className="bg-muted text-xs font-bold">
                                                                {getInitials(
                                                                    notif.personName
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div
                                                            className={cn(
                                                                "absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-background",
                                                                notif.iconBg
                                                            )}
                                                        >
                                                            <Icon
                                                                className={cn(
                                                                    "h-2.5 w-2.5",
                                                                    notif.iconColor
                                                                )}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors leading-snug">
                                                            {notif.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                                            {notif.description}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">
                                                            {timeAgo(
                                                                notif.time
                                                            )}
                                                        </p>
                                                    </div>

                                                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground mt-1 shrink-0 transition-colors" />
                                                </motion.div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border/50 flex-shrink-0 bg-muted/20">
                            <Link href="/requests" onClick={() => setIsOpen(false)}>
                                <Button
                                    variant="outline"
                                    className="w-full text-xs h-10 rounded-xl font-semibold"
                                >
                                    View All Activity
                                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="h-8 w-[1px] bg-border/50 mx-1 hidden md:block" />

                {/* User avatar */}
                <Link
                    href="/profile"
                    className="flex items-center gap-3 pl-1 group"
                >
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-semibold leading-none group-hover:text-secondary transition-colors">
                            {userName}
                        </p>
                        <p className="text-[10px] text-muted-foreground group-hover:text-secondary/70 transition-colors mt-0.5">
                            View Profile
                        </p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Avatar className="h-9 w-9 border-2 border-secondary/20 cursor-pointer group-hover:border-secondary/50 transition-colors">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback className="bg-secondary/10 text-secondary font-bold text-xs">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                    </motion.div>
                </Link>
            </div>
        </header>
    );
}
