import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./dashboard-client"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Get user name from metadata
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Athlete'
    const userRole = user.user_metadata?.role || 'student'

    // Check verification status
    const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('verification_status')
        .eq('user_id', user.id)
        .single()

    const isVerified = profile?.verification_status === true

    // Count sent requests
    const { count: sentCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', user.id)

    // Count received requests
    const { count: receivedCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .neq('requester_id', user.id)

    // Count accepted requests
    const { count: acceptedCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', user.id)
        .eq('status', 'accepted')

    // Count pending requests
    const { count: pendingCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', user.id)
        .eq('status', 'pending')

    // Fetch recent requests (last 5)
    const { data: recentRequests } = await supabase
        .from('requests')
        .select('id, request_type, status, created_at')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <DashboardClient
            data={{
                userName,
                userRole,
                isVerified,
                sentCount: sentCount || 0,
                receivedCount: receivedCount || 0,
                acceptedCount: acceptedCount || 0,
                pendingCount: pendingCount || 0,
                recentRequests: recentRequests || []
            }}
        />
    )
}
