'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

export async function updateProfileTheme(gradient: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('athlete_profiles')
        .update({ theme_gradient: gradient })
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    return { success: true }
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
