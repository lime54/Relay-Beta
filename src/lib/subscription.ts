import { createClient } from '@/lib/supabase/server'

export type Subscription = {
    id: string
    user_id: string
    stripe_subscription_id: string
    stripe_price_id: string | null
    status: string
    plan: string
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    created_at: string
    updated_at: string
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('current_period_end', { ascending: false })
        .limit(1)
        .single()

    return data as Subscription | null
}

export async function isUserPro(userId: string): Promise<boolean> {
    const sub = await getUserSubscription(userId)
    return !!sub
}
