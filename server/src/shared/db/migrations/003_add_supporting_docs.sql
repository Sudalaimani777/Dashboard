-- Migration 003: Add supporting_docs JSONB column for multi-proof support in travel requests

DO $$ 
BEGIN
    -- 1. Add supporting_docs JSONB column if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'travel_requests' 
          AND column_name = 'supporting_docs'
    ) THEN
        ALTER TABLE travel_requests 
        ADD COLUMN supporting_docs JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;

    -- 2. Backfill existing rows that have a supporting_doc_url but empty supporting_docs
    UPDATE travel_requests
    SET supporting_docs = jsonb_build_array(
        jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'LINK',
            'name', 'Primary Itinerary / Quotation Proof',
            'url', supporting_doc_url,
            'uploadedAt', created_at
        )
    )
    WHERE supporting_doc_url IS NOT NULL 
      AND TRIM(supporting_doc_url) <> '' 
      AND (supporting_docs IS NULL OR jsonb_array_length(supporting_docs) = 0);

END $$;

-- 3. Create GIN index for efficient JSON querying
CREATE INDEX IF NOT EXISTS idx_travel_requests_supporting_docs ON travel_requests USING GIN (supporting_docs);
