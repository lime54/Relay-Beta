'use server'

import { createClient } from "@/lib/supabase/server"

export async function resetOnboarding() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Not authenticated" }

    const { error } = await supabase
        .from('users')
        .update({ onboarded: false })
        .eq('id', user.id)

    if (error) return { error: error.message }

    return { success: true }
}
