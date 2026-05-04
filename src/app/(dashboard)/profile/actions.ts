'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { calculateSimilarityScore, ProfileSnippet } from "@/lib/similarity"

export async function addExperience(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const company = formData.get('company') as string
    const role = formData.get('role') as string
    const description = formData.get('description') as string
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    const is_current = formData.get('is_current') === 'on'

    const { error } = await supabase
        .from('experiences')
        .insert({
            user_id: user.id,
            company,
            role,
            description,
            start_date,
            end_date: is_current ? null : end_date,
            is_current
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function deleteExperience(experienceId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', experienceId)
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function addEducation(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const school = formData.get('school') as string
    const degree = formData.get('degree') as string
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    const description = formData.get('description') as string
    const is_current = formData.get('is_current') === 'on'

    const { error } = await supabase
        .from('educations')
        .insert({
            user_id: user.id,
            school,
            degree, // We'll use this column for both Degree and Major for now
            start_date,
            end_date: is_current ? null : end_date,
            is_current,
            description
        })

    if (error) {
        console.error("Education insert error:", error)
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function deleteEducation(educationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('educations')
        .delete()
        .eq('id', educationId)
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}
export async function updateProfileImage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const file = formData.get('file') as File
    const type = formData.get('type') as 'avatar' | 'cover'

    if (!file) return { error: 'No file provided' }

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${type}_${Math.random()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

    if (uploadError) return { error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

    const updateData = type === 'avatar'
        ? { avatar_url: publicUrl }
        : { cover_url: publicUrl }

    const { error: updateError } = await supabase
        .from('athlete_profiles')
        .update(updateData)
        .eq('user_id', user.id)

    if (updateError) return { error: updateError.message }

    revalidatePath('/profile')
    return { success: true, url: publicUrl }
}

export async function removeProfileImage(type: 'avatar' | 'cover') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const updateData = type === 'avatar'
        ? { avatar_url: null }
        : { cover_url: null }

    const { error } = await supabase
        .from('athlete_profiles')
        .update(updateData)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    return { success: true }
}

export async function uploadResume(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: 'Not authenticated' }

        const file = formData.get('file') as File
        if (!file) return { success: false, error: 'No file provided' }

        if (file.type !== 'application/pdf') {
            return { success: false, error: 'Only PDF files are allowed' }
        }

        // Limit file size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            return { success: false, error: 'File size must be less than 5MB' }
        }

        const fileExt = 'pdf'
        const filePath = `${user.id}/resume_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error("Supabase storage upload error:", uploadError)
            return { success: false, error: `Storage upload failed: ${uploadError.message}` }
        }

        const { data: urlData } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath)

        if (!urlData || !urlData.publicUrl) {
            return { success: false, error: 'Failed to generate public URL' }
        }

        const { error: updateError } = await supabase
            .from('athlete_profiles')
            .update({ resume_url: urlData.publicUrl })
            .eq('user_id', user.id)

        if (updateError) {
            console.error("Supabase database update error:", updateError)
            return { success: false, error: `Database update failed: ${updateError.message}` }
        }

        revalidatePath('/profile')
        return { success: true, url: urlData.publicUrl }
    } catch (err) {
        console.error("Unexpected error in uploadResume server action:", err)
        return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
}

// Accepts: https://www.linkedin.com/in/<handle>, /pub/<handle>, /company/<handle>
// (with or without www, with or without trailing slash). Reject anything else.
const LINKEDIN_URL_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9_-]+\/?$/

export async function updateLinkedInUrl(url: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const trimmed = (url ?? '').trim()
    let nextValue: string | null
    if (trimmed === '') {
        nextValue = null
    } else if (LINKEDIN_URL_REGEX.test(trimmed)) {
        nextValue = trimmed
    } else {
        return { error: "That doesn't look like a LinkedIn profile URL. Example: https://www.linkedin.com/in/yourname" }
    }

    const { error } = await supabase
        .from('athlete_profiles')
        .update({ linkedin_url: nextValue })
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    return { success: true }
}

export async function getSimilarityScore(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { score: 0 }

    // Fetch both profiles
    const { data: profiles, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .in('user_id', [currentUser.id, targetUserId])

    if (error || !profiles || profiles.length < 2) return { score: 0 }

    const p1 = profiles.find(p => p.user_id === currentUser.id)
    const p2 = profiles.find(p => p.user_id === targetUserId)

    if (!p1 || !p2) return { score: 0 }

    const score = calculateSimilarityScore(p1 as ProfileSnippet, p2 as ProfileSnippet)
    return { score }
}

export async function checkConnection(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { connected: false }
    if (currentUser.id === targetUserId) return { connected: true }

    const { data, error } = await supabase
        .from('requests')
        .select('status')
        .or(`and(requester_id.eq.${currentUser.id},recipient_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},recipient_id.eq.${currentUser.id})`)
        .eq('status', 'accepted')
        .maybeSingle()

    if (error || !data) return { connected: false }
    return { connected: true }
}

export async function updateIndustry(industry: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // Read the current sectors so we don't overwrite the whole array
    const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    let sectors = profile?.career_sectors || []
    
    // Put the new primary industry at the front of the array (index 0)
    // and remove it from the rest of the array if it exists there
    sectors = [industry, ...sectors.filter((s: string) => s !== industry)]

    const { error } = await supabase
        .from('athlete_profiles')
        .update({ career_sectors: sectors })
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    return { success: true }
}
