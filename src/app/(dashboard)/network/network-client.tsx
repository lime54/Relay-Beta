"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    UserPlus,
    Check,
    Filter,
    GraduationCap,
    Trophy,
    Target,
    ChevronRight,
    ShieldCheck,
    Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { RequestForm } from "@/app/(dashboard)/requests/new/request-form";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

type Sport = "Squash" | "Tennis" | "Golf" | "Hockey" | "Basketball" | "Football";

interface NetworkPerson {
    id: string;
    name: string;
    role: string;
    school: string;
    sport: Sport;
    level?: string;
    imageUrl?: string;
    mutuals?: number;
    isPlaceholder?: boolean;
    isVerified?: boolean;
}

const PLACEHOLDER_PEOPLE: NetworkPerson[] = [];

interface NetworkClientProps {
    realUsers: NetworkPerson[];
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function NetworkClient({ realUsers }: NetworkClientProps) {
    const [filter, setFilter] = useState<Sport | "All">("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [connected] = useState<Set<string>>(new Set());
    const [selectedPerson, setSelectedPerson] = useState<NetworkPerson | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const allPeople = useMemo(() => [...realUsers, ...PLACEHOLDER_PEOPLE], [realUsers]);

    const filteredPeople = useMemo(() => allPeople.filter((person) => {
        const matchesSport = filter === "All" || person.sport === filter;
        const matchesSearch =
            searchQuery === "" ||
            person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            person.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
            person.role.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSport && matchesSearch;
    }), [allPeople, filter, searchQuery]);

    const handleConnectClick = (person: NetworkPerson) => {
        if (connected.has(person.id)) return;
        setSelectedPerson(person);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden p-8 md:p-12 bg-primary rounded-[2.5rem] text-primary-foreground shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl bg-secondary rounded-full -mr-20 -mt-20 w-80 h-80 animate-pulse" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4 max-w-xl text-center md:text-left">
                        <Badge variant="outline" className="border-secondary/30 bg-secondary/10 text-secondary backdrop-blur-sm px-4 py-1">
                            Marketplace Beta
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            The Athlete Network
                        </h1>
                        <p className="text-primary-foreground/70 text-lg">
                            Connect with verified alumni and fellow athletes who share your drive for excellence and peak performance.
                        </p>
                    </div>

                    <div className="w-full md:w-auto bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl min-w-[300px]">
                        <div className="flex items-center gap-3 mb-4">
                            <Search className="h-5 w-5 text-secondary" />
                            <span className="font-semibold text-sm">Find your specialty</span>
                        </div>
                        <Input
                            placeholder="Harvard Squash..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mb-3 rounded-xl h-12 focus-visible:ring-secondary/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                            {["All", "Squash", "Tennis", "Golf"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s as any)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        filter === s
                                            ? "bg-secondary text-secondary-foreground"
                                            : "bg-white/5 hover:bg-white/10"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-primary">{filteredPeople.length}</span>
                        <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Available Profiles</span>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex items-center -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                                <span className="text-[10px] font-bold">AT</span>
                            </div>
                        ))}
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-white">+50</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Order by:</span>
                    <Button variant="outline" size="sm" className="rounded-full h-8 text-xs font-semibold">Most Recent</Button>
                </div>
            </div>

            {/* Grid Section */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {filteredPeople.map((person) => (
                        <motion.div
                            key={person.id}
                            layout
                            variants={item}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group relative h-full"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-[2rem] -z-10 group-hover:scale-[1.02] transition-transform duration-300" />
                            <Card className="h-full border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden rounded-[2rem] ring-1 ring-black/5 hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-300">
                                <div className="absolute top-4 right-4 z-10">
                                    {person.isVerified && (
                                        <div className="p-1 px-2.5 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-md flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3 text-accent" />
                                            <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Verified</span>
                                        </div>
                                    )}
                                </div>

                                <CardHeader className="pt-8 pb-4 flex flex-col items-center text-center">
                                    <div className="relative mb-4">
                                        <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
                                        <Avatar className="h-24 w-24 border-4 border-background shadow-xl ring-2 ring-secondary/10 group-hover:scale-105 transition-transform">
                                            <AvatarImage src={person.imageUrl} alt={person.name} />
                                            <AvatarFallback className="text-2xl bg-gradient-to-br from-muted to-border">
                                                {person.name.split(" ").map((n) => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div>
                                        <CardTitle className="text-2xl font-bold tracking-tight mb-1 group-hover:text-secondary transition-colors text-primary">
                                            {person.name}
                                        </CardTitle>
                                        <CardDescription className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5 px-4 mb-2">
                                            <Target className="h-3.5 w-3.5" />
                                            {person.role}
                                        </CardDescription>
                                        <div className="flex items-center justify-center gap-3 mt-4">
                                            <Badge variant="outline" className="rounded-full bg-background border-border/80 text-xs py-1 px-3">
                                                <Trophy className="h-3 w-3 mr-1.5 text-secondary" />
                                                {person.sport}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-full bg-background border-border/80 text-xs py-1 px-3">
                                                <GraduationCap className="h-3 w-3 mr-1.5 text-accent" />
                                                {person.school}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="px-8 pb-4">
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-between group-hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Network Strength</span>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm font-bold">Top Member</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-primary">{person.mutuals || 0} Mutuals</span>
                                            <p className="text-[10px] text-muted-foreground uppercase">Connections</p>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="px-8 pb-8 pt-2">
                                    <Button
                                        className={cn(
                                            "w-full h-12 rounded-2xl font-bold text-sm transition-all active:scale-95 group/btn",
                                            connected.has(person.id)
                                                ? "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-black/10"
                                        )}
                                        onClick={() => handleConnectClick(person)}
                                        disabled={connected.has(person.id)}
                                    >
                                        {connected.has(person.id) ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Request Sent
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="mr-2 h-4 w-4 transition-transform group-hover/btn:-translate-y-1" />
                                                Send Personal Request
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Empty State */}
            {filteredPeople.length === 0 && (
                <div className="text-center py-40 space-y-4">
                    <div className="inline-flex h-20 w-20 rounded-full bg-muted items-center justify-center mb-6">
                        <Search className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary">No athletes found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Try adjusting your filters or search query to find more profiles in the network.
                    </p>
                    <Button variant="link" onClick={() => { setFilter("All"); setSearchQuery(""); }} className="text-secondary font-bold">
                        Clear all filters
                    </Button>
                </div>
            )}

            {/* Connection Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none !rounded-[2.5rem]">
                    <div className="bg-background border border-border shadow-2xl rounded-[2.5rem] relative overflow-y-auto max-h-[90vh]">
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-secondary/10 to-transparent -z-10" />

                        <div className="p-8 md:p-10">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold tracking-tight mb-2">Start a Connection</DialogTitle>
                                <DialogDescription className="text-base text-muted-foreground mb-8">
                                    Direct your request to {selectedPerson?.name}. Professional, concise requests lead to 80% higher response rates.
                                </DialogDescription>
                            </DialogHeader>
                            {selectedPerson && (
                                <RequestForm
                                    recipient={{
                                        id: selectedPerson.id,
                                        name: selectedPerson.name,
                                        sport: selectedPerson.sport,
                                        school: selectedPerson.school,
                                        role: selectedPerson.role,
                                        imageUrl: selectedPerson.imageUrl
                                    }}
                                    onSuccess={() => setIsDialogOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
