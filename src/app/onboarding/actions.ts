'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const OnboardingSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    preferred_name: z.string().optional().default(""),
    email: z.string().email("Invalid email address"),
    status: z.enum(["current", "former"]),
    school: z.string().optional().default(""),
    sport: z.string().optional().default(""),
    grad_year: z.string().min(1, "Graduation year is required"),
    sectors: z.array(z.string()).min(1, "Pick at least one sector"),
    aspiration: z.string().optional().default(""),
})

export type OnboardingPayload = z.infer<typeof OnboardingSchema>

export async function submitOnboarding(rawData: OnboardingPayload) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "You must be logged in to complete onboarding." }
    }

    // Validate
    const validation = OnboardingSchema.safeParse(rawData)
    if (!validation.success) {
        const firstError = validation.error.issues[0]
        return { error: `${firstError.path.join('.')}: ${firstError.message}` }
    }
    const data = validation.data

    try {
        // Update athlete_profiles
        const { error: profileError } = await supabase
            .from('athlete_profiles')
            .upsert({
                user_id: user.id,
                preferred_name: data.preferred_name || null,
                status: data.status,
                school: data.school || null,
                sport: data.sport || null,
                grad_year: data.grad_year,
                career_sectors: data.sectors,
                aspiration: data.aspiration || null,
            })

        if (profileError) {
            console.error("Profile update error:", profileError)
            return { error: `Failed to update profile: ${profileError.message}` }
        }

        // Mark user as onboarded
        const { error: userError } = await supabase
            .from('users')
            .update({
                name: `${data.first_name} ${data.last_name}`.trim(),
                onboarded: true,
            })
            .eq('id', user.id)

        if (userError) {
            console.error("User update error:", userError)
            return { error: `Failed to update user status: ${userError.message}` }
        }

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (err) {
        console.error("Unexpected onboarding error:", err)
        return { error: "An unexpected error occurred during onboarding." }
    }
}
