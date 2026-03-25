import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { AthleteConnectionCard } from "./athlete-connection-card"

export default async function RequestsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch current user profile (for overlap logic)
    const { data: currentUserProfile } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch requests I sent (My Plays)
    const { data: sentRequests } = await supabase
        .from('requests')
        .select(`
            *,
            responses (
                id,
                response_type,
                responder_id,
                users:responder_id (
                    name,
                    athlete_profiles (school, sport)
                )
            )
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

    // Fetch requests sent to me (Team Huddle)
    const { data: receivedRequests } = await supabase
        .from('requests')
        .select(`
            *,
            users:requester_id (
                name,
                athlete_profiles (school, sport, graduation_year, level)
            )
        `)
        .neq('requester_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20)

    return (
        <div className="container mx-auto px-4 py-8 max-w-[1128px] animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* LEFT COLUMN: Team Huddle (Incoming Requests) - PRIMARY */}
                <main className="flex-1 w-full">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">My Network</h1>
                        <p className="text-slate-500">Athletes in your huddle waiting for a response</p>
                    </div>

                    {(!receivedRequests || receivedRequests.length === 0) ? (
                        <Card className="bg-slate-50 border-none shadow-none">
                            <CardContent className="py-16 text-center flex flex-col items-center">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-slate-100">
                                    🤝
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                                    You don&apos;t have any pending requests. Maybe verify your profile to become more visible?
                                </p>
                                <Link href="/profile/verify">
                                    <Button variant="outline">Verify Profile</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                                Incoming Requests ({receivedRequests.length})
                            </h2>
                            {receivedRequests.map((request) => (
                                <AthleteConnectionCard
                                    key={request.id}
                                    request={request}
                                    currentUserProfile={currentUserProfile || undefined}
                                />
                            ))}
                        </div>
                    )}
                </main>

                {/* RIGHT COLUMN: My Plays (Outgoing Status) - SECONDARY */}
                <aside className="w-full md:w-[320px] shrink-0">
                    <div className="sticky top-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-900">My Plays</h2>
                            <Link href="/network">
                                <Button size="sm" variant="secondary" className="gap-1.5 h-8 px-3">
                                    <Plus className="h-3.5 w-3.5" />
                                    New
                                </Button>
                            </Link>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                {(!sentRequests || sentRequests.length === 0) ? (
                                    <div className="p-6 text-center text-sm text-slate-500">
                                        No active requests sent.
                                        <div className="mt-3">
                                            <Link href="/network">
                                                <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                                                    Browse network &rarr;
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {sentRequests.map((req) => {
                                            const acceptance = (req as any).responses?.find((r: { response_type: string }) => r.response_type === 'accept');
                                            const responder = acceptance?.users;

                                            return (
                                                <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            {req.request_type.split('_').join(' ')}
                                                        </span>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                            req.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-900 line-clamp-2">
                                                        {req.context}
                                                    </p>
                                                    {req.status === 'accepted' && responder && (
                                                        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-green-200 flex items-center justify-center text-[10px] font-bold text-green-700">
                                                                    {responder.name?.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] font-bold text-green-900 truncate">{responder.name}</p>
                                                                    <p className="text-[9px] text-green-700 truncate">{responder.athlete_profiles?.school}</p>
                                                                </div>
                                                                <Link href={`/messages?id=${req.id}`}>
                                                                    <Button size="sm" variant="secondary" className="h-7 px-3 text-[10px] bg-green-600 hover:bg-green-700 text-white border-0">
                                                                        Message
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="mt-2 text-xs text-slate-400">
                                                        Sent {new Date(req.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <h4 className="font-semibold text-blue-900 text-sm mb-1">💡 Pro Tip</h4>
                            <p className="text-xs text-blue-800 leading-relaxed">
                                Athletes are 3x more likely to respond if you mention your shared sport in the first sentence.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}


