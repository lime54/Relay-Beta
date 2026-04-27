'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { OnboardingData } from "./onboarding-form"
import { z } from "zod"

// Strict validation schema for onboarding data
const OnboardingSchema = z.object({
    profile: z.object({
        first_name: z.string().min(1, "First name is required"),
        last_name: z.string().min(1, "Last name is required"),
        preferred_name: z.string().optional(),
        email: z.string().email("Invalid email address"),
        country: z.string().min(1),
        linkedin: z.string().url().or(z.literal("")).optional(),
        status: z.string().min(1, "Status is required"),
    }),
    athletic: z.object({
        is_athlete: z.boolean(),
        college: z.string().min(1, "College is required"),
        secondary_college: z.string().optional(),
        sports: z.array(z.object({
            name: z.string(),
            division: z.string(),
            role: z.string(),
            start_year: z.string().regex(/^\d{4}$/, "Invalid start year"),
            end_year: z.string().regex(/^(\d{4}|Present)$/, "Invalid end year")
        })).min(1, "At least one sport is required"),
        high_level: z.boolean().nullable(),
        high_level_sports: z.string().optional(),
        high_level_details: z.string().optional(),
    }),
    academic: z.object({
        year: z.string().min(1),
        majors: z.string().min(1),
        minors: z.string().optional(),
        grad_year: z.string().min(1),
        gpa: z.string().optional(),
        citizenship: z.string().min(1),
        work_auth: z.string().min(1),
        international_interest: z.boolean(),
        target_countries: z.string().optional(),
    }),
    career: z.object({
        goals: z.array(z.string()).min(1),
        sectors: z.array(z.string()).min(1),
        locations: z.string().optional(),
        hours: z.string().min(1),
        aspiration: z.string().min(10, "Please provide more detail about your aspirations"),
        scheduling: z.string().url().or(z.literal("")).optional(),
    }),
    verification: z.object({
        methods: z.array(z.string()).min(1),
        honesty_consent: z.literal(true),
    }).passthrough(), // Relaxed for the diverse verification fields
})

export async function submitOnboarding(rawData: OnboardingData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "You must be logged in to complete onboarding." }
    }

    // 1. Validate data
    const validation = OnboardingSchema.safeParse(rawData)
    if (!validation.success) {
        const firstError = validation.error.errors[0]
        return { error: `${firstError.path.join('.')}: ${firstError.message}` }
    }
    const data = validation.data

    try {
        // 2. Update Profile & Athletic & Academic info in athlete_profiles
        const { error: profileError } = await supabase
            .from('athlete_profiles')
            .upsert({
                user_id: user.id,
                preferred_name: data.profile.preferred_name,
                country: data.profile.country,
                status: data.profile.status,
                linkedin_url: data.profile.linkedin,
                
                is_athlete: data.athletic.is_athlete,
                school: data.athletic.college,
                secondary_college: data.athletic.secondary_college,
                sports: data.athletic.sports,
                high_level: data.athletic.high_level,
                high_level_sports: data.athletic.high_level_sports,
                high_level_details: data.athletic.high_level_details,

                year: data.academic.year,
                majors: data.academic.majors,
                minors: data.academic.minors,
                grad_year: data.academic.grad_year,
                gpa: data.academic.gpa,
                citizenship: data.academic.citizenship,
                work_auth: data.academic.work_auth,
                international_interest: data.academic.international_interest,
                target_countries: data.academic.target_countries,

                career_goals: data.career.goals,
                career_sectors: data.career.sectors,
                locations: data.career.locations,
                hours: data.career.hours,
                aspiration: data.career.aspiration,
                scheduling_url: data.career.scheduling,

                verification_methods: data.verification.methods,
                proof_details: (rawData.verification as any), // Use raw for the flexible JSON mapping
                updated_at: new Date().toISOString()
            })

        if (profileError) {
            console.error("Profile update error:", profileError)
            return { error: `Failed to update profile: ${profileError.message}` }
        }

        // 3. Mark user as onboarded
        // Note: This requires an RLS policy on public.users allowing UPDATE for own user_id
        const { error: userError } = await supabase
            .from('users')
            .update({ 
                name: `${data.profile.first_name} ${data.profile.last_name}`.trim(),
                onboarded: true 
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
