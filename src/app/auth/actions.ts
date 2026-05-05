'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

    // Enforce .edu email requirement
    const emailDomain = email.toLowerCase().trim()
    if (!emailDomain.endsWith('.edu')) {
        return redirect('/signup?error=' + encodeURIComponent('Please use your .edu email address. Relay requires a valid university email for verification.'))
    }

    // Get the origin for the email redirect URL
    const origin = process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost') 
        ? process.env.NEXT_PUBLIC_SITE_URL 
        : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                role,
                sport,
                school,
            },
            emailRedirectTo: `${origin}/auth/callback`,
            captchaToken: isDev && captchaToken === 'dev-mock-token' ? undefined : (captchaToken as string),
        }
    })

    if (signUpError) {
        console.error('Sign up error:', signUpError.message, signUpError.status)
        return redirect(`/signup?error=${encodeURIComponent(signUpError.message)}`)
    }

    // Option 1: Send a custom verification email via Resend
    // This assumes Supabase is configured to NOT send the default confirmation email,
    // or you are using Resend as a custom SMTP provider in Supabase.
    // We will attempt to send one explicitly if an API key is present.
    if (process.env.RESEND_API_KEY) {
        try {
            // Send a welcome email via Resend
            await resend.emails.send({
                from: 'onboarding@resend.dev', // We will use Resend's testing domain for now
                to: email,
                subject: 'Welcome to Relay!',
                html: '<p>Thanks for joining the team!</p>'
            });
        } catch (e) {
            console.error('Error with Resend integration:', e);
        }
    }

    // Redirect to check-email page instead of login
    redirect('/signup/check-email')
}
