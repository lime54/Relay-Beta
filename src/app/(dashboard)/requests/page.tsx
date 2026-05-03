import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Send, Inbox, MessageCircle, Clock, ArrowRight } from "lucide-react"
import { InboxList } from "./inbox-list"
import { ClearNotificationsOnMount } from "@/components/clear-notifications-on-mount"

export default async function RequestsPage({
    searchParams
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const sp = await searchParams
    const activeTab = sp.tab || 'all'

    // Fetch current user profile (for overlap logic)
    const { data: currentUserProfile } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch requests I sent (My Plays) - no FK join on recipient_id, so fetch separately
    const { data: rawSentRequests, error: sentError } = await supabase
        .from('requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

    if (sentError) {
        console.error('[RequestsPage] sentRequests error:', sentError)
    }

    // Bulk fetch recipient user data for sent requests
    const recipientIds = (rawSentRequests || [])
        .map((r: any) => r.recipient_id)
        .filter(Boolean)
    
    let recipientMap: Record<string, any> = {}
    if (recipientIds.length > 0) {
        const { data: recipientUsers } = await supabase
            .from('users')
            .select('id, name, athlete_profiles(*)')
            .in('id', recipientIds)
        
        if (recipientUsers) {
            recipientUsers.forEach((u: any) => {
                recipientMap[u.id] = u
            })
        }
    }

    // Stitch recipient data into sent requests
    const sentRequests = (rawSentRequests || []).map((req: any) => ({
        ...req,
        recipient: req.recipient_id ? recipientMap[req.recipient_id] || null : null
    }))

    // Fetch requests sent to me (Inbox)
    const { data: receivedRequests, error: receivedError } = await supabase
        .from('requests')
        .select(`
            *,
            users:requester_id (
                name,
                athlete_profiles (*)
            )
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20)

    if (receivedError) {
        console.error('[RequestsPage] receivedRequests error:', receivedError)
    }

    const allCount = (sentRequests?.length || 0) + (receivedRequests?.length || 0)
    const sentCount = sentRequests?.length || 0
    const receivedCount = receivedRequests?.length || 0

    const tabs = [
        { id: 'all', label: 'All Activity', count: allCount },
        { id: 'sent', label: 'Sent', count: sentCount, icon: Send },
        { id: 'inbox', label: 'Inbox', count: receivedCount, icon: Inbox },
    ]

    return (
        <div className="container mx-auto px-4 py-8 max-w-[900px] animate-fade-in">
            <ClearNotificationsOnMount target="requests" />
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Requests</h1>
                    <p className="text-slate-500 mt-1">Manage your connections and incoming requests</p>
                </div>
                <Link href="/network">
                    <Button className="gap-2 rounded-full px-6 h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4" />
                        New Request
                    </Button>
                </Link>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mb-8">
                {tabs.map((tab) => (
                    <Link
                        key={tab.id}
                        href={`/requests${tab.id === 'all' ? '' : `?tab=${tab.id}`}`}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.icon && <tab.icon className="h-4 w-4" />}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-200 text-slate-600'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {/* Inbox Section (show when tab is 'all' or 'inbox') */}
                {(activeTab === 'all' || activeTab === 'inbox') && (
                    <InboxList
                        initialRequests={(receivedRequests || []) as any}
                        currentUserProfile={currentUserProfile || undefined}
                        showHeader={receivedCount > 0}
                        showEmptyState={activeTab === 'inbox'}
                    />
                )}

                {/* Divider between sections when showing all */}
                {activeTab === 'all' && receivedCount > 0 && sentCount > 0 && (
                    <div className="border-t border-slate-200 my-6" />
                )}

                {/* Sent Section (show when tab is 'all' or 'sent') */}
                {(activeTab === 'all' || activeTab === 'sent') && (
                    <>
                        {sentCount > 0 && (
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Send className="h-3.5 w-3.5" />
                                Sent Requests ({sentCount})
                            </h2>
                        )}
                        {sentRequests && sentRequests.length > 0 ? (
                            <div className="space-y-3">
                                {sentRequests.map((req) => {
                                    const recipient = (req as any).recipient
                                    const recipientName = recipient?.name || 'Someone'
                                    const recipientSchool = recipient?.athlete_profiles?.school
                                    const recipientSport = recipient?.athlete_profiles?.sport

                                    return (
                                        <Card key={req.id} className="hover:shadow-md transition-all overflow-hidden border-border/60">
                                            <CardContent className="p-0">
                                                <div className="flex items-stretch">
                                                    {/* Status Bar */}
                                                    <div className={`w-1.5 shrink-0 ${
                                                        req.status === 'accepted' ? 'bg-green-500' :
                                                        req.status === 'declined' ? 'bg-red-400' :
                                                        'bg-amber-400'
                                                    }`} />

                                                    <div className="flex-1 p-5">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                                                                    {recipientName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 text-sm">{recipientName}</p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {[recipientSport, recipientSchool].filter(Boolean).join(' • ') || 'Athlete'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                                                                req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                                req.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {req.status}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                {req.request_type?.split('_').join(' ')}
                                                            </span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(req.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>

                                                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                                                            {req.context}
                                                        </p>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                                                            {req.status === 'accepted' ? (
                                                                <Link href={`/messages?user=${recipient?.id || ''}`}>
                                                                    <Button size="sm" className="h-8 px-4 text-xs bg-green-600 hover:bg-green-700 text-white rounded-full gap-1.5">
                                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                                        Message
                                                                    </Button>
                                                                </Link>
                                                            ) : req.status === 'pending' ? (
                                                                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    Waiting for response...
                                                                </span>
                                                            ) : null}
                                                            <Link href={`/requests/${req.id}`} className="ml-auto">
                                                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-slate-500 hover:text-slate-900 gap-1">
                                                                    Details
                                                                    <ArrowRight className="h-3 w-3" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : activeTab === 'sent' ? (
                            <Card className="bg-slate-50 border-none shadow-none">
                                <CardContent className="py-16 text-center flex flex-col items-center">
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-slate-100">
                                        🚀
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">No requests sent yet</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                                        Browse the network to find athletes and send your first connection request.
                                    </p>
                                    <Link href="/network">
                                        <Button variant="outline" className="rounded-full px-6">Browse Network</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : null}
                    </>
                )}

                {/* Empty state for All tab */}
                {activeTab === 'all' && allCount === 0 && (
                    <Card className="bg-slate-50 border-none shadow-none">
                        <CardContent className="py-16 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-slate-100">
                                🤝
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No activity yet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                                Start connecting with athletes in the network to build your professional circle.
                            </p>
                            <Link href="/network">
                                <Button className="rounded-full px-6 gap-2">
                                    <Plus className="h-4 w-4" />
                                    Browse Network
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Pro Tip */}
            {allCount > 0 && (
                <div className="mt-8 bg-blue-50 rounded-2xl p-5 border border-blue-100">
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">💡 Pro Tip</h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                        Athletes are 3x more likely to respond if you mention your shared sport in the first sentence.
                    </p>
                </div>
            )}
        </div>
    )
}
