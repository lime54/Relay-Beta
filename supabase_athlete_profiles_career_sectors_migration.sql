-- ============================================
-- RELAY: Add career_sectors (and related career columns) to athlete_profiles
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- Safe to run multiple times (idempotent).
-- ============================================

ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS career_sectors text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS career_goals text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS locations text,
  ADD COLUMN IF NOT EXISTS hours text,
  ADD COLUMN IF NOT EXISTS aspiration text;

-- Notify PostgREST to reload the schema cache so the new column is visible immediately
NOTIFY pgrst, 'reload schema';
