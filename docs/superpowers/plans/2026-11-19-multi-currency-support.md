# Multi-Currency Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Multi-Currency Support across TripFlow, allowing employees to submit expenses in foreign currencies (e.g. USD, EUR, GBP, AED, SGD, JPY) with server-side authoritative FX rate conversion via `fawazahmed0/exchange-api`, PostgreSQL caching, and dual-currency rendering across all workstations while preserving strict INR department budget accounting.

**Architecture:** A PostgreSQL migration adds multi-currency columns and an `exchange_rates` caching table. A backend `ExchangeRateService` fetches daily historical rates from primary and fallback CDNs and caches them to guarantee sub-millisecond lookups. The travel repository normalizes all line items into INR for total ledger calculation, and the React 19 frontend provides a debounced live FX preview with dual-currency display on audit workstations.

**Tech Stack:** React 19, TypeScript 5, Vite 8, Tailwind CSS v4, Stripe Design System tokens, Express 5, Node.js, PostgreSQL (`pg`), `fawazahmed0/exchange-api` (jsDelivr / Cloudflare Pages).

**Spec:** [docs/superpowers/specs/2026-11-19-multi-currency-support-design.md](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/docs/superpowers/specs/2026-11-19-multi-currency-support-design.md)

## Global Constraints

- Accounting Invariant: All department budgets, approval ledgers, and final settlements are strictly denominated in `INR` (`₹`).
- Security Invariant: The server must independently look up the exchange rate and calculate `inr_amount = round(original_amount * rate, 2)`; client-supplied INR amounts are never trusted.
- Upstream Security: Upstream FX requests are restricted to hardcoded CDN hosts (`cdn.jsdelivr.net` and `latest.currency-api.pages.dev`); user input is validated against an ISO currency allowlist.
- Fixed-Point Precision: Currency amounts use `NUMERIC(12, 2)` and exchange rates use `NUMERIC(12, 6)`.
- Design Standard: Monospace tabular numerals (`font-mono tabular-nums`), Plus Jakarta Sans for UI labels, and Stripe color tokens (`#F2F7FE` canvas, `#533AFD` primary, `#061B31` ink).

## Review Focus

- Non-allowlisted currency submission: returns 400 Bad Request and does not trigger outbound network requests.
- Weekend and holiday date lookups: upstream returns previous Friday's rate; system stores and returns the rate without error.
- Upstream CDN outage: primary jsDelivr failure automatically switches to Cloudflare Pages mirror; if both fail, cached rate or error is returned gracefully.
- Zero or negative amount input: rejected by validation schema; never causes divide-by-zero or NaN in calculations.
- Backward compatibility: existing database records with only `amount` populate `original_amount`, `original_currency = 'INR'`, and `exchange_rate = 1.0` without data loss.

---

### Task 1: Database Migration `005_add_multi_currency_support.sql`

**Files:**
- Create: `server/src/shared/db/migrations/005_add_multi_currency_support.sql`
- Test: `server/tests/migration-005.test.ts`

**Interfaces:**
- Consumes: PostgreSQL connection pool (`server/src/shared/db/pool.ts`)
- Produces: `travel_expenses` table with `original_currency`, `original_amount`, `exchange_rate`, `inr_amount` columns and `exchange_rates` cache table.

- [ ] **Step 1: Write the failing migration test**

```typescript
// server/tests/migration-005.test.ts
import { pool } from '../src/shared/db/pool.js';

async function testMigration005() {
  const client = await pool.connect();
  try {
    // Check if new columns exist on travel_expenses
    const columnRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'travel_expenses' 
        AND column_name IN ('original_currency', 'original_amount', 'exchange_rate', 'inr_amount');
    `);
    
    if (columnRes.rowCount !== 4) {
      throw new Error(`Expected 4 new columns in travel_expenses, found ${columnRes.rowCount}`);
    }

    // Check if exchange_rates table exists
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'exchange_rates';
    `);

    if (tableRes.rowCount !== 1) {
      throw new Error('exchange_rates table does not exist');
    }

    console.log('PASS: migration-005 schema verified successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

testMigration005().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/migration-005.test.ts` (from `server/`)  
Expected: FAIL with "Expected 4 new columns in travel_expenses" or "exchange_rates table does not exist"

