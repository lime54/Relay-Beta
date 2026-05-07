import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(request: Request) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createAdminClient()

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.supabase_user_id
                const subscriptionId = session.subscription as string

                if (!userId || !subscriptionId) break

                // Fetch full subscription details
                const subscription = await stripe.subscriptions.retrieve(subscriptionId)
                const priceId = subscription.items.data[0]?.price.id
                const plan = priceId === process.env.STRIPE_PRICE_ID_YEARLY ? 'yearly' : 'monthly'

                // Ensure stripe_customer_id is saved
                await supabase
                    .from('users')
                    .update({ stripe_customer_id: session.customer as string })
                    .eq('id', userId)

                // Upsert subscription record
                await supabase
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        stripe_subscription_id: subscriptionId,
                        stripe_price_id: priceId,
                        status: subscription.status,
                        plan,
                        current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'stripe_subscription_id' })

                break
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice
                const subscriptionId = invoice.subscription as string

                if (!subscriptionId) break

                const subscription = await stripe.subscriptions.retrieve(subscriptionId)

                await supabase
                    .from('subscriptions')
                    .update({
                        status: subscription.status,
                        current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_subscription_id', subscriptionId)

                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                const priceId = subscription.items.data[0]?.price.id
                const plan = priceId === process.env.STRIPE_PRICE_ID_YEARLY ? 'yearly' : 'monthly'

                await supabase
                    .from('subscriptions')
                    .update({
                        status: subscription.status,
                        stripe_price_id: priceId,
                        plan,
                        current_period_start: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_subscription_id', subscription.id)

                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription

                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'canceled',
                        cancel_at_period_end: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_subscription_id', subscription.id)

                break
            }
        }
    } catch (err) {
        console.error(`[Stripe Webhook] Error handling ${event.type}:`, err)
        // Still return 200 to prevent Stripe retries on processing errors
    }

    return NextResponse.json({ received: true })
}
