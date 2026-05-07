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

        const { plan } = await request.json() as { plan: 'monthly' | 'yearly' }

        const priceId = plan === 'yearly'
            ? process.env.STRIPE_PRICE_ID_YEARLY!
            : process.env.STRIPE_PRICE_ID_MONTHLY!

        if (!priceId) {
            return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 })
        }

        // Look up or create Stripe customer
        const { data: userData } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        let customerId = userData?.stripe_customer_id

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id },
            })
            customerId = customer.id

            // Save customer ID — use service role if RLS blocks this
            await supabase
                .from('users')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id)
        }

        // Create checkout session
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pro`,
            subscription_data: {
                metadata: { supabase_user_id: user.id },
            },
            metadata: { supabase_user_id: user.id },
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        console.error('[Stripe Checkout]', err)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
