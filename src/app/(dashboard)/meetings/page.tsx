import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MeetingsClient } from "./meetings-client"

export default async function MeetingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const now = new Date().toISOString()

    const bookingSelect = `
        id,
        start_time,
        end_time,
        status,
        meeting_link,
        message,
        provider_event_id,
        created_at,
        requester:requester_id (id, name, email, athlete_profiles(avatar_url, school, sport)),
        recipient:recipient_id (id, name, email, athlete_profiles(avatar_url, school, sport))
    `

    // Pending requests where the current user is the recipient
    const { data: pendingRequests } = await supabase
        .from('bookings')
        .select(bookingSelect)
        .eq('recipient_id', user.id)
        .eq('status', 'PENDING')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(20)

    // Pending requests the current user sent (awaiting approval)
    const { data: sentPending } = await supabase
        .from('bookings')
        .select(bookingSelect)
        .eq('requester_id', user.id)
        .eq('status', 'PENDING')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(20)

    const { data: upcoming } = await supabase
        .from('bookings')
        .select(bookingSelect)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'CONFIRMED')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(20)

    const { data: past } = await supabase
        .from('bookings')
        .select(bookingSelect)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .in('status', ['CONFIRMED', 'DECLINED'])
        .lt('start_time', now)
        .order('start_time', { ascending: false })
        .limit(20)

    return (
        <MeetingsClient
            pendingRequests={pendingRequests || []}
            sentPending={sentPending || []}
            upcoming={upcoming || []}
            past={past || []}
            currentUserId={user.id}
        />
    )
}
