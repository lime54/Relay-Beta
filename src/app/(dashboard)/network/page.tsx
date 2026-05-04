import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import NetworkClient from "./network-client"
import { ConnectionsList, type Connection } from "./connections-list"
import { calculateSimilarityScore, ProfileSnippet } from "@/lib/similarity"
import { Compass, Users } from "lucide-react"

export const dynamic = 'force-dynamic'

type Sport = "Squash" | "Tennis" | "Golf" | "Hockey" | "Basketball" | "Football"

export default async function NetworkPage({
    searchParams
}: {
    searchParams: Promise<{ search?: string; sport?: string; industry?: string; tab?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const sp = await searchParams
    const search = sp.search || ''
    const sport = sp.sport && sp.sport !== 'All' ? sp.sport : null
    const industry = sp.industry && sp.industry !== 'All' ? sp.industry : null
    const activeTab = sp.tab === 'mine' ? 'mine' : 'discover'

    // Fetch the current user's athlete profile for similarity scoring
    const { data: currentProfile } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // ---- Compute connection counts (used by tab badges) ----
    const { data: acceptedRequests } = await supabase
        .from('requests')
        .select('requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

    const connectionUserIds = new Set<string>()
    ;(acceptedRequests || []).forEach(req => {
        const other = req.requester_id === user.id ? req.recipient_id : req.requester_id
        if (other && other !== user.id) connectionUserIds.add(other)
    })

    let connections: Connection[] = []
    if (activeTab === 'mine' && connectionUserIds.size > 0) {
        const ids = Array.from(connectionUserIds)
        const { data: connUsers } = await supabase
            .from('users')
            .select('id, name, avatar_url, athlete_profiles(*)')
            .in('id', ids)

        // Bulk-fetch current experiences for headline
        const { data: connExperiences } = await supabase
            .from('experiences')
            .select('user_id, company, role')
            .in('user_id', ids)
            .eq('is_current', true)

        const expByUser: Record<string, { company: string; role: string }> = {}
        ;(connExperiences || []).forEach(e => {
            if (!expByUser[e.user_id]) expByUser[e.user_id] = { company: e.company, role: e.role }
        })

        connections = (connUsers || []).map((u: any) => {
            const profiles = u.athlete_profiles
            const profile = Array.isArray(profiles) ? profiles[0] : profiles
            const exp = expByUser[u.id]
            const headline = exp ? `${exp.role} at ${exp.company}` : (profile?.career_sectors?.[0] || undefined)
            return {
                id: u.id,
                name: u.name || 'Unknown',
                headline,
                school: profile?.school,
                sport: profile?.sport,
                avatarUrl: u.avatar_url || profile?.avatar_url || undefined,
                linkedinUrl: profile?.linkedin_url || undefined,
                schedulingUrl: profile?.scheduling_url || undefined,
            }
        }).sort((a, b) => a.name.localeCompare(b.name))
    }

    // Build sub-tab nav (always rendered)
    const tabs = [
        { id: 'discover', label: 'Discover', icon: Compass },
        { id: 'mine', label: 'My Connections', icon: Users, count: connectionUserIds.size },
    ] as const

    const TabsNav = (
        <div className="max-w-7xl mx-auto px-4 mb-6">
            <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-full md:w-fit">
                {tabs.map(t => {
                    const Icon = t.icon
                    const href = t.id === 'discover' ? '/network' : '/network?tab=mine'
                    const isActive = activeTab === t.id
                    return (
                        <Link
                            key={t.id}
                            href={href}
                            className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold transition-all ${
                                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {t.label}
                            {'count' in t && t.count !== undefined && t.count > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    isActive ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {t.count}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </div>
        </div>
    )

    if (activeTab === 'mine') {
        return (
            <div className="w-full">
                {TabsNav}
                <div className="max-w-7xl mx-auto px-4 pb-20">
                    <ConnectionsList connections={connections} />
                </div>
            </div>
        )
    }

    // ---- Discover tab (existing logic) ----
    let query = supabase
        .from('users')
        .select('id, name, email, role, avatar_url, athlete_profiles(*)')
        .neq('id', user.id)

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query;

    if (error) {
        console.error('Error fetching users:', error)
    }

    const userIds = users?.map(u => u.id) || []
    let experiencesMap: Record<string, {company: string, role: string}> = {}

    if (userIds.length > 0) {
        const { data: expData, error: expError } = await supabase
            .from('experiences')
            .select('user_id, company, role, is_current')
            .in('user_id', userIds)
            .eq('is_current', true)

        if (!expError && expData) {
            expData.forEach(exp => {
                if (!experiencesMap[exp.user_id]) {
                    experiencesMap[exp.user_id] = { company: exp.company, role: exp.role }
                }
            })
        }
    }

    const realUsers: any[] = (users || [])
        .filter((u: any) => {
            const profiles = u.athlete_profiles
            if (!profiles) return false
            return Array.isArray(profiles) ? profiles.length > 0 : !!profiles
        })
        .map((u: any) => {
            const profiles = u.athlete_profiles
            const profile = Array.isArray(profiles) ? profiles[0] : profiles

            const displaySport = profile?.sport || 'Athlete'

            let similarityScore = 0
            if (currentProfile && profile) {
                similarityScore = calculateSimilarityScore(
                    currentProfile as ProfileSnippet,
                    profile as ProfileSnippet
                )
            }

            return {
                id: u.id,
                name: u.name || u.email || 'Unknown User',
                role: u.role === 'student' ? 'Student-Athlete' : 'Alumni',
                school: profile?.school || 'Unknown School',
                sport: displaySport as Sport,
                level: profile?.year || undefined,
                imageUrl: u.avatar_url || profile?.avatar_url || '',
                industry: profile?.career_sectors?.[0] || undefined,
                company: experiencesMap[u.id]?.company,
                position: experiencesMap[u.id]?.role,
                isPlaceholder: false as const,
                isVerified: profile?.verification_status || false,
                similarityScore,
                linkedinUrl: profile?.linkedin_url || undefined,
            }
        })

    const finalUsers = realUsers.filter(u => {
        const sportMatch = !sport || (u.sport === sport);
        const industryMatch = !industry || (u.industry === industry);
        return sportMatch && industryMatch;
    })

    finalUsers.sort((a: any, b: any) => (b.similarityScore || 0) - (a.similarityScore || 0))

    return (
        <div className="w-full">
            {TabsNav}
            <NetworkClient
                realUsers={finalUsers}
                initialSearch={search}
                initialSport={sport || 'All'}
                initialIndustry={industry || 'All'}
            />

            {/* Diagnostic info (hidden unless empty) */}
            {realUsers.length === 0 && (
                <div className="max-w-7xl mx-auto px-4 opacity-50 hover:opacity-100 transition-opacity pb-20">
                    <pre className="p-4 bg-slate-900 text-red-400 rounded-2xl text-[10px] overflow-auto font-mono border border-red-500/30">
                        {JSON.stringify({
                            query_status: error ? 'error' : 'empty',
                            error_message: error?.message,
                            raw_db_count: users?.length || 0,
                            transformed_count: realUsers?.length || 0
                        }, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