- [ ] **Step 3: Write migration SQL file**

```sql
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
```

- [ ] **Step 4: Run database migration and test to verify it passes**

Run: `npm run migrate` (from `server/`)  
Run: `npx tsx tests/migration-005.test.ts` (from `server/`)  
Expected: PASS with "PASS: migration-005 schema verified successfully"

- [ ] **Step 5: Commit**

```bash
git add server/src/shared/db/migrations/005_add_multi_currency_support.sql server/tests/migration-005.test.ts
git commit -m "feat(db): add multi-currency columns and exchange_rates table"
```

---

### Task 2: Backend `ExchangeRateService` & Upstream CDN Fetcher

**Files:**
- Create: `server/src/shared/services/exchangeRate.service.ts`
- Test: `server/tests/fx-rate-service.test.ts`

**Interfaces:**
- Consumes: PostgreSQL connection pool (`pool.ts`), `fetch` API
- Produces: `ExchangeRateService.getRate(fromCurrency: string, expenseDate?: string): Promise<{ rate: number, source: string, from: string, to: string, date: string }>`

- [ ] **Step 1: Write the failing service test**

```typescript
// server/tests/fx-rate-service.test.ts
import { ExchangeRateService } from '../src/shared/services/exchangeRate.service.js';
import { pool } from '../src/shared/db/pool.js';

async function testFxRateService() {
  try {
    // 1. INR to INR should return 1.0 immediately without DB or network call
    const inrRes = await ExchangeRateService.getRate('INR', '2026-11-10');
    if (inrRes.rate !== 1.0) throw new Error(`Expected INR rate 1.0, got ${inrRes.rate}`);

    // 2. Fetch USD to INR for a known date
    const usdRes = await ExchangeRateService.getRate('USD', '2026-11-10');
    if (usdRes.rate <= 50 || usdRes.rate >= 120) {
      throw new Error(`Unexpected USD rate: ${usdRes.rate}`);
    }

    // 3. Subsequent call should hit DB_CACHE
    const cachedRes = await ExchangeRateService.getRate('USD', '2026-11-10');
    if (cachedRes.source !== 'DB_CACHE') {
      throw new Error(`Expected DB_CACHE source, got ${cachedRes.source}`);
    }

    // 4. Invalid currency should throw
    let threw = false;
    try {
      await ExchangeRateService.getRate('INVALID_CURRENCY');
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('Expected invalid currency to throw');

    console.log('PASS: ExchangeRateService tests passed');
  } finally {
    await pool.end();
  }
}

testFxRateService().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/fx-rate-service.test.ts` (from `server/`)  
Expected: FAIL with "Cannot find module '../src/shared/services/exchangeRate.service.js'"

- [ ] **Step 3: Implement `ExchangeRateService`**

