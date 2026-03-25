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
    isPlaceholder: false
}

export default async function NetworkPage({
    searchParams
}: {
    searchParams: Promise<{ search?: string; sport?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const sp = await searchParams
    const search = sp.search || ''
    const sport = sp.sport && sp.sport !== 'All' ? sp.sport : null

    // Fetch users with their athlete profiles
    let query = supabase
        .from('users')
        .select('id, name, email, role, athlete_profiles(sport, school, ncaa_level, verification_status)')
        .neq('id', user.id)

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query;

    if (error) {
        console.error('Error fetching users:', error)
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
                isPlaceholder: false as const,
                isVerified: profile?.verification_status || false,
            }
        })

    // Post-fetch filter for sport (since cross-table filtering in 1-select is tricky in some versions of Supabase SDK)
    const finalUsers = realUsers.filter(u => !sport || u.sport === sport)

    return (
        <div className="w-full">
            <NetworkClient
                realUsers={finalUsers}
                initialSearch={search}
                initialSport={sport || 'All'}
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
