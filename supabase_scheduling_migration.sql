-- ============================================
-- RELAY: Scheduling / Calendar Booking Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- All statements are idempotent (safe to re-run).
-- ============================================

-- ----------------------------------------------------------------
-- 1. calendar_connections: stores OAuth tokens for external calendars
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL DEFAULT 'google',
    provider_account_id TEXT NOT NULL, -- e.g. the Google email
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_cal_conn_user ON public.calendar_connections(user_id);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own calendar connections" ON public.calendar_connections;
CREATE POLICY "Users can view their own calendar connections"
ON public.calendar_connections FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own calendar connections" ON public.calendar_connections;
CREATE POLICY "Users can manage their own calendar connections"
ON public.calendar_connections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 2. availability_rules: per-user weekly availability schedule
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.availability_rules (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    timezone TEXT DEFAULT 'America/New_York',
    meeting_duration_mins INT DEFAULT 30,
    buffer_before_mins INT DEFAULT 0,
    buffer_after_mins INT DEFAULT 0,
    -- schedule format: { "monday": [{"start": "09:00", "end": "17:00"}], ... }
    schedule JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can READ a user's availability (so the picker works)
DROP POLICY IF EXISTS "Anyone can view availability rules" ON public.availability_rules;
CREATE POLICY "Anyone can view availability rules"
ON public.availability_rules FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can manage their own availability rules" ON public.availability_rules;
CREATE POLICY "Users can manage their own availability rules"
ON public.availability_rules FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 3. bookings: confirmed meetings between two users
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED', -- PENDING | CONFIRMED | CANCELLED
    message TEXT,
    provider_event_id TEXT,
    meeting_link TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_requester ON public.bookings(requester_id);
CREATE INDEX IF NOT EXISTS idx_bookings_recipient ON public.bookings(recipient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON public.bookings(start_time);

-- Prevent the same recipient from being double-booked at the exact same moment
CREATE UNIQUE INDEX IF NOT EXISTS uniq_recipient_start
    ON public.bookings(recipient_id, start_time)
    WHERE status = 'CONFIRMED';

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their bookings" ON public.bookings;
CREATE POLICY "Participants can view their bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Only the requester can create a booking, and only as themselves
DROP POLICY IF EXISTS "Requester can create bookings" ON public.bookings;
CREATE POLICY "Requester can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Either party can update (e.g. to add a meeting link or cancel)
DROP POLICY IF EXISTS "Participants can update their bookings" ON public.bookings;
CREATE POLICY "Participants can update their bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
