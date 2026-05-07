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
    CheckCircle2,
    XCircle,
    Loader2,
    Send,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
    pendingRequests: Meeting[]
    sentPending: Meeting[]
    upcoming: Meeting[]
    past: Meeting[]
    currentUserId: string
}

function getOtherPerson(meeting: Meeting, currentUserId: string) {
    const isRequester = meeting.requester?.id === currentUserId
    const otherPerson = isRequester ? meeting.recipient : meeting.requester
    const otherProfile = otherPerson?.athlete_profiles
    return {
        isRequester,
        otherPerson,
        avatarUrl: Array.isArray(otherProfile) ? otherProfile[0]?.avatar_url : otherProfile?.avatar_url,
        school: Array.isArray(otherProfile) ? otherProfile[0]?.school : otherProfile?.school,
        sport: Array.isArray(otherProfile) ? otherProfile[0]?.sport : otherProfile?.sport,
    }
}

function PendingRequestCard({ meeting, currentUserId, onRespond }: {
    meeting: Meeting
    currentUserId: string
    onRespond: (id: string, action: 'approve' | 'decline') => void
}) {
    const { otherPerson, avatarUrl, school, sport } = getOtherPerson(meeting, currentUserId)
    const startDate = new Date(meeting.start_time)
    const endDate = new Date(meeting.end_time)
    const [responding, setResponding] = useState<'approve' | 'decline' | null>(null)

    const handleRespond = async (action: 'approve' | 'decline') => {
        setResponding(action)
        await onRespond(meeting.id, action)
        setResponding(null)
    }

    return (
        <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 mt-0.5">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="font-bold">{otherPerson?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm truncate">{otherPerson?.name || 'Unknown'}</h4>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">Pending</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' at '}
                            {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            {' - '}
                            {endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {(school || sport) && (
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{[sport, school].filter(Boolean).join(' • ')}</p>
                        )}
                        {meeting.message && (
                            <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border border-border/40">
                                <p className="text-xs text-muted-foreground leading-relaxed">&ldquo;{meeting.message}&rdquo;</p>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                            <Button
                                size="sm"
                                className="gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={responding !== null}
                                onClick={() => handleRespond('approve')}
                            >
                                {responding === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={responding !== null}
                                onClick={() => handleRespond('decline')}
                            >
                                {responding === 'decline' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                Decline
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SentPendingRow({ meeting, currentUserId }: { meeting: Meeting; currentUserId: string }) {
    const { otherPerson, avatarUrl } = getOtherPerson(meeting, currentUserId)
    const startDate = new Date(meeting.start_time)

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card">
            <Avatar className="h-11 w-11 border border-border">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{otherPerson?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate">{otherPerson?.name || 'Unknown'}</h4>
                <p className="text-xs text-muted-foreground">
                    {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' at '}
                    {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] shrink-0">
                <Send className="h-3 w-3 mr-1" />
                Awaiting approval
            </Badge>
        </div>
    )
}

function MeetingDetailPanel({ meeting, currentUserId, onClose }: { meeting: Meeting; currentUserId: string; onClose: () => void }) {
    const { isRequester, otherPerson, avatarUrl, school, sport } = getOtherPerson(meeting, currentUserId)
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
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-border">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-lg font-bold">{otherPerson?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-lg">{otherPerson?.name || 'Unknown'}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {school && <span className="flex items-center gap-1"><School className="h-3 w-3" />{school}</span>}
                            {sport && <span className="flex items-center gap-1"><Trophy className="h-3 w-3" />{sport}</span>}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/50">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">Date</p>
                            <p className="text-muted-foreground text-sm">
                                {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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

                <div className="flex items-center gap-3">
                    <Badge variant={isPast ? "outline" : "success"} className="text-sm">
                        {meeting.status === 'DECLINED' ? 'Declined' : isPast ? 'Completed' : 'Confirmed'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Booked {new Date(meeting.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <Badge variant="outline" className="text-xs">
                        {isRequester ? 'You requested' : 'You were invited'}
                    </Badge>
                </div>

                {meeting.message && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{meeting.message}</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                    {meeting.meeting_link && !isPast && (
                        <Button className="gap-2" onClick={() => window.open(meeting.meeting_link!, '_blank')}>
                            <Video className="h-4 w-4" />
                            Join Meeting
                        </Button>
                    )}
                    {meeting.meeting_link && isPast && (
                        <Button variant="outline" className="gap-2" onClick={() => window.open(meeting.meeting_link!, '_blank')}>
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
    const { otherPerson, avatarUrl } = getOtherPerson(meeting, currentUserId)
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

export function MeetingsClient({ pendingRequests, sentPending, upcoming, past, currentUserId }: MeetingsClientProps) {
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
    const router = useRouter()

    const handleRespond = async (bookingId: string, action: 'approve' | 'decline') => {
        try {
            const res = await fetch('/api/scheduling/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, action }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to respond')

            if (action === 'approve') {
                const calMsg = data.calendar_synced
                    ? 'Meeting approved! Calendar invites sent to both of you.'
                    : 'Meeting approved! Connect your Google Calendar in Settings to auto-sync invites.'
                toast.success(calMsg, { duration: 5000 })
            } else {
                toast.success('Meeting declined.')
            }

            // Refresh page data
            router.refresh()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Something went wrong')
        }
    }

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
    const totalPending = pendingRequests.length + sentPending.length

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
                <p className="text-muted-foreground mt-1">View and manage your scheduled meetings.</p>
            </div>

            {/* Pending requests section */}
            {pendingRequests.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Approval ({pendingRequests.length})
                    </h2>
                    {pendingRequests.map(m => (
                        <PendingRequestCard
                            key={m.id}
                            meeting={m}
                            currentUserId={currentUserId}
                            onRespond={handleRespond}
                        />
                    ))}
                </div>
            )}

            {/* Sent pending (awaiting others' approval) */}
            {sentPending.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Awaiting Response ({sentPending.length})
                    </h2>
                    {sentPending.map(m => (
                        <SentPendingRow key={m.id} meeting={m} currentUserId={currentUserId} />
                    ))}
                </div>
            )}

            {/* Divider if there are pending items */}
            {totalPending > 0 && (upcoming.length > 0 || past.length > 0) && (
                <div className="border-t border-border/50" />
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border/50">
                <button
                    onClick={() => setTab('upcoming')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        tab === 'upcoming' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Upcoming ({upcoming.length})
                </button>
                <button
                    onClick={() => setTab('past')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        tab === 'past' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Past ({past.length})
                </button>
            </div>

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
