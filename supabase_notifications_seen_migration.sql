-- Migration: add seen_at to requests so we can clear the "incoming requests"
-- badge once the recipient has actually viewed the requests inbox without
-- forcing a status change (pending stays pending until accepted/declined).
--
-- Safe to run repeatedly.

ALTER TABLE public.requests
    ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_requests_recipient_unseen
    ON public.requests(recipient_id)
    WHERE status = 'pending' AND seen_at IS NULL;
