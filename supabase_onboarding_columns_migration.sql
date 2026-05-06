-- Migration: Add missing columns for the streamlined onboarding flow
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS grad_year TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS career_sectors TEXT[] DEFAULT '{}';
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS aspiration TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE public.athlete_profiles ADD COLUMN IF NOT EXISTS status TEXT;
