-- Migration 004: Add is_active column to users table for deactivation and governance lifecycle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
