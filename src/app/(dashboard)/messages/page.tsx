import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MessagesClient from "./messages-client"

export default async function MessagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch active conversations (requests that were accepted)
    // We'll show requests where either the user is the requester OR the responder
    const { data: activeConnections } = await supabase
        .from('requests')
        .select(`
            id,
            request_type,
            status,
            requester_id,
            recipient_id,
            users:requester_id (name, email),
            athlete_profiles:requester_id (school, sport, avatar_url)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id}, recipient_id.eq.${user.id}`)

    return (
        <MessagesClient
            userId={user.id}
            initialConnections={activeConnections || []}
        />
    )
}