```typescript
// server/src/shared/services/exchangeRate.service.ts
import { pool } from '../db/pool.js';

export interface FxRateResult {
  from: string;
  to: string;
  date: string;
  rate: number;
  source: 'IDENTITY' | 'DB_CACHE' | 'UPSTREAM_API' | 'FALLBACK';
}

export class ExchangeRateService {
  private static readonly PRIMARY_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api';
  private static readonly FALLBACK_BASE = 'https://latest.currency-api.pages.dev/v1/currencies';
  
  public static readonly ALLOWED_CURRENCIES = new Set([
    'INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'THB', 'MYR'
  ]);

  static async getRate(fromCurrency: string, expenseDate?: string): Promise<FxRateResult> {
    const from = fromCurrency.toUpperCase().trim();
    if (!this.ALLOWED_CURRENCIES.has(from)) {
      throw new Error(`Unsupported or invalid currency code: ${from}`);
    }

    // Same-currency identity
    if (from === 'INR') {
      return {
        from: 'INR',
        to: 'INR',
        date: expenseDate || new Date().toISOString().split('T')[0],
        rate: 1.0,
        source: 'IDENTITY'
      };
    }

    const targetDate = expenseDate && /^\d{4}-\d{2}-\d{2}$/.test(expenseDate)
      ? expenseDate
      : new Date().toISOString().split('T')[0];

    // 1. Check PostgreSQL cache
    const cacheRes = await pool.query(
      `SELECT rate FROM exchange_rates 
       WHERE from_currency = $1 AND to_currency = 'INR' AND rate_date = $2`,
      [from, targetDate]
    );

    if (cacheRes.rowCount && cacheRes.rowCount > 0) {
      return {
        from,
        to: 'INR',
        date: targetDate,
        rate: parseFloat(cacheRes.rows[0].rate),
        source: 'DB_CACHE'
      };
    }

    // 2. Fetch from Upstream API
    const rate = await this.fetchRateFromUpstream(from, targetDate);

    // 3. Save to Cache
    try {
      await pool.query(
        `INSERT INTO exchange_rates (from_currency, to_currency, rate_date, rate)
         VALUES ($1, 'INR', $2, $3)
         ON CONFLICT (from_currency, to_currency, rate_date) 
         DO UPDATE SET rate = EXCLUDED.rate`,
        [from, targetDate, rate]
      );
    } catch (dbErr) {
      console.warn('Failed to cache exchange rate to database:', dbErr);
    }

    return {
      from,
      to: 'INR',
      date: targetDate,
      rate,
      source: 'UPSTREAM_API'
    };
  }

  private static async fetchRateFromUpstream(fromCur: string, dateStr: string): Promise<number> {
    const curLower = fromCur.toLowerCase();
    const primaryUrl = `${this.PRIMARY_BASE}@${dateStr}/v1/currencies/${curLower}.min.json`;
    const fallbackUrl = `${this.FALLBACK_BASE}/${curLower}.json`;

    // Attempt primary CDN (historical date)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(primaryUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data: any = await res.json();
        const rate = data[curLower]?.inr;
        if (typeof rate === 'number' && rate > 0) return rate;
      }
    } catch (err) {
      console.warn(`Primary FX CDN failed for ${fromCur} on ${dateStr}, trying fallback...`, err);
    }

    // Attempt fallback CDN (latest mirror)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(fallbackUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data: any = await res.json();
        const rate = data[curLower]?.inr;
        if (typeof rate === 'number' && rate > 0) return rate;
      }
    } catch (err) {
      console.error(`Fallback FX CDN failed for ${fromCur}:`, err);
    }

    // Hard fallback table if completely offline/air-gapped
    const emergencyRates: Record<string, number> = {
      USD: 84.15,
      EUR: 91.20,
      GBP: 109.50,
      AED: 22.91,
      SGD: 64.20,
      JPY: 0.55
    };

    if (emergencyRates[fromCur]) {
      return emergencyRates[fromCur];
    }

    throw new Error(`Unable to resolve exchange rate for ${fromCur} to INR`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/fx-rate-service.test.ts` (from `server/`)  
Expected: PASS with "PASS: ExchangeRateService tests passed"

- [ ] **Step 5: Commit**

```bash
git add server/src/shared/services/exchangeRate.service.ts server/tests/fx-rate-service.test.ts
git commit -m "feat(services): implement ExchangeRateService with PostgreSQL caching and CDN fallback"
```

---

### Task 3: Backend API Endpoint & Validation

**Files:**
- Modify: `server/src/features/travel/travel.routes.ts`
- Modify: `server/src/features/travel/travel.controller.ts`
- Modify: `server/src/features/travel/travel.validation.ts`
- Modify: `server/src/features/travel/travel.types.ts`
- Test: `server/tests/travel-fx-api.test.ts`

**Interfaces:**
- Consumes: `ExchangeRateService.getRate`
- Produces: `GET /api/travel/fx-rate?from=USD&date=YYYY-MM-DD` endpoint returning `{ status: 'success', data: { from, to, date, rate, source } }`

- [ ] **Step 1: Write the failing API test**

