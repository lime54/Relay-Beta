-- ============================================================================
-- RELAY: Archive / delete sent requests
--
-- 1. Adds `archived_at` to `requests` so the sender can hide their own sent
--    request from the default list without losing it.
-- 2. Adds an UPDATE policy that lets the sender (requester) update *their own*
--    request rows. Without this, the archive write is silently filtered to
--    zero rows by RLS — local state clears, but on refresh the row reappears.
-- 3. Adds a DELETE policy that lets the sender hard-delete their own request.
--
-- Safe to run repeatedly.
-- ============================================================================

ALTER TABLE public.requests
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_requests_sender_unarchived
    ON public.requests(requester_id)
    WHERE archived_at IS NULL;

-- requests: sender can update their own request rows (used to set archived_at).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'requests'
          AND policyname = 'Sender can update own request'
    ) THEN
        CREATE POLICY "Sender can update own request"
            ON public.requests
            FOR UPDATE
            USING (auth.uid() = requester_id)
            WITH CHECK (auth.uid() = requester_id);
    END IF;
END $$;

-- requests: sender can delete their own request row.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'requests'
          AND policyname = 'Sender can delete own request'
    ) THEN
        CREATE POLICY "Sender can delete own request"
            ON public.requests
            FOR DELETE
            USING (auth.uid() = requester_id);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
