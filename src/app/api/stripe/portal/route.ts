import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { data: userData } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        if (!userData?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No subscription found' },
                { status: 400 }
            )
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

        const session = await stripe.billingPortal.sessions.create({
            customer: userData.stripe_customer_id,
            return_url: `${origin}/dashboard`,
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        console.error('[Stripe Portal]', err)
        return NextResponse.json(
            { error: 'Failed to create portal session' },
            { status: 500 }
        )
    }
}
