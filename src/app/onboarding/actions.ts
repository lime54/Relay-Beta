'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { OnboardingData } from "./onboarding-form"

export async function submitOnboarding(data: OnboardingData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "You must be logged in to complete onboarding." }
    }

    try {
        // 1. Update Profile & Athletic & Academic info in athlete_profiles
        // We use upsert because the profile might not exist yet if it's a new sign up
        // that didn't trigger a trigger (or if triggers aren't set up yet)
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

                verification_methods: data.verification.methods,
                proof_details: {
                    edu_email: data.verification.edu_email,
                    roster_link: data.verification.roster_link,
                    roster_name: data.verification.roster_name,
                    legacy_roster_link: data.verification.legacy_roster_link,
                    legacy_seasons: data.verification.legacy_seasons,
                    proof_description: data.verification.proof_description,
                    vouch_name: data.verification.vouch_name,
                    vouch_role: data.verification.vouch_role,
                    vouch_school: data.verification.vouch_school,
                    vouch_email: data.verification.vouch_email,
                    missed_time: data.verification.missed_time
                },
                updated_at: new Date().toISOString()
            })

        if (profileError) {
            console.error("Profile update error:", profileError)
            return { error: `Failed to update profile: ${profileError.message}` }
        }

        // 2. Mark user as onboarded
        const { error: userError } = await supabase
            .from('users')
            .update({ 
                name: `${data.profile.first_name} ${data.profile.last_name}`.trim(),
                onboarded: true 
            })
            .eq('id', user.id)

        if (userError) {
            console.error("User update error:", userError)
            // Even if message fails, the profile is saved. But we want to know.
            return { error: `Failed to update user status: ${userError.message}` }
        }

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (err) {
        console.error("Unexpected onboarding error:", err)
        return { error: "An unexpected error occurred during onboarding." }
    }
}
