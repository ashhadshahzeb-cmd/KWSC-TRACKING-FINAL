-- ============================================================
-- Real-time Notification System for File Tracking
-- ============================================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    recipient_role TEXT NOT NULL, -- The department/role receiving the file (e.g., 'cia', 'books')
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    file_id UUID REFERENCES public.file_tracking_records(id) ON DELETE CASCADE,
    diary_no TEXT,
    from_user TEXT -- The user/office who forwarded the file
);

-- 2. Trigger Function to auto-create notifications on file movement
CREATE OR REPLACE FUNCTION public.create_file_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
BEGIN
    -- Determine sender (simplified)
    sender_name := COALESCE(NEW.processed_by, 'Finance Department');

    -- Only create notification if mark_to is set and (it's a new record OR mark_to changed)
    IF (NEW.mark_to IS NOT NULL) AND (TG_OP = 'INSERT' OR NEW.mark_to IS DISTINCT FROM OLD.mark_to) THEN
        INSERT INTO public.notifications (
            recipient_role, 
            title, 
            message, 
            file_id, 
            diary_no, 
            from_user
        )
        VALUES (
            LOWER(NEW.mark_to), 
            'File Received: ' || COALESCE(NEW.cfo_diary_number, 'N/A'), 
            'Subject: ' || COALESCE(NEW.subject, 'No Subject'),
            NEW.id,
            NEW.cfo_diary_number,
            sender_name
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach Trigger to file_tracking_records
DROP TRIGGER IF EXISTS trg_file_notification ON public.file_tracking_records;
CREATE TRIGGER trg_file_notification
AFTER INSERT OR UPDATE ON public.file_tracking_records
FOR EACH ROW
EXECUTE FUNCTION public.create_file_notification();

-- 4. Enable RLS and grant permissions
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all" ON public.notifications;
CREATE POLICY "Enable read access for all" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable update access for all" ON public.notifications;
CREATE POLICY "Enable update access for all" ON public.notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable insert access for all" ON public.notifications;
CREATE POLICY "Enable insert access for all" ON public.notifications FOR INSERT WITH CHECK (true);

GRANT ALL ON public.notifications TO anon, authenticated, service_role;
