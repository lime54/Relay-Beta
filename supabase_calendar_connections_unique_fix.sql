-- ============================================================================
-- Migration: ensure calendar_connections has the UNIQUE constraint required
-- by the OAuth-callback UPSERT.
--
-- Problem
--   The callback in src/app/api/calendar/callback/route.ts performs:
--     .upsert({...}, { onConflict: 'user_id,provider,provider_account_id' })
--   which requires a real UNIQUE / PRIMARY KEY constraint on exactly those
--   three columns. The original `supabase_scheduling_migration.sql` declares
--   that constraint inline on CREATE TABLE — but `CREATE TABLE IF NOT EXISTS`
--   is a no-op when the table already exists, so databases that pre-date
--   that migration (or were created from `supabase_schema.sql` first) end up
--   with the table but no constraint. Postgres then fails the upsert with:
--     "there is no unique or exclusion constraint matching the ON CONFLICT
--      specification".
--
-- Fix
--   Add the constraint idempotently. Uses a DO block so it works on
--   Postgres < 15 (where ADD CONSTRAINT IF NOT EXISTS is unsupported).
--
-- Cleanup of stale rows (run BEFORE this migration if needed):
--   If previous failed connection attempts left half-written rows that
--   would now violate the new UNIQUE, delete them first:
--     DELETE FROM public.calendar_connections WHERE access_token IS NULL;
--
-- Safe to run repeatedly.
-- ============================================================================

-- 1. Drop any duplicate rows that would block the constraint creation.
--    Keeps the most recently updated row per (user_id, provider, provider_account_id).
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, provider, provider_account_id
            ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        ) AS rn
    FROM public.calendar_connections
)
DELETE FROM public.calendar_connections
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Add the UNIQUE constraint if it isn't already present.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'calendar_connections'
          AND c.contype = 'u'
          AND (
              SELECT array_agg(attname ORDER BY attname)
              FROM pg_attribute
              WHERE attrelid = c.conrelid
                AND attnum = ANY(c.conkey)
          ) = ARRAY['provider', 'provider_account_id', 'user_id']
    ) THEN
        ALTER TABLE public.calendar_connections
            ADD CONSTRAINT calendar_connections_user_provider_account_uniq
            UNIQUE (user_id, provider, provider_account_id);
    END IF;
END $$;
