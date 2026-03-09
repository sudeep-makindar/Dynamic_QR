-- 1. Create the `events` table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add an "event_id" to the existing "qr_tables" relation
-- First, we create a default legacy event to house any existing tables
INSERT INTO public.events (name, slug)
VALUES ('Default Event', 'default-event')
ON CONFLICT (slug) DO NOTHING;

-- Add the column
ALTER TABLE public.qr_tables 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Update any existing tables to point to the legacy event
UPDATE public.qr_tables 
SET event_id = (SELECT id FROM public.events WHERE slug = 'default-event')
WHERE event_id IS NULL;

-- Make the column required for future tables
ALTER TABLE public.qr_tables 
ALTER COLUMN event_id SET NOT NULL;

-- 3. Create the Postgres RPC Function for Atomic Event Creation
-- This solves the "Dirty Transaction" bug referenced in the audit!
CREATE OR REPLACE FUNCTION public.create_event_with_tables(
    p_name TEXT,
    p_slug TEXT,
    p_table_count INT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_event_record RECORD;
BEGIN
    -- Insert the event
    INSERT INTO public.events (name, slug)
    VALUES (p_name, p_slug)
    RETURNING id, name, slug, created_at INTO v_event_record;
    
    v_event_id := v_event_record.id;

    -- Insert the generated tables
    FOR i IN 1..p_table_count LOOP
        INSERT INTO public.qr_tables (event_id, table_number, label)
        VALUES (v_event_id, i, 'Table ' || i);
    END LOOP;

    -- Return the newly created event object to the API
    RETURN row_to_json(v_event_record);
END;
$$;
