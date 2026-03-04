import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Get the authenticated user and their metadata
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const metadata = user.user_metadata || {}
                const sport = metadata.sport
                const school = metadata.school

                // Create athlete_profiles row if sport and school are provided
                if (sport && school) {
                    await supabase.from('athlete_profiles').upsert({
                        user_id: user.id,
                        sport,
                        school,
                    }, { onConflict: 'user_id' })
                }
            }

            // Redirect to the confirmed page first, then they can proceed
            return NextResponse.redirect(`${origin}/signup/confirmed`)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Could not verify email. Please try again.`)
}
