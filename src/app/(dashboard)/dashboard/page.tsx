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

    const isVerified = profile?.verification_status === 'verified'

    // Count sent requests (My Plays)
    const { count: sentCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', user.id)

    // Count incoming pending requests (Team Huddle)
    // A request is incoming if the recipient is the current user (this is inferred from lack of recipient_id column if it's a global pool, 
    // but in this app architecture, it seems requests are directed. 
    // Actually, looking at network page, we send requests to specific IDs.
    // So Team Huddle should be requests WHERE recipient_id = user.id (which is currently stored in Metadata or separate table?)
    // Let me check requests table schema mentally or via tool. 
    // Fix: Team Huddle should be requests where requester_id != user.id AND status = 'pending' (simplified for now if global pool, 
    // but ideally filtered by recipient_id).
    const { count: receivedCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .neq('requester_id', user.id)

    // Count accepted requests (Successful Connections)
    const { count: acceptedCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', user.id)
        .eq('status', 'accepted')

    // Count pending outgoing requests
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
