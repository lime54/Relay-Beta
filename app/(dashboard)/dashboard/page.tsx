"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Plus,
    ArrowRight,
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    Target,
    Rocket,
    ArrowUpRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

// Mock data for initial UI - in real app, these would come from props/server
const dashboardContent = {
    profile: { name: "Max", role: "alum" },
    recentRequests: [
        { id: "1", type: "Coffee Chat", status: "pending", time: "2h ago" },
        { id: "2", type: "Referral", status: "accepted", time: "1d ago" },
    ],
    upcoming: [
        { id: "1", title: "Chat with John Doe", subtitle: "NCAA Hockey Alum", time: "Today, 4 PM" }
    ],
    stats: [
        { label: "Requests Sent", value: 12, icon: Target, color: "text-secondary" },
        { label: "Athletes Helped", value: 8, icon: Rocket, color: "text-accent" },
        { label: "Pending Review", value: 3, icon: Clock, color: "text-orange-500" },
        { label: "Success Rate", value: "85%", icon: TrendingUp, color: "text-green-500" },
    ]
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function DashboardPage() {
    // Note: In Next.js 15, we'd normally use async server components for the logic
    // but for the premium UI we use "use client" for animations and transitions.
    // In a final version, we'd pass data from a parent server component.

    const { profile, stats, recentRequests, upcoming } = dashboardContent;
    const isVerified = true;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Hero Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-1">
                    <h1 className="text-display text-primary text-3xl md:text-4xl">
                        Welcome back, {profile.name}
                    </h1>
                    <p className="text-muted-foreground text-lg flex items-center gap-2">
                        Ready to help the next generation of athletes?
                        {isVerified && (
                            <Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified Pro
                            </Badge>
                        )}
                    </p>
                </div>
                <Link href="/requests/new">
                    <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white rounded-full shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95 gap-2 px-8">
                        <Plus className="h-4 w-4" />
                        New Private Request
                    </Button>
                </Link>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div key={idx} variants={item} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-muted opacity-50 rounded-3xl -z-10 border border-border/50 shadow-sm" />
                        <Card className="bg-transparent border-none shadow-none p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-2 rounded-xl bg-background border border-border/50 group-hover:scale-110 transition-transform", stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div className="text-micro font-bold text-muted-foreground uppercase tracking-widest">+2 this week</div>
                            </div>
                            <div className="text-3xl font-bold tracking-tight mb-1">{stat.value}</div>
                            <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Activity & Coming Up */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div variants={item}>
                        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                            <GlowingEffect
                                spread={30}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={1}
                            />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-xl">Active Connections</CardTitle>
                                    <CardDescription>Athletes you&apos;re currently helping</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary hover:bg-secondary/10">
                                    View Marketplace <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                {recentRequests.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border/50 hover:border-secondary/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                                <Target className="h-5 w-5 text-secondary" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{req.type}</div>
                                                <div className="text-xs text-muted-foreground">{req.time}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={cn(
                                                "rounded-full px-3",
                                                req.status === 'pending' ? "bg-orange-500/10 text-orange-600 border-orange-200" : "bg-green-500/10 text-green-600 border-green-200"
                                            )}>
                                                {req.status}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Right Column: Upcoming & Tips */}
                <div className="space-y-8">
                    <motion.div variants={item}>
                        <Card className="border-border/50 shadow-lg overflow-hidden">
                            <div className="h-2 bg-secondary" />
                            <CardHeader>
                                <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {upcoming.map((u) => (
                                    <div key={u.id} className="p-4 rounded-xl bg-muted/30 border border-border/20 space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase">
                                            <Clock className="h-3 w-3" />
                                            {u.time}
                                        </div>
                                        <div className="font-semibold">{u.title}</div>
                                        <div className="text-sm text-muted-foreground">{u.subtitle}</div>
                                        <Button size="sm" variant="outline" className="w-full mt-2 rounded-lg">View Details</Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={item}>
                        <div className="p-6 rounded-3xl bg-primary text-primary-foreground relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Rocket className="h-24 w-24" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Build Your Legacy</h3>
                            <p className="text-sm opacity-80 mb-4">You&apos;ve helped 8 athletes so far. Top mentors in our community have helped over 50.</p>
                            <Button size="sm" variant="secondary" className="w-full rounded-xl">Share Your Profile</Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

function ChevronRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}

