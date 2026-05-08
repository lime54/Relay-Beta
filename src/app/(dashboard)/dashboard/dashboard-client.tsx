"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Plus,
    CheckCircle,
    ChevronRight,
    Clock,
    TrendingUp,
    Target,
    Rocket,
    ArrowUpRight,
    Calendar,
    Send,
    Users,
    Sparkles,
    MessageCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentRequest {
    id: string;
    request_type: string;
    status: string;
    created_at: string;
    context?: string;
    direction: "sent" | "received";
    otherPerson?: any;
}

interface DashboardData {
    userId: string;
    userName: string;
    userRole: string;
    isVerified: boolean;
    profileStrength: number;
    missingFields: { label: string; href: string; key?: string }[];
    sentCount: number;
    receivedCount: number;
    acceptedCount: number;
    pendingCount: number;
    recentRequests: RecentRequest[];
    upcomingMeetings?: any[];
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REQUEST_TYPE_LABELS: Record<string, string> = {
    advice: "Career Advice",
    internship: "Internship Inquiry",
    referral: "Job Referral",
    mentorship: "Mentorship",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-200", icon: Clock },
    accepted: { label: "Accepted", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle },
    declined: { label: "Declined", color: "bg-red-500/10 text-red-600 border-red-200", icon: Target },
};

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

export default function DashboardClient({ data }: { data: DashboardData }) {
    const router = useRouter();
    const firstName = data.userName.split(" ")[0];

    const stats = [
        {
            label: "Requests Sent",
            value: data.sentCount,
            icon: Send,
            color: "text-secondary",
            bgColor: "bg-secondary/10",
        },
        {
            label: "Connections Made",
            value: data.acceptedCount,
            icon: Users,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            label: "Awaiting Response",
            value: data.pendingCount,
            icon: Clock,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
        },
        {
            label: "Incoming Requests",
            value: data.receivedCount,
            icon: MessageCircle,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 max-w-7xl mx-auto"
        >
            {/* Hero */}
            <motion.div
                variants={item}
                className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-10 text-primary-foreground"
            >
                <div className="absolute top-0 right-0 opacity-[0.07] blur-2xl">
                    <Sparkles className="h-64 w-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Hey, {firstName}
                            </h1>
                            {data.isVerified && (
                                <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Verified
                                </Badge>
                            )}
                        </div>
                        <p className="text-primary-foreground/70 text-base max-w-md">
                            {data.acceptedCount > 0
                                ? `You've made ${data.acceptedCount} connection${data.acceptedCount !== 1 ? "s" : ""}. Keep building your network.`
                                : "Start connecting with fellow athletes to build your professional network."}
                        </p>
                    </div>
                    <Link href="/network">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="rounded-full shadow-lg gap-2 px-8 font-bold hover:scale-105 active:scale-95 transition-transform"
                        >
                            <Plus className="h-4 w-4" />
                            Find Athletes
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <motion.div key={idx} variants={item}>
                        <Card className="border-border/50 bg-card hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className={cn(
                                            "p-2 rounded-xl",
                                            stat.bgColor,
                                            stat.color
                                        )}
                                    >
                                        <stat.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {stat.label}
                                    </span>
                                </div>
                                <div className="text-3xl font-bold tracking-tight">
                                    {stat.value}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-5 gap-6">
                {/* Left: Recent Requests (wider) */}
                <motion.div variants={item} className="lg:col-span-3">
                    <Card className="border-border/50 shadow-sm h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg font-bold">
                                    Recent Requests
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Your latest sent &amp; received requests
                                </CardDescription>
                            </div>
                            <Link href="/requests">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-secondary hover:text-secondary hover:bg-secondary/10 gap-1"
                                >
                                    View All
                                    <ArrowUpRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-2">
                            {data.recentRequests.length === 0 ? (
                                <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                                    <div className="h-14 w-14 bg-background rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-border/50">
                                        <Target className="h-7 w-7 text-muted-foreground/30" />
                                    </div>
                                    <h4 className="text-sm font-bold mb-1">
                                        No requests yet
                                    </h4>
                                    <p className="text-xs text-muted-foreground mb-5 max-w-[220px] mx-auto">
                                        Browse the network and send your first
                                        connection request.
                                    </p>
                                    <Link href="/network">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="rounded-full px-6"
                                        >
                                            Explore Network
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                data.recentRequests.map((req) => {
                                    const person = req.otherPerson;
                                    const profile = Array.isArray(person?.athlete_profiles)
                                        ? person?.athlete_profiles?.[0]
                                        : person?.athlete_profiles;
                                    const statusCfg =
                                        STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                                    const StatusIcon = statusCfg.icon;
                                    const typeLabel =
                                        REQUEST_TYPE_LABELS[req.request_type] ||
                                        req.request_type?.replace("_", " ");
                                    const isSent = req.direction === "sent";

                                    const linkHref =
                                        req.status === "accepted" && person?.id
                                            ? `/messages?user=${person.id}`
                                            : isSent
                                              ? `/requests?tab=sent`
                                              : `/requests/${req.id}`;

                                    return (
                                        <Link
                                            key={req.id}
                                            href={linkHref}
                                        >
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border/50 hover:border-secondary/30 hover:shadow-sm transition-all group cursor-pointer">
                                                {/* Avatar */}
                                                <Avatar className="h-11 w-11 border border-border/50 shrink-0">
                                                    <AvatarImage
                                                        src={profile?.avatar_url}
                                                    />
                                                    <AvatarFallback className="bg-secondary/10 text-secondary text-xs font-bold">
                                                        {getInitials(person?.name)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-semibold text-sm truncate">
                                                            {person?.name || "Unknown"}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[9px] px-1.5 py-0 h-4 rounded-full font-semibold shrink-0",
                                                                isSent
                                                                    ? "bg-blue-500/10 text-blue-600 border-blue-200"
                                                                    : "bg-purple-500/10 text-purple-600 border-purple-200"
                                                            )}
                                                        >
                                                            {isSent ? "Sent" : "Received"}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                                            {timeAgo(req.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] px-2 py-0 h-5 rounded-full bg-muted/50 border-border/50 font-medium"
                                                        >
                                                            {typeLabel}
                                                        </Badge>
                                                        {profile?.school && (
                                                            <span className="text-[10px] text-muted-foreground truncate">
                                                                {profile.school}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {req.context && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                            {req.context}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Status + chevron */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <Badge
                                                        className={cn(
                                                            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold gap-1",
                                                            statusCfg.color
                                                        )}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusCfg.label}
                                                    </Badge>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Strength */}
                    {data.profileStrength < 100 && (
                        <motion.div variants={item}>
                            <Card className="border-border/50 shadow-sm">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Profile Strength
                                        </span>
                                        <span
                                            className={cn(
                                                "text-sm font-black",
                                                data.profileStrength >= 80
                                                    ? "text-green-500"
                                                    : data.profileStrength >= 50
                                                      ? "text-amber-500"
                                                      : "text-red-500"
                                            )}
                                        >
                                            {data.profileStrength}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn(
                                                "h-full rounded-full",
                                                data.profileStrength >= 80
                                                    ? "bg-green-500"
                                                    : data.profileStrength >= 50
                                                      ? "bg-amber-500"
                                                      : "bg-red-500"
                                            )}
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${data.profileStrength}%`,
                                            }}
                                            transition={{
                                                duration: 1,
                                                ease: "easeOut",
                                                delay: 0.3,
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] text-muted-foreground font-medium">
                                            Complete to boost visibility:
                                        </p>
                                        {data.missingFields.slice(0, 3).map((field, i) => (
                                            <Link
                                                key={field.key || i}
                                                href={field.href}
                                            >
                                                <div className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-border/60 hover:border-secondary/40 hover:bg-secondary/5 transition-all group cursor-pointer">
                                                    <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                        <div className="h-5 w-5 rounded-full border border-muted-foreground/30 flex items-center justify-center group-hover:border-secondary group-hover:bg-secondary/10 transition-colors">
                                                            <Plus className="h-2.5 w-2.5 group-hover:text-secondary" />
                                                        </div>
                                                        Add {field.label}
                                                    </span>
                                                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-secondary transition-colors" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Upcoming Meetings */}
                    <motion.div variants={item}>
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="pb-2">
                                <Link
                                    href="/meetings"
                                    className="flex items-center justify-between group"
                                >
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-secondary" />
                                        Upcoming Meetings
                                    </CardTitle>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.upcomingMeetings &&
                                data.upcomingMeetings.length > 0 ? (
                                    <>
                                        {data.upcomingMeetings.map(
                                            (meeting: any) => {
                                                const isRequester =
                                                    meeting.requester?.id ===
                                                    data.userId;
                                                const otherPerson = isRequester
                                                    ? meeting.recipient
                                                    : meeting.requester;
                                                const otherAvatar =
                                                    otherPerson?.athlete_profiles
                                                        ?.avatar_url;
                                                const dateObj = new Date(
                                                    meeting.start_time
                                                );
                                                const formattedDate =
                                                    dateObj.toLocaleDateString(
                                                        undefined,
                                                        {
                                                            weekday: "short",
                                                            month: "short",
                                                            day: "numeric",
                                                        }
                                                    );
                                                const formattedTime =
                                                    dateObj.toLocaleTimeString(
                                                        undefined,
                                                        {
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                        }
                                                    );

                                                return (
                                                    <Link
                                                        key={meeting.id}
                                                        href="/meetings"
                                                    >
                                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-secondary/30 hover:shadow-sm transition-all cursor-pointer">
                                                            <Avatar className="h-9 w-9 border border-border/50">
                                                                <AvatarImage
                                                                    src={
                                                                        otherAvatar
                                                                    }
                                                                />
                                                                <AvatarFallback className="text-xs bg-secondary/10 text-secondary font-bold">
                                                                    {getInitials(
                                                                        otherPerson?.name
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-semibold truncate">
                                                                    {otherPerson?.name}
                                                                </h4>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    {formattedDate}{" "}
                                                                    at{" "}
                                                                    {formattedTime}
                                                                </p>
                                                            </div>
                                                            {meeting.meeting_link && (
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-[10px] rounded-full bg-secondary hover:bg-secondary/90 text-white font-bold shrink-0"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        window.open(
                                                                            meeting.meeting_link,
                                                                            "_blank"
                                                                        );
                                                                    }}
                                                                >
                                                                    Join
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </Link>
                                                );
                                            }
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground space-y-2">
                                        <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                                        <p className="text-xs font-medium">
                                            No upcoming meetings
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quick action card */}
                    <motion.div variants={item}>
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 text-white relative overflow-hidden group">
                            <div className="absolute -top-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Rocket className="h-28 w-28" />
                            </div>
                            <h3 className="text-base font-bold mb-1.5 relative z-10">
                                Build Your Legacy
                            </h3>
                            <p className="text-sm text-white/70 mb-4 relative z-10 leading-relaxed">
                                {data.acceptedCount > 0
                                    ? `${data.acceptedCount} connection${data.acceptedCount !== 1 ? "s" : ""} and counting. Keep the momentum going.`
                                    : "Every great network starts with a single connection."}
                            </p>
                            <Link href="/network" className="relative z-10">
                                <Button
                                    size="sm"
                                    className="w-full rounded-xl bg-white text-secondary hover:bg-white/90 font-bold"
                                >
                                    Explore Network
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
