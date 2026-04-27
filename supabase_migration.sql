-- ============================================
-- RELAY: Add Missing Columns to athlete_profiles
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- These are all safe ADD COLUMN IF NOT EXISTS statements
-- ============================================

-- Step 1: Basic Profile columns
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United States';
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS theme_gradient TEXT;

-- Step 2: Athletic Background columns
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS is_athlete BOOLEAN DEFAULT TRUE;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS secondary_college TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS sports JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS high_level BOOLEAN;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS high_level_sports TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS high_level_details TEXT;

-- Step 3: Academic Details columns
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS majors TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS minors TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS grad_year TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS gpa TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS citizenship TEXT DEFAULT 'United States';
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS work_auth TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS international_interest BOOLEAN DEFAULT FALSE;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS target_countries TEXT;

-- Step 4: Career Interests columns (THIS IS THE ONE CAUSING THE CURRENT ERROR)
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS career_goals TEXT[] DEFAULT '{}';
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS career_sectors TEXT[] DEFAULT '{}';
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS locations TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS hours TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS aspiration TEXT;

-- Step 5: Verification columns
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS verification_methods TEXT[] DEFAULT '{}';
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS scheduling_url TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS proof_details JSONB DEFAULT '{}'::jsonb;

-- Timestamps
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
