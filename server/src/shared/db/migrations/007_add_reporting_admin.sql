-- Migration 007: Add reporting_admin_id to users table for Manager -> Admin hierarchy
-- Managers can have a designated Reporting Admin who reviews their personal travel
-- requests and receives auto-routed employee trip escalations.

DO $$ 
BEGIN
    -- 1. Add reporting_admin_id column referencing users(id)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reporting_admin_id UUID REFERENCES users(id) ON DELETE SET NULL;

    -- 2. Index for fast hierarchy lookups
    CREATE INDEX IF NOT EXISTS idx_users_reporting_admin ON users(reporting_admin_id);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
