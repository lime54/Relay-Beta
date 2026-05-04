-- ============================================================================
-- Migration: notification badge clearing
--
-- 1. Adds `seen_at` to `requests` so the "incoming requests" badge can clear
--    without flipping the request out of `pending`.
-- 2. Ensures both `requests` and `messages` have UPDATE policies that let the
--    recipient mark their own rows as seen / read. Without these, our UPDATE
--    statements are silently filtered to zero rows by RLS — local state
--    clears, but on refresh the badge comes back.
--
-- Safe to run repeatedly.
-- ============================================================================

ALTER TABLE public.requests
    ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_requests_recipient_unseen
    ON public.requests(recipient_id)
    WHERE status = 'pending' AND seen_at IS NULL;

-- requests: recipient can mark their own incoming requests as seen.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'requests'
          AND policyname = 'Recipient can mark request seen'
    ) THEN
        CREATE POLICY "Recipient can mark request seen"
            ON public.requests
            FOR UPDATE
            USING (auth.uid() = recipient_id)
            WITH CHECK (auth.uid() = recipient_id);
    END IF;
END $$;

-- messages: receiver can mark their own messages as read.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'messages'
          AND policyname = 'Receiver can mark message read'
    ) THEN
        CREATE POLICY "Receiver can mark message read"
            ON public.messages
            FOR UPDATE
            USING (auth.uid() = receiver_id)
            WITH CHECK (auth.uid() = receiver_id);
    END IF;
END $$;
