'use server'

import { createClient } from '@/lib/supabase/server'

// Mark every pending incoming request as seen for the current user.
// Returns whether the DB write succeeded so the client can decide whether to
// retry on next mount or just live with an in-memory clear for this session.
export async function markRequestsSeenAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'unauthenticated' }

    const nowIso = new Date().toISOString()
    const { error } = await supabase
        .from('requests')
        .update({ seen_at: nowIso })
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .is('seen_at', null)

    if (error) {
        // Most common cause: the seen_at column hasn't been migrated yet, or
        // the UPDATE RLS policy is missing. Surface to the client so it can
        // log a warning. Local badge state is still cleared.
        return { ok: false, error: error.message }
    }
    return { ok: true }
}

export async function markMessagesSeenAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'unauthenticated' }

    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

    if (error) {
        return { ok: false, error: error.message }
    }
    return { ok: true }
}
