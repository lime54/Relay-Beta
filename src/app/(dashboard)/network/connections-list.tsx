"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Calendar, Linkedin, ExternalLink, Users } from "lucide-react"

const LINKEDIN_URL_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9_-]+\/?$/

export interface Connection {
    id: string
    name: string
    headline?: string
    school?: string
    sport?: string
    avatarUrl?: string
    linkedinUrl?: string
    schedulingUrl?: string
}

export function ConnectionsList({ connections }: { connections: Connection[] }) {
    if (connections.length === 0) {
        return (
            <Card className="bg-slate-50 border-none shadow-none">
                <CardContent className="py-16 text-center flex flex-col items-center">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                        <Users className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No connections yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        You haven&apos;t connected with anyone yet. Start by sending a request from the Discover tab.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map(conn => {
                const hasScheduling = Boolean(conn.schedulingUrl)
                const validLinkedIn = conn.linkedinUrl && LINKEDIN_URL_REGEX.test(conn.linkedinUrl)
                return (
                    <Card key={conn.id} className="border-border/40 bg-card/80 backdrop-blur-sm rounded-3xl ring-1 ring-black/5 hover:shadow-xl transition-all">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                            <Link href={`/profile/${conn.id}`} className="block">
                                <Avatar className="h-20 w-20 border-4 border-background shadow-md ring-2 ring-secondary/10">
                                    <AvatarImage src={conn.avatarUrl} alt={conn.name} />
                                    <AvatarFallback className="text-xl bg-gradient-to-br from-muted to-border">
                                        {conn.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>

                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                    <Link href={`/profile/${conn.id}`} className="hover:underline">
                                        <h3 className="text-lg font-bold tracking-tight text-primary">{conn.name}</h3>
                                    </Link>
                                    {validLinkedIn && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-full shrink-0"
                                            aria-label={`View ${conn.name}'s LinkedIn profile`}
                                            title="View LinkedIn profile"
                                        >
                                            <a
                                                href={conn.linkedinUrl!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Linkedin className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                {conn.headline && (
                                    <p className="text-xs text-muted-foreground">{conn.headline}</p>
                                )}
                                {(conn.sport || conn.school) && (
                                    <p className="text-[11px] text-muted-foreground/80 uppercase tracking-wide">
                                        {[conn.sport, conn.school].filter(Boolean).join(" • ")}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center gap-2 pt-2 w-full">
                                <Link href={`/profile/${conn.id}`} className="flex-1 min-w-[7rem]">
                                    <Button variant="outline" size="sm" className="w-full rounded-full gap-1.5">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        View Profile
                                    </Button>
                                </Link>
                                <Link href={`/messages?user=${conn.id}`} className="flex-1 min-w-[7rem]">
                                    <Button size="sm" className="w-full rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1.5">
                                        <MessageCircle className="h-3.5 w-3.5" />
                                        Message
                                    </Button>
                                </Link>
                                {hasScheduling ? (
                                    <Link href={`/profile/${conn.id}?book=1`} className="flex-1 min-w-[7rem]">
                                        <Button size="sm" className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Schedule Call
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button
                                        size="sm"
                                        disabled
                                        className="flex-1 min-w-[7rem] rounded-full gap-1.5 cursor-not-allowed"
                                        title="This user hasn't connected their calendar yet"
                                    >
                                        <Calendar className="h-3.5 w-3.5" />
                                        Calendar not connected
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
