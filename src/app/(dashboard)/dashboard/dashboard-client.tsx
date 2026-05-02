"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Plus,
    ArrowRight,
    CheckCircle,
    ChevronRight,
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

interface DashboardData {
    userName: string;
    userRole: string;
    isVerified: boolean;
    profileStrength: number;
    missingFields: { label: string, href: string }[];
    sentCount: number;
    receivedCount: number;
    acceptedCount: number;
    pendingCount: number;
    recentRequests: Array<{
        id: string;
        request_type: string;
        status: string;
        created_at: string;
    }>;
}

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

function timeAgo(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return date.toLocaleDateString();
}

export default function DashboardClient({ data }: { data: DashboardData }) {
    const stats = [
        { label: "Requests Sent", value: data.sentCount, icon: Target, color: "text-secondary" },
        { label: "Athletes Helped", value: data.acceptedCount, icon: Rocket, color: "text-accent" },
        { label: "Pending Review", value: data.pendingCount, icon: Clock, color: "text-orange-500" },
        { label: "Success Rate", value: data.sentCount > 0 ? `${Math.round((data.acceptedCount / data.sentCount) * 100)}%` : '—', icon: TrendingUp, color: "text-green-500" },
    ];

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
                        Welcome back, {data.userName}
                    </h1>
                    <p className="text-muted-foreground text-lg flex items-center gap-2">
                        {data.userRole === 'alum' ? 'Ready to help the next generation of athletes?' : 'Ready to connect with fellow athletes?'}
                        {data.isVerified && (
                            <Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                            </Badge>
                        )}
                    </p>
                </div>
                <Link href="/network">
                    <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white rounded-full shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95 gap-2 px-8">
                        <Plus className="h-4 w-4" />
                        Connect with Athletes
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
                            </div>
                            <div className="text-3xl font-bold tracking-tight mb-1">{stat.value}</div>
                            <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Activity */}
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
                                    <CardTitle className="text-xl">Recent Requests</CardTitle>
                                    <CardDescription>Your latest connection activity</CardDescription>
                                </div>
                                <Link href="/requests">
                                    <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary hover:bg-secondary/10">
                                        View All <ArrowUpRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                {data.recentRequests.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                                        <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <Target className="h-6 w-6 text-muted-foreground/40" />
                                        </div>
                                        <h4 className="text-sm font-semibold mb-1">No requests yet</h4>
                                        <p className="text-xs text-muted-foreground mb-6 max-w-[200px] mx-auto">Start connecting with athletes to build your huddle.</p>
                                        <Link href="/network">
                                            <Button variant="secondary" size="sm" className="rounded-full px-6">Explore Local Athletes</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    data.recentRequests.map((req) => (
                                        <Link key={req.id} href={`/requests/${req.id}`}>
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border/50 hover:border-secondary/30 transition-all group cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                                        <Target className="h-5 w-5 text-secondary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold capitalize">{req.request_type.replace('_', ' ')}</div>
                                                        <div className="text-xs text-muted-foreground">{timeAgo(req.created_at)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge className={cn(
                                                        "rounded-full px-3",
                                                        req.status === 'pending' ? "bg-orange-500/10 text-orange-600 border-orange-200" :
                                                            req.status === 'accepted' ? "bg-green-500/10 text-green-600 border-green-200" :
                                                                "bg-red-500/10 text-red-600 border-red-200"
                                                    )}>
                                                        {req.status}
                                                    </Badge>
                                                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Right Column: Quick Actions & Profile Status */}
                <div className="space-y-8">
                    {data.profileStrength < 100 && (
                        <motion.div variants={item}>
                            <Card className="border-border/50 shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold flex justify-between items-center text-muted-foreground uppercase tracking-wider">
                                        Profile Strength
                                        <span className="text-primary font-black">{data.profileStrength}%</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-secondary transition-all duration-1000 ease-out" 
                                            style={{ width: `${data.profileStrength}%` }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium">Complete these to boost visibility:</p>
                                        <div className="flex flex-col gap-2">
                                            {data.missingFields.slice(0, 3).map((field, i) => (
                                                <Link key={i} href={field.href}>
                                                    <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs border-dashed border-border/60 hover:border-secondary/40 hover:bg-secondary/5 group">
                                                        <span className="flex items-center gap-2">
                                                            <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex items-center justify-center group-hover:border-secondary/50">
                                                                <Plus className="h-2.5 w-2.5 text-muted-foreground group-hover:text-secondary" />
                                                            </div>
                                                            Add {field.label}
                                                        </span>
                                                        <span className="text-[10px] text-secondary font-bold group-hover:translate-x-1 transition-transform">
                                                            +pts
                                                        </span>
                                                    </Button>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    <motion.div variants={item}>
                        <Card className="border-border/50 shadow-lg overflow-hidden">
                            <div className="h-2 bg-secondary" />
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link href="/network">
                                    <Button variant="outline" className="w-full justify-start gap-2 rounded-lg">
                                        <Target className="h-4 w-4" /> Browse Network
                                    </Button>
                                </Link>
                                <Link href="/requests">
                                    <Button variant="outline" className="w-full justify-start gap-2 rounded-lg">
                                        <Clock className="h-4 w-4" /> View Requests
                                    </Button>
                                </Link>
                                <Link href="/profile">
                                    <Button variant="outline" className="w-full justify-start gap-2 rounded-lg">
                                        <ArrowRight className="h-4 w-4" /> Edit Profile
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={item}>
                        <div className="p-6 rounded-3xl bg-primary text-primary-foreground relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Rocket className="h-24 w-24" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Build Your Legacy</h3>
                            <p className="text-sm opacity-80 mb-4">
                                {data.acceptedCount > 0
                                    ? `You've helped ${data.acceptedCount} athlete${data.acceptedCount !== 1 ? 's' : ''} so far. Keep going!`
                                    : "Start connecting with athletes and build your network."}
                            </p>
                            <Link href="/network">
                                <Button size="sm" variant="secondary" className="w-full rounded-xl">Explore Network</Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
