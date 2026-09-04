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
        subject: `You're almost in, ${firstName} — confirm your Relay account`,
        html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;margin:0;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e6eaf2;">
                <!-- Brand header -->
                <tr>
                  <td style="background:#ffffff;padding:26px 32px 22px;border-bottom:1px solid #eef1f7;" align="left">
                    <img src="https://relaynetwork.co/relay-logo.png" alt="Relay" height="30" style="height:30px;width:auto;display:block;" />
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:36px 32px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <h1 style="font-size:23px;line-height:1.25;margin:0 0 14px;color:#10193f;">Welcome to Relay, ${firstName} 👋</h1>
                    <p style="font-size:16px;line-height:1.55;color:#48506a;margin:0 0 8px;">
                      You're one click away from joining a private network of student-athletes and alumni who get where you're coming from. Confirm your email to finish setting up your account.
                    </p>
                  </td>
                </tr>
                <!-- Button -->
                <tr>
                  <td style="padding:20px 32px 8px;" align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:12px;background:#2a5fd0;">
                          <a href="${linkData.properties.action_link}" style="display:inline-block;padding:15px 34px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
                            Confirm my account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Fallback link -->
                <tr>
                  <td style="padding:18px 32px 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <p style="font-size:13px;line-height:1.5;color:#8a90a6;margin:0;">
                      Button not working? Paste this link into your browser:<br/>
                      <a href="${linkData.properties.action_link}" style="color:#2a5fd0;word-break:break-all;">${linkData.properties.action_link}</a>
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:24px 32px 30px;border-top:1px solid #eef1f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <p style="font-size:12px;line-height:1.5;color:#a4a9bd;margin:0 0 4px;">Built for athletes, by athletes.</p>
                    <p style="font-size:12px;line-height:1.5;color:#a4a9bd;margin:0;">If you didn't sign up for Relay, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        `
    })

    if (emailError) {
        console.error('Resend send error:', emailError)
        return redirect(`/signup?error=${encodeURIComponent('Could not send verification email. Please try again.')}`)
    }

    redirect('/signup/check-email')
}