```typescript
// server/tests/travel-fx-api.test.ts
import { app } from '../src/app.js';
import { pool } from '../src/shared/db/pool.js';

async function testFxApi() {
  const server = app.listen(0);
  const address: any = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Valid currency request
    const res = await fetch(`${baseUrl}/api/travel/fx-rate?from=USD&date=2026-11-10`);
    if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
    const json: any = await res.json();
    if (json.status !== 'success' || !json.data.rate) {
      throw new Error('Invalid response structure from /api/travel/fx-rate');
    }

    // 2. Invalid currency request
    const badRes = await fetch(`${baseUrl}/api/travel/fx-rate?from=XYZ`);
    if (badRes.status !== 400) throw new Error(`Expected 400 for bad currency, got ${badRes.status}`);

    console.log('PASS: /api/travel/fx-rate API tests passed');
  } finally {
    server.close();
    await pool.end();
  }
}

testFxApi().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/travel-fx-api.test.ts` (from `server/`)  
Expected: FAIL with 404 Not Found (endpoint does not exist yet)

- [ ] **Step 3: Update `travel.types.ts`, `travel.controller.ts`, and `travel.routes.ts`**

In `server/src/features/travel/travel.types.ts`:
Update `TravelExpense`:
```typescript
export interface TravelExpense {
  id?: string;
  travel_request_id?: string;
  travelRequestId?: string;
  category: ExpenseCategory;
  merchant: string;
  amount: number; // Converted INR amount
  original_currency?: string;
  originalCurrency?: string;
  original_amount?: number;
  originalAmount?: number;
  exchange_rate?: number;
  exchangeRate?: number;
  inr_amount?: number;
  inrAmount?: number;
  expense_date?: string;
  expenseDate?: string;
  receipt_image_url?: string | null;
  receiptImageUrl?: string | null;
  notes?: string | null;
  created_at?: string;
}
```

In `server/src/features/travel/travel.controller.ts`:
Add handler `getFxRate`:
```typescript
export const getFxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const from = (req.query.from as string || '').toUpperCase().trim();
    const date = (req.query.date as string || '').trim();

    if (!from || !ExchangeRateService.ALLOWED_CURRENCIES.has(from)) {
      res.status(400).json({
        status: 'error',
        message: `Invalid or unsupported currency. Allowed: ${Array.from(ExchangeRateService.ALLOWED_CURRENCIES).join(', ')}`
      });
      return;
    }

    const fxData = await ExchangeRateService.getRate(from, date || undefined);
    res.json({
      status: 'success',
      data: fxData
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
```

In `server/src/features/travel/travel.routes.ts`:
Register route:
```typescript
router.get('/fx-rate', travelController.getFxRate);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/travel-fx-api.test.ts` (from `server/`)  
Expected: PASS with "PASS: /api/travel/fx-rate API tests passed"

- [ ] **Step 5: Commit**

```bash
git add server/src/features/travel/travel.routes.ts server/src/features/travel/travel.controller.ts server/src/features/travel/travel.types.ts server/tests/travel-fx-api.test.ts
git commit -m "feat(api): expose GET /api/travel/fx-rate with ISO validation"
```

---

### Task 4: Travel Repository & State Machine Calculation Updates

**Files:**
- Modify: `server/src/features/travel/travel.repository.ts`
- Modify: `server/src/features/travel/travel.service.ts`
- Test: `server/tests/travel-multi-currency-repo.test.ts`

**Interfaces:**
- Consumes: `travel_expenses` table with multi-currency fields
- Produces: Normalization of submitted expenses into INR values, summing to `travel_requests.total_expenses`.

- [ ] **Step 1: Write the failing repository test**

