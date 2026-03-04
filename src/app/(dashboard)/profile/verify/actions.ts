'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function submitVerification(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const school = formData.get('school') as string
    const sport = formData.get('sport') as string
    const ncaa_level = formData.get('ncaa_level') as string
    const years_active = formData.get('years_active') as string
    const verification_type = formData.get('verification_type') as string
    const proof_url = formData.get('proof_url') as string // In real app, handle file upload

    // 1. Upsert Athlete Profile (Unverified initially)
    const { error: profileError } = await supabase
        .from('athlete_profiles')
        .upsert({
            user_id: user.id,
            school,
            sport,
            ncaa_level,
            years_active,
            verification_status: false // Always starts false
        })

    if (profileError) {
        if (profileError.code === '42501') {
            // RLS error, likely because public.users row doesn't exist for this auth user yet.
            // Try creating the public user first (Lazy creation)
            await supabase.from('users').insert({
                id: user.id,
                email: user.email,
                role: 'student', // Default or fetch from metadata
                name: user.user_metadata?.name || 'User'
            })

            // Retry upsert
            await supabase.from('athlete_profiles').upsert({
                user_id: user.id,
                school,
                sport,
                ncaa_level,
                years_active,
                verification_status: false
            })
        } else {
            redirect(`/profile/verify?error=${encodeURIComponent(profileError.message)}`)
        }
    }

    // 2. Create Verification Request object
    const { error: requestError } = await supabase
        .from('verification_requests')
        .insert({
            user_id: user.id,
            verification_type,
            uploaded_proof_url: proof_url,
            status: 'pending'
        })

    if (requestError) {
        redirect(`/profile/verify?error=${encodeURIComponent(requestError.message)}`)
    }

    revalidatePath('/profile')
    redirect('/profile?message=Verification Submitted')
}

