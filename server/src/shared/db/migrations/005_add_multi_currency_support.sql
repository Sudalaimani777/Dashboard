-- server/src/shared/db/migrations/005_add_multi_currency_support.sql

-- 1. Upgrade travel_expenses table with multi-currency tracking
ALTER TABLE travel_expenses
  ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12, 6) NOT NULL DEFAULT 1.000000,
  ADD COLUMN IF NOT EXISTS inr_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- Backfill existing records to maintain historical integrity
UPDATE travel_expenses
SET original_currency = 'INR',
    original_amount = amount,
    exchange_rate = 1.000000,
    inr_amount = amount
WHERE original_amount = 0.00 AND amount > 0;

-- 2. Create exchange_rates persistent caching table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  rate_date DATE NOT NULL,
  rate NUMERIC(12, 6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_exchange_rate_date UNIQUE (from_currency, to_currency, rate_date)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup 
  ON exchange_rates(from_currency, to_currency, rate_date);
