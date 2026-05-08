"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    UserPlus,
    Check,
    GraduationCap,
    Trophy,
    Target,
    ShieldCheck,
    Sparkles,
    Linkedin,
    X,
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPORTS = [
    "All",
    "Baseball",
    "Basketball",
    "Cross Country",
    "Fencing",
    "Field Hockey",
    "Football",
    "Golf",
    "Gymnastics",
    "Ice Hockey",
    "Lacrosse",
    "Rowing",
    "Rugby",
    "Sailing",
    "Skiing",
    "Soccer",
    "Softball",
    "Squash",
    "Swimming & Diving",
    "Tennis",
    "Track & Field",
    "Volleyball",
    "Water Polo",
    "Wrestling",
    "Other",
];

const SECTORS = [
    "All",
    "Finance & Banking",
    "Consulting",
    "Technology & Software",
    "Healthcare & Medicine",
    "Law",
    "Sports Management & Coaching",
    "Media, Entertainment & Content",
    "Marketing & Advertising",
    "Real Estate",
    "Education",
    "Government & Public Policy",
    "Nonprofit & Social Impact",
    "Entrepreneurship / Startups",
    "Engineering",
    "Sales & Business Development",
];

const LINKEDIN_URL_REGEX =
    /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9_-]+\/?$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NetworkPerson {
    id: string;
    name: string;
    role: string;
    school: string;
    sport: string;
    imageUrl?: string;
    industry?: string;
    company?: string;
    position?: string;
    isVerified?: boolean;
    similarityScore?: number;
    linkedinUrl?: string;
}

interface NetworkClientProps {
    realUsers: NetworkPerson[];
    initialSearch: string;
    initialSport: string;
    initialIndustry: string;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NetworkClient({
    realUsers,
    initialSearch,
    initialSport,
    initialIndustry,
}: NetworkClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [sportFilter, setSportFilter] = useState(initialSport || "All");
    const [industryFilter, setIndustryFilter] = useState(initialIndustry || "All");
    const [searchQuery, setSearchQuery] = useState(initialSearch || "");
    const [connected, setConnected] = useState<Set<string>>(new Set());
    const [selectedPerson, setSelectedPerson] = useState<NetworkPerson | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Push filter state to URL params (triggers server re-fetch for search)
    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            Object.entries(updates).forEach(([key, value]) => {
                if (value && value !== "All") {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });
            router.push(`${pathname}?${params.toString()}`);
        },
        [searchParams, router, pathname]
    );

