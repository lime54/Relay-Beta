'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { verifyRosterWithAI } from "@/lib/verification-ai"
import { resend } from "@/lib/resend"

export interface AiVerifyResponse {
    ok: boolean
    verified: boolean
    pendingReview: boolean
    message: string
}

// Auto-verify when the roster check is confident; otherwise flag for manual
// review and email the Relay team so they can verify by hand.
export async function runAiVerification(rosterUrlHint?: string): Promise<AiVerifyResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, verified: false, pendingReview: false, message: 'You must be signed in.' }

    // Pull the details we verify against.
    const { data: userRow } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .maybeSingle()

    const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('school, sport, status')
        .eq('user_id', user.id)
        .maybeSingle()

    const name = userRow?.name || user.user_metadata?.name || ''
    const email = userRow?.email || user.email || ''
    const school = profile?.school || ''
    const sport = profile?.sport || ''

    if (!name || !school || !sport) {
        return { ok: false, verified: false, pendingReview: false, message: 'Add your name, school, and sport to your profile first, then try again.' }
    }

    const result = await verifyRosterWithAI({
        name, school, sport,
        status: profile?.status,
        rosterUrlHint: rosterUrlHint?.trim() || null,
    })

    const autoVerified = result.status === 'verified' && result.confidence >= 0.6

    if (autoVerified) {
        await supabase.from('athlete_profiles').update({ verification_status: true }).eq('user_id', user.id)
        revalidatePath('/profile')
        return {
            ok: true,
            verified: true,
            pendingReview: false,
            message: "You're verified! We found you on your team's official roster.",
        }
    }

    // Not confident — record a pending request and notify the team.
    await supabase.from('verification_requests').insert({
        user_id: user.id,
        verification_type: 'ai_roster',
        uploaded_proof_url: result.sourceUrl || rosterUrlHint?.trim() || null,
        status: 'pending',
    })

    await notifyTeamForReview({
        name, email, school, sport,
        status: profile?.status || 'unknown',
        userId: user.id,
        aiStatus: result.status,
        confidence: result.confidence,
        sourceUrl: result.sourceUrl,
        reasoning: result.reasoning,
        rosterUrlHint: rosterUrlHint?.trim() || null,
    })

    return {
        ok: true,
        verified: false,
        pendingReview: true,
        message: "Thanks! We couldn't auto-confirm your roster spot, so a Relay teammate will verify you manually shortly.",
    }
}

async function notifyTeamForReview(info: {
    name: string; email: string; school: string; sport: string; status: string
    userId: string; aiStatus: string; confidence: number; sourceUrl: string | null
    reasoning: string; rosterUrlHint: string | null
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[verification] RESEND_API_KEY not set — skipping manual-review email')
        return
    }
    const to = (process.env.VERIFICATION_REVIEW_EMAILS || 'relaynetwork.co@gmail.com')
        .split(',').map(s => s.trim()).filter(Boolean)
    const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://relaynetwork.co'

    try {
        await resend.emails.send({
            from,
            to,
            subject: `Relay: manual verification needed — ${info.name} (${info.sport}, ${info.school})`,
            html: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
                    <h2 style="margin:0 0 12px;">Verification needs a human look</h2>
                    <p style="color:#4a4a4a;">The automated roster check wasn't confident enough to auto-verify this member. Please confirm manually.</p>
                    <table style="border-collapse:collapse;font-size:14px;margin:16px 0;">
                        <tr><td style="padding:4px 12px 4px 0;color:#6a6a6a;">Name</td><td><strong>${info.name}</strong></td></tr>
                        <tr><td style="padding:4px 12px 4px 0;color:#6a6a6a;">Email</td><td>${info.email}</td></tr>
                        <tr><td style="padding:4px 12px 4px 0;color:#6a6a6a;">School</td><td>${info.school}</td></tr>
                        <tr><td style="padding:4px 12px 4px 0;color:#6a6a6a;">Sport</td><td>${info.sport}</td></tr>
                        <tr><td style="padding:4px 12px 4px 0;color:#6a6a6a;">Status</td><td>${info.status}</td></tr>
                    </table>
                    <div style="background:#f6f7f9;border-radius:8px;padding:12px 16px;font-size:14px;">
                        <p style="margin:0 0 6px;"><strong>AI result:</strong> ${info.aiStatus} (confidence ${(info.confidence * 100).toFixed(0)}%)</p>
                        <p style="margin:0 0 6px;"><strong>Reasoning:</strong> ${info.reasoning || '—'}</p>
                        ${info.sourceUrl ? `<p style="margin:0 0 6px;"><strong>Source found:</strong> <a href="${info.sourceUrl}">${info.sourceUrl}</a></p>` : ''}
                        ${info.rosterUrlHint ? `<p style="margin:0;"><strong>Link they provided:</strong> <a href="${info.rosterUrlHint}">${info.rosterUrlHint}</a></p>` : ''}
                    </div>
                    <p style="margin:16px 0 0;"><a href="${appUrl}/profile/${info.userId}" style="color:#0066cc;">View their Relay profile →</a></p>
                </div>
            `,
        })
    } catch (err) {
        console.error('[verification] manual-review email failed', err)
    }
}
