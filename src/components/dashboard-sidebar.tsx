"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    User,
    MessageSquare,
    LogOut,
    ShieldCheck,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { useNotifications } from "@/contexts/notification-context";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        id: "dashboard"
    },
    {
        title: "My Requests",
        href: "/requests",
        icon: MessageSquare,
        id: "requests"
    },
    {
        title: "Network",
        href: "/network",
        icon: Users,
        id: "network"
    },
    {
        title: "Messages",
        href: "/messages",
        icon: MessageSquare,
        id: "messages"
    },
    {
        title: "Profile",
        href: "/profile",
        icon: User,
        id: "profile"
    },
];

export function DashboardSidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { unreadMessages, pendingRequests } = useNotifications();

    return (
        <div className={cn("flex flex-col h-full bg-card border-r border-border/50 w-64", className, "hidden md:flex flex")}>
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/relay-logo.png" alt="Relay" className="h-8 w-auto" />
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    let badgeCount = 0;
                    if (item.id === "messages") badgeCount = unreadMessages;
                    if (item.id === "requests") badgeCount = pendingRequests;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                                isActive
                                    ? "bg-secondary/10 text-secondary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-secondary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            {item.title}
                            {badgeCount > 0 && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {badgeCount > 9 ? '9+' : badgeCount}
                                </span>
                            )}
                            {isActive && badgeCount === 0 && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-border/50">
                <Link href="/profile/verify" className="block mb-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-muted/50 rounded-2xl p-4 border border-transparent hover:border-secondary/20 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-secondary" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verification</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Complete your profile to unlock all features.</p>
                        <Button size="sm" className="w-full text-xs h-8" variant="secondary">
                            Verify Now
                        </Button>
                    </motion.div>
                </Link>

                <form action="/auth/signout" method="post">
                    <button
                        type="submit"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    );
}
