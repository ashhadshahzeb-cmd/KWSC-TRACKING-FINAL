-- ============================================================
-- Allow Public Read Access for File Tracking (for QR scanning)
-- ============================================================

-- Enable RLS if not already enabled
ALTER TABLE public.file_tracking_records ENABLE ROW LEVEL SECURITY;

-- Drop existing read policies to avoid duplicates
DROP POLICY IF EXISTS "Public can read file_tracking_records" ON public.file_tracking_records;
DROP POLICY IF EXISTS "Anyone can read file_tracking_records" ON public.file_tracking_records;
DROP POLICY IF EXISTS "Authenticated users can read file_tracking_records" ON public.file_tracking_records;

-- 1. Policy for Public (Anonymous) Read Access
CREATE POLICY "Public can read file_tracking_records"
ON public.file_tracking_records
FOR SELECT
USING (true); -- Allows anyone to read if they have the ID

-- 2. Ensure authenticated users can still do everything
DROP POLICY IF EXISTS "Authenticated users can insert file_tracking_records" ON public.file_tracking_records;
CREATE POLICY "Authenticated users can insert file_tracking_records"
ON public.file_tracking_records
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update file_tracking_records" ON public.file_tracking_records;
CREATE POLICY "Authenticated users can update file_tracking_records"
ON public.file_tracking_records
FOR UPDATE
USING (auth.role() = 'authenticated');
