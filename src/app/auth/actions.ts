'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email')
    const password = formData.get('password')
    const captchaToken = formData.get('captchaToken')
    const isDev = process.env.NODE_ENV === 'development'

    if (typeof email !== 'string' || !email.trim()) {
        return redirect('/login?error=Email is required')
    }
    if (typeof password !== 'string' || !password) {
        return redirect('/login?error=Password is required')
    }
    if (!captchaToken && !isDev) {
        return redirect('/login?error=Please complete the captcha')
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: {
            captchaToken: isDev && captchaToken === 'dev-mock-token' ? undefined : (captchaToken as string),
        },
    })

    if (error) {
        return redirect('/login?error=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/network')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email')
    const password = formData.get('password')
    const name = formData.get('name')
    const role = formData.get('role') as 'student' | 'alum' | null
    const sport = formData.get('sport')
    const school = formData.get('school')
    const captchaToken = formData.get('captchaToken')
    const isDev = process.env.NODE_ENV === 'development'

    if (typeof email !== 'string' || !email.trim()) {
        return redirect('/signup?error=Email is required')
    }
    if (typeof password !== 'string' || !password) {
        return redirect('/signup?error=Password is required')
    }
    if (typeof name !== 'string' || !name.trim()) {
        return redirect('/signup?error=Name is required')
    }
    if (!captchaToken && !isDev) {
        return redirect('/signup?error=Please complete the captcha')
    }

    // Enforce .edu email requirement for current student-athletes only
    const emailDomain = email.toLowerCase().trim()
    if (role !== 'alum' && !emailDomain.endsWith('.edu')) {
        return redirect('/signup?error=' + encodeURIComponent('Please use your .edu email address. Relay requires a valid university email for verification.'))
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL
    const origin = siteUrl ? siteUrl.replace(/\/$/, '') : 'http://localhost:3000'

    // Use admin.generateLink to create the user AND get the verification link in one call.
    // This avoids the silent "user exists" success that supabase.auth.signUp returns
    // (anti-enumeration feature) which would otherwise hide failures.
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured — cannot send verification email')
        return redirect(`/signup?error=${encodeURIComponent('Email service not configured. Please contact support.')}`)
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
        return redirect(`/signup?error=${encodeURIComponent('Server not configured. Please contact support.')}`)
    }

    const adminClient = createAdminClient()

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'signup',
        email: email.trim(),
        password,
        options: {
            redirectTo: `${origin}/auth/callback`,
            data: { name, role, sport, school },
        }
    })

    if (linkError || !linkData?.properties?.action_link) {
        const msg = linkError?.message ?? 'Unknown error'
        console.error('Failed to generate verification link:', msg)

        // Detect "already registered" case and route the user to login
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered') || msg.toLowerCase().includes('exists')) {
            return redirect(`/login?error=${encodeURIComponent('This email is already registered. Please sign in.')}`)
        }
        return redirect(`/signup?error=${encodeURIComponent(msg)}`)
    }

    // Send the verification email via Resend
    const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    const firstName = typeof name === 'string' ? name.split(' ')[0] : 'there'

    const { error: emailError } = await resend.emails.send({
        from,
        to: email.trim(),
        subject: 'Confirm your Relay account',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
                <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to Relay, ${firstName}!</h1>
                <p style="font-size: 16px; line-height: 1.5; color: #4a4a4a;">Thanks for signing up. Click the button below to confirm your email and finish creating your account.</p>
                <p style="margin: 32px 0;">
                    <a href="${linkData.properties.action_link}" style="background:#000;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Confirm your account</a>
                </p>
                <p style="font-size: 14px; color: #6a6a6a;">If the button doesn't work, copy and paste this link into your browser:<br/>
                    <a href="${linkData.properties.action_link}" style="color:#0066cc;word-break:break-all;">${linkData.properties.action_link}</a>
                </p>
                <p style="font-size: 13px; color: #9a9a9a; margin-top: 32px;">If you didn't sign up for Relay, you can safely ignore this email.</p>
            </div>
        `
    })

    if (emailError) {
        console.error('Resend send error:', emailError)
        return redirect(`/signup?error=${encodeURIComponent('Could not send verification email. Please try again.')}`)
    }

    redirect('/signup/check-email')
}
