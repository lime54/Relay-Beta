"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Calendar,
    Clock,
    Video,
    MessageSquare,
    ArrowLeft,
    ExternalLink,
    User,
    School,
    Trophy,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Meeting = {
    id: string
    start_time: string
    end_time: string
    status: string
    meeting_link: string | null
    message: string | null
    provider_event_id: string | null
    created_at: string
    requester: any
    recipient: any
}

interface MeetingsClientProps {
    upcoming: Meeting[]
    past: Meeting[]
    currentUserId: string
}

function MeetingDetailPanel({ meeting, currentUserId, onClose }: { meeting: Meeting; currentUserId: string; onClose: () => void }) {
    const isRequester = meeting.requester?.id === currentUserId
    const otherPerson = isRequester ? meeting.recipient : meeting.requester
    const otherProfile = otherPerson?.athlete_profiles
    const avatarUrl = Array.isArray(otherProfile) ? otherProfile[0]?.avatar_url : otherProfile?.avatar_url
    const school = Array.isArray(otherProfile) ? otherProfile[0]?.school : otherProfile?.school
    const sport = Array.isArray(otherProfile) ? otherProfile[0]?.sport : otherProfile?.sport

    const startDate = new Date(meeting.start_time)
    const endDate = new Date(meeting.end_time)
    const isPast = startDate < new Date()
    const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / 60000)

    return (
        <Card className="border-border/50 shadow-lg">
            <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Meeting Details
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Other person */}
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-border">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-lg font-bold">{otherPerson?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-lg">{otherPerson?.name || 'Unknown'}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {school && (
                                <span className="flex items-center gap-1">
                                    <School className="h-3 w-3" />
                                    {school}
                                </span>
                            )}
                            {sport && (
                                <span className="flex items-center gap-1">
                                    <Trophy className="h-3 w-3" />
                                    {sport}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">Date</p>
                            <p className="text-muted-foreground text-sm">
                                {startDate.toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                        <Clock className="h-5 w-5 text-secondary mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">Time</p>
                            <p className="text-muted-foreground text-sm">
                                {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                {' - '}
                                {endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                {' '}({durationMins} min)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                    <Badge variant={isPast ? "outline" : "success"} className="text-sm">
                        {isPast ? 'Completed' : 'Confirmed'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Booked {new Date(meeting.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {isRequester ? (
                        <Badge variant="outline" className="text-xs">You requested</Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs">You were invited</Badge>
                    )}
                </div>

                {/* Message */}
                {meeting.message && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{meeting.message}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                    {meeting.meeting_link && !isPast && (
                        <Button
                            className="gap-2"
                            onClick={() => window.open(meeting.meeting_link!, '_blank')}
                        >
                            <Video className="h-4 w-4" />
                            Join Meeting
                        </Button>
                    )}
                    {meeting.meeting_link && isPast && (
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => window.open(meeting.meeting_link!, '_blank')}
                        >
                            <ExternalLink className="h-4 w-4" />
                            View in Calendar
                        </Button>
                    )}
                    <Link href={`/profile/${otherPerson?.id}`}>
                        <Button variant="outline" className="gap-2">
                            <User className="h-4 w-4" />
                            View Profile
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

function MeetingRow({ meeting, currentUserId, onClick }: { meeting: Meeting; currentUserId: string; onClick: () => void }) {
    const isRequester = meeting.requester?.id === currentUserId
    const otherPerson = isRequester ? meeting.recipient : meeting.requester
    const otherProfile = otherPerson?.athlete_profiles
    const avatarUrl = Array.isArray(otherProfile) ? otherProfile[0]?.avatar_url : otherProfile?.avatar_url

    const startDate = new Date(meeting.start_time)
    const isPast = startDate < new Date()

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group"
        >
            <Avatar className="h-11 w-11 border border-border">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{otherPerson?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{otherPerson?.name || 'Unknown'}</h4>
                <p className="text-xs text-muted-foreground">
                    {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' at '}
                    {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {meeting.meeting_link && !isPast && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-secondary/30 text-secondary hover:bg-secondary/10"
                        onClick={(e) => { e.stopPropagation(); window.open(meeting.meeting_link!, '_blank') }}
                    >
                        <Video className="h-3.5 w-3.5 mr-1" />
                        Join
                    </Button>
                )}
                <Badge variant={isPast ? "outline" : "success"} className="text-[10px]">
                    {isPast ? 'Past' : 'Upcoming'}
                </Badge>
            </div>
        </div>
    )
}

export function MeetingsClient({ upcoming, past, currentUserId }: MeetingsClientProps) {
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

    if (selectedMeeting) {
        return (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4 duration-200">
                <MeetingDetailPanel
                    meeting={selectedMeeting}
                    currentUserId={currentUserId}
                    onClose={() => setSelectedMeeting(null)}
                />
            </div>
        )
    }

    const meetings = tab === 'upcoming' ? upcoming : past

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
                <p className="text-muted-foreground mt-1">View and manage your scheduled meetings.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border/50">
                <button
                    onClick={() => setTab('upcoming')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        tab === 'upcoming'
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Upcoming ({upcoming.length})
                </button>
                <button
                    onClick={() => setTab('past')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        tab === 'past'
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Past ({past.length})
                </button>
            </div>

            {/* Meeting list */}
            {meetings.length > 0 ? (
                <div className="space-y-3">
                    {meetings.map((meeting) => (
                        <MeetingRow
                            key={meeting.id}
                            meeting={meeting}
                            currentUserId={currentUserId}
                            onClick={() => setSelectedMeeting(meeting)}
                        />
                    ))}
                </div>
            ) : (
                <Card className="border-dashed shadow-none bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Calendar className="h-10 w-10 text-muted-foreground/50 mb-4" />
                        <p className="text-sm font-medium text-foreground mb-1">
                            {tab === 'upcoming' ? 'No upcoming meetings' : 'No past meetings'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                            {tab === 'upcoming'
                                ? 'Book a meeting with someone in your network to get started.'
                                : 'Your completed meetings will appear here.'}
                        </p>
                        {tab === 'upcoming' && (
                            <Link href="/network">
                                <Button variant="outline" size="sm">Find Athletes</Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
