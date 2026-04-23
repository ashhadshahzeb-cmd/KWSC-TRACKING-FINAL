-- ============================================================
-- Sequential CFO Diary Number & Optional Receiving Number
-- ============================================================

-- 1. Create Sequence for Diary Number
CREATE SEQUENCE IF NOT EXISTS public.cfo_diary_seq START 1;

-- 2. Function to generate the sequential number
CREATE OR REPLACE FUNCTION public.generate_cfo_diary_number()
RETURNS TEXT AS $$
DECLARE
    seq_val INT;
    year_val TEXT;
BEGIN
    seq_val := nextval('public.cfo_diary_seq');
    year_val := to_char(now(), 'YYYY');
    RETURN 'CFO-' || year_val || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure Table exists
CREATE TABLE IF NOT EXISTS public.file_tracking_records (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at       TIMESTAMPTZ DEFAULT now(),
    tracking_id      TEXT UNIQUE NOT NULL,
    cfo_diary_number TEXT,
    inward_date      DATE,
    received_from    TEXT,
    receiving_number TEXT,
    main_category    TEXT,
    sub_category     TEXT,
    subject          TEXT,
    date_of_sign     DATE,
    signature_data   TEXT,
    mark_to          TEXT,
    outward_date     DATE,
    remarks          TEXT,
    history          JSONB DEFAULT '[]'::jsonb,
    processed_by     TEXT
);

-- 4. Trigger Function to ensure cfo_diary_number is set on INSERT
CREATE OR REPLACE FUNCTION public.trg_set_cfo_diary_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if it's null or contains 'XXXX' (our frontend placeholder)
    IF NEW.cfo_diary_number IS NULL OR NEW.cfo_diary_number = '' OR NEW.cfo_diary_number LIKE '%XXXX' THEN
        NEW.cfo_diary_number := public.generate_cfo_diary_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach Trigger
DROP TRIGGER IF EXISTS ensure_cfo_diary_number ON public.file_tracking_records;
CREATE TRIGGER ensure_cfo_diary_number
BEFORE INSERT ON public.file_tracking_records
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_cfo_diary_number();

-- 6. RPC Function to fetch the next sequential number (for UI preview)
-- Note: This is an estimation. The trigger will handle the actual unique assignment.
CREATE OR REPLACE FUNCTION public.get_next_cfo_diary_number()
RETURNS TEXT AS $$
DECLARE
    seq_val INT;
    year_val TEXT;
BEGIN
    SELECT COALESCE(last_value, 0) + (CASE WHEN is_called THEN 1 ELSE 1 END) INTO seq_val 
    FROM public.cfo_diary_seq;
    
    year_val := to_char(now(), 'YYYY');
    RETURN 'CFO-' || year_val || '-' || LPAD(seq_val::TEXT, 4, '0');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'CFO-' || to_char(now(), 'YYYY') || '-XXXX';
END;
$$ LANGUAGE plpgsql;

-- 7. Grant permissions (Required for RPC and Trigger)
GRANT USAGE ON SEQUENCE public.cfo_diary_seq TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.file_tracking_records TO authenticated, anon, service_role;
