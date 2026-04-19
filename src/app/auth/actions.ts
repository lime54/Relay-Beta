'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in a real app, you might want to validate this with Zod
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const captchaToken = formData.get('captchaToken') as string
    const isDev = process.env.NODE_ENV === 'development'
    
    if (!captchaToken && !isDev) {
        return redirect('/login?error=Please complete the captcha')
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
            captchaToken: isDev && captchaToken === 'dev-mock-token' ? undefined : captchaToken,
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

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as 'student' | 'alum'
    const sport = formData.get('sport') as string
    const school = formData.get('school') as string
    const captchaToken = formData.get('captchaToken') as string
    const isDev = process.env.NODE_ENV === 'development'

    if (!captchaToken && !isDev) {
        return redirect('/signup?error=Please complete the captcha')
    }

    // Get the origin for the email redirect URL
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

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
            captchaToken: isDev && captchaToken === 'dev-mock-token' ? undefined : captchaToken,
        }
    })

    if (signUpError) {
        console.error('Sign up error:', signUpError.message, signUpError.status)
        return redirect(`/signup?error=${encodeURIComponent(signUpError.message)}`)
    }

    console.log('Sign up successful for:', email)

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
            console.log('Welcome email sent via Resend successfully.');
        } catch (e) {
            console.error('Error with Resend integration:', e);
        }
    }

    // Redirect to check-email page instead of login
    redirect('/signup/check-email')
}
