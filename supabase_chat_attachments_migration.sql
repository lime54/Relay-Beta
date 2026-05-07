-- Chat attachments & read receipts migration
-- Run this in Supabase SQL Editor

-- 1. Add attachment columns to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 2. Enable full replica identity so realtime UPDATE payloads include all columns
--    (needed for read receipt updates to propagate to the sender in real time)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 3. Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

-- 5. Public read for chat attachments
CREATE POLICY "Public read chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');
