import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Clock, Calendar, Gift, User, School, Trophy } from "lucide-react"
import { ResponseActions } from "./response-actions"

type RequestWithDetails = {
    id: string
    request_type: string
    context: string
    time_commitment: string
    offer_in_return: string
    status: string
    ai_assisted: boolean
    created_at: string
    expires_at: string
    requester_id: string
    users: {
        id: string
        name: string
        email: string
        athlete_profiles: {
            school: string
            sport: string
            ncaa_level: string
            years_active: string
            verification_status: boolean
        } | null
    }
    responses: Array<{
        id: string
        response_type: string
        message: string
        created_at: string
        responder_id: string
    }>
}

function getRequestTypeLabel(type: string) {
    switch (type) {
        case 'advice': return 'Career Advice'
        case 'internship': return 'Internship Opportunity'
        case 'fulltime': return 'Full-time Role'
        case 'referral': return 'Referral Request'
        default: return type
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'pending':
            return <Badge variant="warning" className="text-sm">Pending Response</Badge>
        case 'accepted':
            return <Badge variant="success" className="text-sm">Accepted</Badge>
        case 'declined':
            return <Badge variant="destructive" className="text-sm">Declined</Badge>
        case 'referred':
            return <Badge variant="outline" className="text-sm">Referred</Badge>
        default:
            return <Badge className="text-sm">{status}</Badge>
    }
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })
}

function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date()
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: request, error } = await supabase
        .from('requests')
        .select(`
            *,
            users:requester_id (
                id,
                name,
                email,
                athlete_profiles (school, sport, ncaa_level, years_active, verification_status)
            ),
            responses (id, response_type, message, created_at, responder_id)
        `)
        .eq('id', id)
        .single()

    if (error || !request) {
        notFound()
    }

    const typedRequest = request as unknown as RequestWithDetails
    const isOwner = typedRequest.requester_id === user.id
    const hasResponded = typedRequest.responses?.some(r => r.responder_id === user.id)
    const expired = isExpired(typedRequest.expires_at)

    return (
        <div className="container mx-auto p-4 max-w-3xl animate-fade-in">
            {/* Back button */}
            <Link href="/requests" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                <ArrowLeft className="h-4 w-4" />
                Back to Requests
            </Link>

            {/* Request Header */}
            <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-heading-1 text-primary">
                        {getRequestTypeLabel(typedRequest.request_type)}
                    </h1>
                    {getStatusBadge(typedRequest.status)}
                    {expired && typedRequest.status === 'pending' && (
                        <Badge variant="destructive">Expired</Badge>
                    )}
                </div>
                <p className="text-muted-foreground">
                    Created {formatDate(typedRequest.created_at)}
                </p>
            </div>

            <div className="grid gap-6">
                {/* Requester Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Requester
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarFallback>{(typedRequest.users?.name || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <p className="font-semibold text-lg">{typedRequest.users?.name}</p>
                                {typedRequest.users?.athlete_profiles && (
                                    <>
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <Trophy className="h-4 w-4" />
                                            {typedRequest.users.athlete_profiles.sport} • {typedRequest.users.athlete_profiles.ncaa_level}
                                        </p>
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <School className="h-4 w-4" />
                                            {typedRequest.users.athlete_profiles.school}
                                        </p>
                                        {typedRequest.users.athlete_profiles.verification_status && (
                                            <Badge variant="success" className="mt-2">Verified Athlete</Badge>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Request Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Request Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Context</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap">{typedRequest.context}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Time Requested</p>
                                    <p className="text-sm text-muted-foreground">{typedRequest.time_commitment}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Expires</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(typedRequest.expires_at)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-start gap-3">
                                <Gift className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Offering in Return</p>
                                    <p className="text-sm text-muted-foreground">{typedRequest.offer_in_return}</p>
                                </div>
                            </div>
                        </div>

                        {typedRequest.ai_assisted && (
                            <div className="pt-4 border-t">
                                <Badge variant="outline" className="text-xs">AI-Assisted Draft</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Response Actions (for non-owners who haven't responded) */}
                {!isOwner && !hasResponded && typedRequest.status === 'pending' && !expired && (
                    <Card className="border-secondary border-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Your Response</CardTitle>
                            <CardDescription>
                                How would you like to help this fellow athlete?
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponseActions requestId={typedRequest.id} />
                        </CardContent>
                    </Card>
                )}

                {/* Owner view - show responses */}
                {isOwner && typedRequest.responses && typedRequest.responses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Responses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {typedRequest.responses.map((response) => (
                                    <div key={response.id} className="p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            {response.response_type === 'accept' && <Badge variant="success">Accepted</Badge>}
                                            {response.response_type === 'decline' && <Badge variant="destructive">Declined</Badge>}
                                            {response.response_type === 'refer' && <Badge variant="outline">Referred</Badge>}
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(response.created_at)}
                                            </span>
                                        </div>
                                        {response.message && (
                                            <p className="text-sm text-muted-foreground">{response.message}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Already responded message */}
                {!isOwner && hasResponded && (
                    <Card className="bg-muted/30">
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">You have already responded to this request.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