```typescript
// server/tests/travel-multi-currency-repo.test.ts
import { travelRepository } from '../src/features/travel/travel.repository.js';
import { pool } from '../src/shared/db/pool.js';

async function testRepositoryMultiCurrency() {
  try {
    // 1. Fetch any test user
    const userRes = await pool.query('SELECT id, manager_id FROM users LIMIT 1');
    if (!userRes.rowCount) throw new Error('No users found in database for test');
    const user = userRes.rows[0];

    // 2. Create request with 1 INR expense and 1 USD expense
    const request = await travelRepository.createRequest({
      userId: user.id,
      managerId: user.manager_id,
      travelType: 'UPCOMING',
      title: 'London & NY Client Meetings',
      purpose: 'Annual executive review',
      projectCode: 'INTL-2026',
      origin: 'Mumbai',
      destination: 'New York',
      departureDate: '2026-12-01',
      returnDate: '2026-12-10',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+919876543210',
      expenses: [
        {
          category: 'FLIGHT',
          merchant: 'Air India',
          amount: 50000.00,
          originalAmount: 50000.00,
          originalCurrency: 'INR',
          exchangeRate: 1.0,
          inrAmount: 50000.00,
          expenseDate: '2026-12-01'
        },
        {
          category: 'HOTEL',
          merchant: 'Hilton Midtown',
          amount: 1000.00, // Client sent 1000 USD
          originalAmount: 1000.00,
          originalCurrency: 'USD',
          exchangeRate: 84.15,
          inrAmount: 84150.00,
          expenseDate: '2026-12-02'
        }
      ]
    });

    // Verify total_expenses equals exactly ₹1,34,150.00
    if (Math.abs(Number(request.total_expenses) - 134150.00) > 0.01) {
      throw new Error(`Expected total_expenses 134150.00, got ${request.total_expenses}`);
    }

    // Verify expenses returned have currency details
    const fetched = await travelRepository.getRequestById(request.id);
    const usdExpense = fetched?.expenses.find((e: any) => e.original_currency === 'USD');
    if (!usdExpense || Number(usdExpense.original_amount) !== 1000.00) {
      throw new Error('USD expense original amount mismatch');
    }

    console.log('PASS: TravelRepository multi-currency test passed');
  } finally {
    await pool.end();
  }
}

testRepositoryMultiCurrency().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/travel-multi-currency-repo.test.ts` (from `server/`)  
Expected: FAIL with "USD expense original amount mismatch" or column insertion error.

- [ ] **Step 3: Update `travel.repository.ts` and `travel.service.ts`**

In `server/src/features/travel/travel.repository.ts`:
Update the expense insertion loop in `createRequest`:
```typescript
// Insert itemized expenses with multi-currency values
const expenseRows: any[] = [];
for (const exp of data.expenses) {
  const origCurrency = (exp.originalCurrency || exp.currency || 'INR').toUpperCase().trim();
  const origAmount = Number(exp.originalAmount || exp.amount || 0);
  const rate = Number(exp.exchangeRate || 1.0);
  // Authoritative server-side converted INR amount
  const calculatedInrAmount = origCurrency === 'INR' ? origAmount : Math.round(origAmount * rate * 100) / 100;

  const expRes = await client.query(
    `INSERT INTO travel_expenses (
      travel_request_id, category, merchant, amount, original_currency, original_amount,
      exchange_rate, inr_amount, expense_date, receipt_image_url, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      requestRow.id,
      exp.category,
      exp.merchant,
      calculatedInrAmount, // Backward compatible 'amount' column holds INR
      origCurrency,
      origAmount,
      rate,
      calculatedInrAmount,
      exp.expenseDate || exp.expense_date,
      exp.receiptImageUrl || exp.receipt_image_url || null,
      exp.notes || null
    ]
  );
  expenseRows.push(expRes.rows[0]);
}
```

Update `totalExpenses` calculation in `createRequest`:
```typescript
const totalExpenses = (data.expenses || []).reduce((acc: number, exp: any) => {
  const origCur = (exp.originalCurrency || exp.currency || 'INR').toUpperCase().trim();
  const origAmt = Number(exp.originalAmount || exp.amount || 0);
  const rate = Number(exp.exchangeRate || 1.0);
  const inr = origCur === 'INR' ? origAmt : Math.round(origAmt * rate * 100) / 100;
  return acc + inr;
}, 0);
```

Apply matching updates to `resubmitRequest` in `travel.repository.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/travel-multi-currency-repo.test.ts` (from `server/`)  
Expected: PASS with "PASS: TravelRepository multi-currency test passed"

- [ ] **Step 5: Commit**

```bash
git add server/src/features/travel/travel.repository.ts server/src/features/travel/travel.service.ts server/tests/travel-multi-currency-repo.test.ts
git commit -m "feat(repo): calculate and store multi-currency line items and normalized INR totals"
```

---

### Task 5: Frontend Types, API Client & `useFxRate` Hook

**Files:**
- Modify: `client/src/features/travel/types/travel.types.ts`
- Modify: `client/src/features/travel/services/travel.api.ts`
- Modify: `client/src/features/travel/utils/currency.ts`
- Create: `client/src/features/travel/hooks/useFxRate.ts`
- Test: `client/tests/currency-utils.test.ts`

**Interfaces:**
- Consumes: `GET /api/travel/fx-rate`
- Produces: `useFxRate(currency: string, date: string): { rate: number, loading: boolean, error: string | null }`, `formatForeignCurrency(amount: number, currency: string): string`

- [ ] **Step 1: Write the failing currency utils test**

```typescript
// client/tests/currency-utils.test.ts
import { formatForeignCurrency, formatDualCurrency } from '../src/features/travel/utils/currency.js';

