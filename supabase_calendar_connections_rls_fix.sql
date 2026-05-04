-- Fix RLS for calendar_connections to support UPSERT reliably.
-- Splits the previous FOR ALL policy into explicit per-action policies.
-- Idempotent: safe to re-run.

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can view their own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "cc_select_own" ON public.calendar_connections;
DROP POLICY IF EXISTS "cc_insert_own" ON public.calendar_connections;
DROP POLICY IF EXISTS "cc_update_own" ON public.calendar_connections;
DROP POLICY IF EXISTS "cc_delete_own" ON public.calendar_connections;

CREATE POLICY "cc_select_own" ON public.calendar_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cc_insert_own" ON public.calendar_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cc_update_own" ON public.calendar_connections
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cc_delete_own" ON public.calendar_connections
    FOR DELETE USING (auth.uid() = user_id);