    // Client-side filtering for instant feedback (server already pre-filters
    // by search on Enter, but sport/industry dropdowns filter here too so
    // the grid updates immediately without a round-trip).
    const filteredPeople = useMemo(() => {
        return realUsers.filter((person) => {
            const sportMatch =
                sportFilter === "All" ||
                person.sport.toLowerCase() === sportFilter.toLowerCase();
            const industryMatch =
                industryFilter === "All" || person.industry === industryFilter;
            const searchMatch =
                !searchQuery ||
                person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                person.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
                person.sport.toLowerCase().includes(searchQuery.toLowerCase());
            return sportMatch && industryMatch && searchMatch;
        });
    }, [realUsers, sportFilter, industryFilter, searchQuery]);

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            updateParams({ search: searchQuery });
        }
    };

    const handleSportChange = (value: string) => {
        setSportFilter(value);
        updateParams({ sport: value });
    };

    const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setIndustryFilter(value);
        updateParams({ industry: value });
    };

    const clearAllFilters = () => {
        setSportFilter("All");
        setIndustryFilter("All");
        setSearchQuery("");
        router.push(pathname);
    };

    const hasActiveFilters =
        sportFilter !== "All" || industryFilter !== "All" || searchQuery !== "";

    const handleConnectClick = (person: NetworkPerson) => {
        if (connected.has(person.id)) return;
        setSelectedPerson(person);
        setIsDialogOpen(true);
    };

    const handleRequestSuccess = () => {
        if (selectedPerson) {
            setConnected((prev) => {
                const newSet = new Set(prev);
                newSet.add(selectedPerson.id);
                return newSet;
            });
        }
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Hero / Search Section */}
            <div className="relative overflow-hidden p-8 md:p-12 bg-primary rounded-[2.5rem] text-primary-foreground shadow-2xl">
                <div className="absolute top-0 right-0 opacity-10 blur-2xl bg-secondary rounded-full -mr-20 -mt-20 w-80 h-80 animate-pulse" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4 max-w-xl text-center md:text-left">
                        <Badge
                            variant="outline"
                            className="border-secondary/30 bg-secondary/10 text-secondary backdrop-blur-sm px-4 py-1"
                        >
                            Marketplace Beta
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            The Athlete Network
                        </h1>
                        <p className="text-primary-foreground/70 text-lg">
                            Connect with verified alumni and fellow athletes who share
                            your drive for excellence and peak performance.
                        </p>
                    </div>

                    <div className="w-full md:w-auto bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl min-w-[300px]">
                        <div className="flex items-center gap-3 mb-4">
                            <Search className="h-5 w-5 text-secondary" />
                            <span className="font-semibold text-sm">
                                Find athletes
                            </span>
                        </div>
                        <Input
                            placeholder="Search by name, school, sport..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mb-3 rounded-xl h-12 focus-visible:ring-secondary/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <Select
                                    value={sportFilter}
                                    onChange={(e) =>
                                        handleSportChange(e.target.value)
                                    }
                                    className="h-9 text-xs bg-white/5 border-white/10 text-white rounded-full focus-visible:ring-secondary/50"
                                >
                                    {SPORTS.map((s) => (
                                        <option
                                            key={s}
                                            value={s}
                                            className="text-black"
                                        >
                                            {s === "All" ? "All Sports" : s}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex-1">
                                <Select
                                    value={industryFilter}
                                    onChange={handleIndustryChange}
                                    className="h-9 text-xs bg-white/5 border-white/10 text-white rounded-full focus-visible:ring-secondary/50"
                                >
                                    {SECTORS.map((s) => (
                                        <option
                                            key={s}
                                            value={s}
                                            className="text-black"
                                        >
                                            {s === "All" ? "All Industries" : s}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">
                        {filteredPeople.length}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                        {filteredPeople.length === 1 ? "profile" : "profiles"} found
                    </span>
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="rounded-full gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Card Grid */}
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
                                {/* Badges: verified + match score */}
                                <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                                    {person.isVerified && (
                                        <div className="p-1 px-2.5 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-md flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3 text-accent" />
                                            <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">
                                                Verified
                                            </span>
                                        </div>
                                    )}
                                    {typeof person.similarityScore === "number" &&
                                        person.similarityScore > 0 && (
                                            <div
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md",
                                                    person.similarityScore >= 80
                                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                        : person.similarityScore >= 50
                                                          ? "bg-secondary/10 text-secondary border-secondary/20"
                                                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                )}
                                            >
                                                <Sparkles className="h-3 w-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {person.similarityScore}% Match
                                                </span>
                                            </div>
                                        )}
                                </div>

                                {/* Avatar + Info */}
                                <CardHeader className="pt-8 pb-4 flex flex-col items-center text-center">
                                    <Link
                                        href={`/profile/${person.id}`}
                                        className="relative mb-4 group/avatar block"
                                    >
                                        <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover/avatar:scale-125 transition-transform duration-500" />
                                        <Avatar className="h-24 w-24 border-4 border-background shadow-xl ring-2 ring-secondary/10 group-hover/avatar:scale-105 transition-transform">
                                            <AvatarImage
                                                src={person.imageUrl}
                                                alt={person.name}
                                            />
                                            <AvatarFallback className="text-2xl bg-gradient-to-br from-muted to-border">
                                                {person.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>

                                    <div>
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Link
                                                href={`/profile/${person.id}`}
                                                className="hover:underline"
                                            >
                                                <CardTitle className="text-2xl font-bold tracking-tight group-hover:text-secondary transition-colors text-primary">
                                                    {person.name}
                                                </CardTitle>
                                            </Link>
                                            {person.linkedinUrl &&
                                                LINKEDIN_URL_REGEX.test(
                                                    person.linkedinUrl
                                                ) && (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-7 w-7 rounded-full shrink-0"
                                                        aria-label={`View ${person.name}'s LinkedIn profile`}
                                                        title="View LinkedIn profile"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <a
                                                            href={person.linkedinUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Linkedin className="h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                )}
                                        </div>
                                        <CardDescription className="text-sm font-medium text-muted-foreground flex flex-col items-center justify-center gap-1.5 px-4 mb-2">
                                            {person.company && person.position ? (
                                                <span className="font-semibold text-primary">
                                                    {person.position} at{" "}
                                                    {person.company}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Target className="h-3.5 w-3.5" />
                                                    {person.role}
                                                </span>
                                            )}
                                            {person.industry && (
                                                <span className="text-xs text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full mt-1">
                                                    {person.industry}
                                                </span>
                                            )}
                                        </CardDescription>
                                        <div className="flex items-center justify-center gap-3 mt-4">
                                            <Badge
                                                variant="outline"
                                                className="rounded-full bg-background border-border/80 text-xs py-1 px-3"
                                            >
                                                <Trophy className="h-3 w-3 mr-1.5 text-secondary" />
                                                {person.sport}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="rounded-full bg-background border-border/80 text-xs py-1 px-3"
                                            >
                                                <GraduationCap className="h-3 w-3 mr-1.5 text-accent" />
                                                {person.school}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* CTA */}
                                <CardFooter className="px-8 pb-8 pt-4">
                                    <Button
                                        className={cn(
                                            "w-full h-12 rounded-2xl font-bold text-sm transition-all active:scale-95 group/btn",
                                            connected.has(person.id)
                                                ? "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-black/10"
                                        )}
                                        onClick={() =>
                                            handleConnectClick(person)
                                        }
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
                    <h3 className="text-2xl font-bold text-primary">
                        No athletes found
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Try adjusting your filters or search query to find more
                        profiles in the network.
                    </p>
                    <Button
                        variant="link"
                        onClick={clearAllFilters}
                        className="text-secondary font-bold"
                    >
                        Clear all filters
                    </Button>
                </div>
            )}

            {/* Connection Request Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none !rounded-[2.5rem]">
                    <div className="bg-background border border-border shadow-2xl rounded-[2.5rem] relative overflow-y-auto max-h-[90vh]">
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-secondary/10 to-transparent -z-10" />
                        <div className="p-8 md:p-10">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold tracking-tight mb-2">
                                    Start a Connection
                                </DialogTitle>
                                <DialogDescription className="text-base text-muted-foreground mb-8">
                                    Direct your request to{" "}
                                    {selectedPerson?.name}. Professional, concise
                                    requests lead to 80% higher response rates.
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
                                        imageUrl: selectedPerson.imageUrl,
                                        company: selectedPerson.company,
                                        position: selectedPerson.position,
                                        industry: selectedPerson.industry,
                                    }}
                                    onSuccess={handleRequestSuccess}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