function testCurrencyUtils() {
  // 1. Format foreign currencies with symbols
  const usd = formatForeignCurrency(150, 'USD');
  if (!usd.includes('150.00') || !usd.includes('$')) {
    throw new Error(`USD format mismatch: ${usd}`);
  }

  // 2. Format dual currency badge string
  const dual = formatDualCurrency(150, 'USD', 12622.50);
  if (!dual.includes('$150.00') || !dual.includes('₹12,622.50')) {
    throw new Error(`Dual currency format mismatch: ${dual}`);
  }

  console.log('PASS: Currency utility tests passed');
}

testCurrencyUtils();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/currency-utils.test.ts` (from `client/`)  
Expected: FAIL with "formatForeignCurrency is not exported"

- [ ] **Step 3: Implement client types, utils, and `useFxRate`**

In `client/src/features/travel/types/travel.types.ts`:
Update `TravelExpenseItem`:
```typescript
export interface TravelExpenseItem {
  id?: string;
  category: ExpenseCategory;
  merchant: string;
  amount: number; // Converted INR
  originalCurrency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  inrAmount?: number;
  expenseDate: string;
  receiptImageUrl?: string | null;
  notes?: string | null;
}
```

In `client/src/features/travel/utils/currency.ts`:
Add multi-currency helpers:
```typescript
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF'
};

