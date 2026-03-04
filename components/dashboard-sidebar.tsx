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
    TrendingUp,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Requests",
        href: "/requests",
        icon: MessageSquare,
    },
    {
        title: "Network",
        href: "/network",
        icon: Users,
    },
    {
        title: "Profile",
        href: "/profile",
        icon: User,
    },
];

export function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-card border-r border-border/50 w-64 hidden md:flex">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Relay</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
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
                            {isActive && (
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
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-muted/50 rounded-2xl p-4 mb-4 border border-transparent hover:border-secondary/20 transition-colors cursor-pointer"
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

                <Link
                    href="/auth/signout"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Link>
            </div>
        </div>
    );
}
