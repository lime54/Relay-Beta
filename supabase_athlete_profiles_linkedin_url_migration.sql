-- ============================================
-- RELAY: Add linkedin_url column to athlete_profiles
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- Safe to run multiple times (idempotent).
-- ============================================

ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Notify PostgREST to reload the schema cache so the new column is visible immediately
NOTIFY pgrst, 'reload schema';
