import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MessagesClient from "./messages-client"

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch active conversations (requests that were accepted)
    const { data: rawConnections, error } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

    let activeConnections = []
    
    if (rawConnections && rawConnections.length > 0) {
        // Collect all unique user IDs involved in these requests
        const userIds = new Set<string>()
        rawConnections.forEach(req => {
            if (req.requester_id) userIds.add(req.requester_id)
            if (req.recipient_id) userIds.add(req.recipient_id)
        })

        // Fetch user details for all involved users
        const { data: usersData } = await supabase
            .from('users')
            .select('id, name, athlete_profiles(*)')
            .in('id', Array.from(userIds))

        const userMap: Record<string, any> = {}
        if (usersData) {
            usersData.forEach(u => {
                userMap[u.id] = u
            })
        }

        // Stitch the data together to match the expected Connection interface
        activeConnections = rawConnections.map(req => ({
            ...req,
            requester: userMap[req.requester_id] || { name: 'Unknown', athlete_profiles: null },
            recipient: userMap[req.recipient_id] || { name: 'Unknown', athlete_profiles: null }
        }))
    }

    return (
        <MessagesClient
            userId={user.id}
            initialConnections={activeConnections}
        />
    )
}
