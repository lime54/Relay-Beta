import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NetworkClient from "./network-client"

export const dynamic = 'force-dynamic'

type Sport = "Squash" | "Tennis" | "Golf" | "Hockey" | "Basketball" | "Football"

interface RealUser {
    id: string
    name: string
    role: string
    school: string
    sport: Sport
    level?: string
    imageUrl?: string
    industry?: string
    company?: string
    position?: string
    isPlaceholder: false
}

export default async function NetworkPage({
    searchParams
}: {
    searchParams: Promise<{ search?: string; sport?: string; industry?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const sp = await searchParams
    const search = sp.search || ''
    const sport = sp.sport && sp.sport !== 'All' ? sp.sport : null
    const industry = sp.industry && sp.industry !== 'All' ? sp.industry : null

    // Fetch users with their athlete profiles
    let query = supabase
        .from('users')
        .select('id, name, email, role, avatar_url, athlete_profiles(sport, school, ncaa_level, verification_status, avatar_url)')
        .neq('id', user.id)

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query;

    if (error) {
        console.error('Error fetching users:', error)
    }

    // Fetch all current experiences for these users in bulk
    const userIds = users?.map(u => u.id) || []
    let experiencesMap: Record<string, {company: string, role: string}> = {}
    
    if (userIds.length > 0) {
        const { data: expData, error: expError } = await supabase
            .from('experiences')
            .select('user_id, company, role, is_current')
            .in('user_id', userIds)
            .eq('is_current', true)

        if (!expError && expData) {
            // Priority to the first current experience
            expData.forEach(exp => {
                if (!experiencesMap[exp.user_id]) {
                    experiencesMap[exp.user_id] = { company: exp.company, role: exp.role }
                }
            })
        }
    }

    // Transform database rows into the format the client component expects
    const realUsers: any[] = (users || [])
        .filter((u: any) => {
            const profiles = u.athlete_profiles
            if (!profiles) return false
            return Array.isArray(profiles) ? profiles.length > 0 : !!profiles
        })
        .map((u: any) => {
            const profiles = u.athlete_profiles
            const profile = Array.isArray(profiles) ? profiles[0] : profiles

            return {
                id: u.id,
                name: u.name || u.email || 'Unknown User',
                role: u.role === 'student' ? 'Student-Athlete' : 'Alumni',
                school: profile?.school || 'Unknown School',
                sport: (profile?.sport || 'Squash') as Sport,
                level: profile?.ncaa_level || undefined,
                imageUrl: u.avatar_url || profile?.avatar_url || '',
                company: experiencesMap[u.id]?.company,
                position: experiencesMap[u.id]?.role,
                isPlaceholder: false as const,
                isVerified: profile?.verification_status || false,
            }
        })

    // Post-fetch filter for sport
    const finalUsers = realUsers.filter(u => (!sport || u.sport === sport))

    return (
        <div className="w-full">
            <NetworkClient
                realUsers={finalUsers}
                initialSearch={search}
                initialSport={sport || 'All'}
                initialIndustry={industry || 'All'}
            />

            {/* Diagnostic info (hidden unless empty) */}
            {realUsers.length === 0 && (
                <div className="max-w-7xl mx-auto px-4 opacity-20 hover:opacity-100 transition-opacity">
                    <pre className="p-4 bg-slate-900 text-slate-50 rounded-2xl text-[10px] overflow-auto font-mono">
                        {JSON.stringify({ query_status: error ? 'error' : 'empty', count: users?.length || 0 }, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
