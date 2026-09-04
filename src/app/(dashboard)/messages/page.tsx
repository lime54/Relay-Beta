import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MessagesClient from "./messages-client"
import { ClearNotificationsOnMount } from "@/components/clear-notifications-on-mount"

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
        const stitched = rawConnections.map(req => ({
            ...req,
            requester: userMap[req.requester_id] || { name: 'Unknown', athlete_profiles: null },
            recipient: userMap[req.recipient_id] || { name: 'Unknown', athlete_profiles: null }
        }))

        // One conversation per person: multiple accepted requests with the same
        // person are merged into a single thread. The most recent request is the
        // representative; all_request_ids carries every thread so the client can
        // load messages across all of them.
        const groups = new Map<string, { rep: any; ids: string[] }>()
        for (const conn of stitched) {
            const otherId = conn.requester_id === user.id ? conn.recipient_id : conn.requester_id
            if (!otherId) continue
            const g = groups.get(otherId)
            if (!g) {
                groups.set(otherId, { rep: conn, ids: [conn.id] })
            } else {
                g.ids.push(conn.id)
                if (new Date(conn.created_at || 0) > new Date(g.rep.created_at || 0)) g.rep = conn
            }
        }
        activeConnections = Array.from(groups.values()).map(g => ({ ...g.rep, all_request_ids: g.ids }))
    }

    return (
        <>
            <ClearNotificationsOnMount target="messages" />
            <MessagesClient
                userId={user.id}
                initialConnections={activeConnections}
            />
        </>
    )
}