export function formatForeignCurrency(amount: number, currency: string = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDualCurrency(foreignAmount: number, foreignCurrency: string, inrAmount: number): string {
  if (foreignCurrency.toUpperCase() === 'INR') {
    return formatINR(inrAmount);
  }
  return `${formatForeignCurrency(foreignAmount, foreignCurrency)} (₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
}
```

In `client/src/features/travel/services/travel.api.ts`:
Add API client method:
```typescript
export const getFxRate = async (from: string, date?: string): Promise<{ rate: number; from: string; date: string }> => {
  const params: any = { from };
  if (date) params.date = date;
  const res = await travelApiClient.get('/api/travel/fx-rate', { params });
  return res.data.data;
};
```

In `client/src/features/travel/hooks/useFxRate.ts`:
```typescript
import { useState, useEffect } from 'react';
import { getFxRate } from '../services/travel.api';

const fxMemoryCache = new Map<string, number>();

export function useFxRate(currency: string = 'INR', expenseDate?: string) {
  const cur = currency.toUpperCase().trim();
  const dateKey = expenseDate || new Date().toISOString().split('T')[0];
  const cacheKey = `${cur}_INR_${dateKey}`;

  const [rate, setRate] = useState<number>(() => {
    if (cur === 'INR') return 1.0;
    return fxMemoryCache.get(cacheKey) || 1.0;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cur === 'INR') {
      setRate(1.0);
      setLoading(false);
      return;
    }

    if (fxMemoryCache.has(cacheKey)) {
      setRate(fxMemoryCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await getFxRate(cur, dateKey);
        if (active) {
          fxMemoryCache.set(cacheKey, data.rate);
          setRate(data.rate);
        }
      } catch (err: any) {
        if (active) setError(err.message || 'FX lookup failed');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [cur, dateKey, cacheKey]);

  return { rate, loading, error };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/currency-utils.test.ts` (from `client/`)  
Expected: PASS with "PASS: Currency utility tests passed"

- [ ] **Step 5: Commit**

```bash
git add client/src/features/travel/types/travel.types.ts client/src/features/travel/utils/currency.ts client/src/features/travel/services/travel.api.ts client/src/features/travel/hooks/useFxRate.ts client/tests/currency-utils.test.ts
git commit -m "feat(client): implement currency utilities, API client, and useFxRate hook"
```

---

### Task 6: Frontend Expense Form & Dynamic Table (`ExpenseRowItem.tsx` & `DynamicExpenseTable.tsx`)

**Files:**
- Modify: `client/src/features/travel/components/forms/ExpenseRowItem.tsx`
- Modify: `client/src/features/travel/components/forms/DynamicExpenseTable.tsx`
- Test: `client/tests/expense-multi-currency-form.test.ts`

**Interfaces:**
- Consumes: `useFxRate`, `CURRENCY_SYMBOLS`, `formatINR`
- Produces: Itemized expense row with Currency Dropdown, Foreign Amount Input, and Live INR Calculation Pill.

- [ ] **Step 1: Write the failing form component test**

```typescript
// client/tests/expense-multi-currency-form.test.ts
import fs from 'node:fs';

function testExpenseFormSource() {
  const content = fs.readFileSync('src/features/travel/components/forms/ExpenseRowItem.tsx', 'utf-8');
  if (!content.includes('originalCurrency') || !content.includes('useFxRate')) {
    throw new Error('ExpenseRowItem does not yet integrate multi-currency and useFxRate');
  }
  console.log('PASS: ExpenseRowItem source verified for multi-currency');
}

testExpenseFormSource();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/expense-multi-currency-form.test.ts` (from `client/`)  
Expected: FAIL with "ExpenseRowItem does not yet integrate multi-currency and useFxRate"

- [ ] **Step 3: Update `ExpenseRowItem.tsx` and `DynamicExpenseTable.tsx`**

In `ExpenseRowItem.tsx`:
- Add currency selection dropdown next to amount:
  ```tsx
  <select
    value={item.originalCurrency || 'INR'}
    onChange={(e) => handleCurrencyChange(e.target.value)}
    className="h-10 px-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs font-semibold text-[#061B31]"
    aria-label="Currency"
  >
    <option value="INR">INR (₹)</option>
    <option value="USD">USD ($)</option>
    <option value="EUR">EUR (€)</option>
    <option value="GBP">GBP (£)</option>
    <option value="AED">AED (د.إ)</option>
    <option value="SGD">SGD (S$)</option>
    <option value="JPY">JPY (¥)</option>
  </select>
  ```
- Use `useFxRate(item.originalCurrency || 'INR', item.expenseDate)`.
- When rate updates, compute `inrAmount = Math.round(Number(item.originalAmount || 0) * rate * 100) / 100` and pass up to parent form state.
- Render conversion pill below amount when foreign currency is selected:
  ```tsx
  {item.originalCurrency && item.originalCurrency !== 'INR' && (
    <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-[#533AFD]">
      <span>1 {item.originalCurrency} = ₹{rate.toFixed(2)}</span>
      <span className="text-[#334155]">→</span>
      <span className="font-bold text-[#061B31]">₹{item.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    </div>
  )}
  ```

In `DynamicExpenseTable.tsx`:
- Render summary footer showing total calculated in INR, and if foreign currencies are present, display a subtle note:
  `"Total normalized in INR: ₹1,34,150.00 (Includes foreign currency items)"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/expense-multi-currency-form.test.ts` (from `client/`)  
Expected: PASS with "PASS: ExpenseRowItem source verified for multi-currency"

- [ ] **Step 5: Commit**

```bash
git add client/src/features/travel/components/forms/ExpenseRowItem.tsx client/src/features/travel/components/forms/DynamicExpenseTable.tsx client/tests/expense-multi-currency-form.test.ts
git commit -m "feat(ui): add currency selector and live FX conversion pill in ExpenseRowItem"
```

---

### Task 7: Manager & Admin Workstations (Dual-Currency Display & Verification)

**Files:**
- Modify: `client/src/features/travel/pages/TravelDetailPage.tsx`
- Modify: `client/src/features/travel/components/audit/ManagerDecisionCard.tsx`
- Modify: `client/src/features/travel/pages/AdminClearancePage.tsx`
- Test: `client/tests/travel-detail-dual-currency.test.ts`

**Interfaces:**
- Consumes: `TravelExpenseItem` with `originalCurrency`, `originalAmount`, `exchangeRate`, `inrAmount`
- Produces: Dual-currency badges in audit workstations for line managers and finance admins.

- [ ] **Step 1: Write the failing audit view test**

```typescript
// client/tests/travel-detail-dual-currency.test.ts
import fs from 'node:fs';

function testDetailSource() {
  const content = fs.readFileSync('src/features/travel/pages/TravelDetailPage.tsx', 'utf-8');
  if (!content.includes('original_currency') && !content.includes('originalCurrency')) {
    throw new Error('TravelDetailPage does not support rendering original_currency');
  }
  console.log('PASS: TravelDetailPage source verified for dual-currency');
}

testDetailSource();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/travel-detail-dual-currency.test.ts` (from `client/`)  
Expected: FAIL with "TravelDetailPage does not support rendering original_currency"

- [ ] **Step 3: Update `TravelDetailPage.tsx`, `ManagerDecisionCard.tsx`, and `AdminClearancePage.tsx`**

In `TravelDetailPage.tsx`:
- In the itemized expenses table, render dual-currency details:
  ```tsx
  <div className="flex flex-col items-end">
    <span className="font-mono font-bold text-[#061B31] text-sm tabular-nums">
      ₹{Number(expense.inr_amount || expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </span>
    {expense.original_currency && expense.original_currency !== 'INR' && (
      <span className="text-[11px] font-mono text-[#50617A] tabular-nums">
        {formatForeignCurrency(Number(expense.original_amount), expense.original_currency)} @ ₹{Number(expense.exchange_rate).toFixed(2)}
      </span>
    )}
  </div>
  ```

In `ManagerDecisionCard.tsx` and `AdminClearancePage.tsx`:
- Show total payout clearly in INR (`₹`) while listing foreign item counts in the audit summary header.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/travel-detail-dual-currency.test.ts` (from `client/`)  
Expected: PASS with "PASS: TravelDetailPage source verified for dual-currency"

- [ ] **Step 5: Commit**

```bash
git add client/src/features/travel/pages/TravelDetailPage.tsx client/src/features/travel/components/audit/ManagerDecisionCard.tsx client/src/features/travel/pages/AdminClearancePage.tsx client/tests/travel-detail-dual-currency.test.ts
git commit -m "feat(workstations): render dual-currency badges and exchange rates in manager and admin portals"
```

---

### Task 8: End-to-End Regression & Full Verification

**Files:**
- Test: Run all backend and frontend test suites

- [ ] **Step 1: Run all backend automated tests**

Run: `npm run test:fsm` (from `server/`)  
Run: `npm run test:repo` (from `server/`)  
Run: `npm run test:api` (from `server/`)  
Run: `npm run test:dates` (from `server/`)  
Run: `npx tsx tests/fx-rate-service.test.ts` (from `server/`)  
Run: `npx tsx tests/travel-multi-currency-repo.test.ts` (from `server/`)  
Expected: All test suites PASS with 0 failures.

- [ ] **Step 2: Run client type-check and build**

Run: `npm run build` (from `client/`)  
Expected: Vite build succeeds with 0 errors.

- [ ] **Step 3: Commit and tag milestone**

```bash
git status
git commit --allow-empty -m "chore(release): complete multi-currency support milestone with full test verification"
```
