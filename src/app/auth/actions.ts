'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in a real app, you might want to validate this with Zod
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const captchaToken = formData.get('captchaToken') as string

    if (!captchaToken) {
        return redirect('/login?error=Please complete the captcha')
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
            captchaToken,
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

    if (!captchaToken) {
        return redirect('/signup?error=Please complete the captcha')
    }

    // Get the origin for the email redirect URL
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error: signUpError } = await supabase.auth.signUp({
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
            captchaToken,
        }
    })

    if (signUpError) {
        console.error('Sign up error:', signUpError.message, signUpError.status)
        return redirect(`/signup?error=${encodeURIComponent(signUpError.message)}`)
    }

    console.log('Sign up successful for:', email)

    // Redirect to check-email page instead of login
    redirect('/signup/check-email')
}
