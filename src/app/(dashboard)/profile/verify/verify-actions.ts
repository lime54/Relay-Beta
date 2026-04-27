'use server'

import { createClient } from "@/lib/supabase/server"
import { verifyRoster, isEduEmail, getVerificationTier } from "@/lib/verification"

export interface VerificationResult {
    success: boolean
    tier: string
    eduVerified: boolean
    rosterVerified: boolean
    rosterDetails: string | null
    matchedName: string | null
}

/**
 * Automated verification pipeline.
 * Called after onboarding or when a user manually requests verification.
 * 
 * Steps:
 * 1. Check if signup email is .edu → email_verified
 * 2. If roster URL provided, scrape and fuzzy-match → roster_verified
 * 3. Both = fully_verified
 */
export async function runVerification(
    rosterUrl?: string,
    legacyRosterUrl?: string
): Promise<VerificationResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            success: false,
            tier: 'unverified',
            eduVerified: false,
            rosterVerified: false,
            rosterDetails: 'Not authenticated',
            matchedName: null
        }
    }

    const userName = user.user_metadata?.name || ''
    const userEmail = user.email || ''

    // Step 1: .edu email check
    const eduVerified = isEduEmail(userEmail)

    // Step 2: Roster check (try primary URL first, then legacy)
    let rosterVerified = false
    let rosterDetails: string | null = null
    let matchedName: string | null = null

    const urlToCheck = rosterUrl || legacyRosterUrl
    if (urlToCheck && userName) {
        const result = await verifyRoster(userName, urlToCheck)
        rosterVerified = result.verified
        rosterDetails = result.details
        matchedName = result.matchedName

        // If primary URL failed, try legacy URL
        if (!rosterVerified && legacyRosterUrl && legacyRosterUrl !== urlToCheck) {
            const legacyResult = await verifyRoster(userName, legacyRosterUrl)
            if (legacyResult.verified) {
                rosterVerified = true
                rosterDetails = legacyResult.details
                matchedName = legacyResult.matchedName
            }
        }
    }

    // Determine tier
    const tier = getVerificationTier({
        eduEmailVerified: eduVerified,
        rosterVerified: rosterVerified,
    })

    // Update the athlete_profiles table with verification results
    const isVerified = tier === 'fully_verified' || tier === 'roster_verified'

    const { error } = await supabase
        .from('athlete_profiles')
        .update({
            verification_status: isVerified,
            proof_details: {
                edu_verified: eduVerified,
                roster_verified: rosterVerified,
                roster_matched_name: matchedName,
                roster_url_checked: urlToCheck,
                roster_details: rosterDetails,
                verification_tier: tier,
                verified_at: isVerified ? new Date().toISOString() : null,
                auto_verified: true,
            },
        })
        .eq('user_id', user.id)

    if (error) {
        console.error('[Verification] Error updating profile:', error)
    }

    return {
        success: true,
        tier,
        eduVerified,
        rosterVerified,
        rosterDetails,
        matchedName
    }
}
