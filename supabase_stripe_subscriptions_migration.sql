-- Migration: Add Stripe subscription support
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add Stripe customer ID to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_subscription_id text NOT NULL UNIQUE,
    stripe_price_id text,
    status text NOT NULL DEFAULT 'incomplete',
    plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON public.subscriptions(stripe_subscription_id);

-- RLS: users can only read their own subscription
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role (admin) can do everything — no policy needed, service role bypasses RLS
