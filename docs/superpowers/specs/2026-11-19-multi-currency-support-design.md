# Architectural Design Specification: Multi-Currency Support for TripFlow

**Document ID**: `SPEC-2026-11-19-MULTI-CURRENCY`  
**Status**: `PROPOSED / IN-REVIEW`  
**Target Branch**: `feature/multi-currency-support`  
**Author**: Antigravity Assistant & Sudalaimani Kannan  
**Audited Against**: OWASP API Security Top 10, Vercel React Best Practices, Stripe Design System Tokens  

---

## 1. Executive Summary & Core Invariant

TripFlow enforces a strict corporate governance invariant: **all corporate department budgets, audit ledgers, and financial payouts are denominated strictly in Indian Rupees (`INR` / `₹`)**.

The **Multi-Currency Support** feature enables employees to submit business travel expenses incurred abroad in foreign currencies (e.g. `USD`, `EUR`, `GBP`, `AED`, `SGD`, `JPY`, etc.). The system transparently fetches verified central-bank exchange rates using [`fawazahmed0/exchange-api`](https://github.com/fawazahmed0/exchange-api), caches them in PostgreSQL, and converts each line item into normalized `INR` base values. Managers and finance admins can audit the original currency receipts while approving payouts that conform directly to INR departmental budget allocations.

---

## 2. Security & Compliance Architecture (`fullstack-security-auditor`)

### 2.1 Threat Modeling & Defenses (OWASP Alignment)

| Threat & OWASP Category | Attack Vector | Security Defense in TripFlow |
| :--- | :--- | :--- |
| **Tampering / Manipulation**<br>*(OWASP API3:2023 - Broken Object Property)* | A malicious client submits an inflated exchange rate or manually calculated `amount` to claim extra reimbursement. | **Authoritative Server Recalculation**: The server ignores any client-supplied INR total. It independently looks up the exchange rate and computes `inr_amount = round(original_amount * rate, 2)` before persisting to the DB. |
| **SSRF (Server-Side Request Forgery)**<br>*(OWASP API7:2023 - Server-Side Request Forgery)* | An attacker modifies API request parameters to force the server to fetch malicious internal/external URLs. | **Strict Allowlist & Sanitization**: Currency code is validated against a strict regex `/^[A-Z]{3}$/` and an explicit ISO whitelist. Upstream fetch URLs are strictly constructed using hardcoded domain constants (`cdn.jsdelivr.net` / `latest.currency-api.pages.dev`). |
| **Denial of Service / Upstream Outage**<br>*(OWASP API4:2023 - Unrestricted Resource Consumption)* | Remote CDN rate-limits or goes down, blocking travel submissions across the company. | **PostgreSQL Read-Through Cache & Timeout**: 3-second fetch timeout with automatic fallback to secondary CDN mirror. All retrieved rates are cached permanently in PostgreSQL; subsequent queries incur 0 external network requests. |
| **SQL Injection**<br>*(OWASP A03:2021 - Injection)* | Malicious input in currency codes or date parameters injected into SQL queries. | **100% Parameterized Queries**: All database lookups use PostgreSQL parameterized placeholders (`$1, $2, $3`); zero string concatenation. |
| **Floating Point Inaccuracies**<br>*(Financial Integrity)* | Standard JavaScript floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`) distorting accounting ledger balances. | **Fixed-Point Rounding & DB Types**: Database stores `NUMERIC(12,2)` for amounts and `NUMERIC(12,6)` for rates. JavaScript calculations use `Math.round((amount * rate) * 100) / 100`. |

---

## 3. Database Architecture & Schema Changes

### 3.1 Migration `005_add_multi_currency_support.sql`

```sql
-- server/src/shared/db/migrations/005_add_multi_currency_support.sql

-- 1. Upgrade travel_expenses table with multi-currency tracking
ALTER TABLE travel_expenses
  ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12, 6) NOT NULL DEFAULT 1.000000,
  ADD COLUMN IF NOT EXISTS inr_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- Backfill existing INR rows to maintain data consistency
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

---

## 4. Backend Architecture & Service Design

### 4.1 Exchange Rate Service (`server/src/shared/services/exchangeRate.service.ts`)

```typescript
export interface FxRateResult {
  fromCurrency: string;
  toCurrency: string;
  rateDate: string;
  rate: number;
  source: 'DB_CACHE' | 'UPSTREAM_API' | 'FALLBACK';
}

export class ExchangeRateService {
  private static readonly PRIMARY_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api';
  private static readonly FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies';
  private static readonly ALLOWED_CURRENCIES = new Set([
    'INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'THB', 'MYR'
  ]);

  static async getRate(fromCurrency: string, expenseDate?: string): Promise<FxRateResult>;
  private static async fetchFromUpstream(fromCur: string, dateStr: string): Promise<number>;
  private static async saveToCache(fromCur: string, dateStr: string, rate: number): Promise<void>;
}
```

### 4.2 API Endpoint
* **Route**: `GET /api/travel/fx-rate`
* **Query Parameters**:
  * `from` (string, required): e.g. `USD`
  * `date` (ISO date string `YYYY-MM-DD`, optional, defaults to today)
* **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "from": "USD",
      "to": "INR",
      "date": "2026-11-10",
      "rate": 84.1523,
      "source": "DB_CACHE"
    }
  }
  ```

---

## 5. Frontend Architecture & React Best Practices (`frontend-developer` & `react-best-practices`)

### 5.1 Component Breakdown & Data Flow

```
[NewTravelRequestPage / ResubmitTravelRequestPage]
  └── [DynamicExpenseTable]
        └── [ExpenseRowItem]
              ├── [CurrencySelect] (INR, USD, EUR, GBP, AED, SGD, JPY...)
              ├── [OriginalAmountInput] (e.g. $150.00)
              ├── [LiveFxConversionBadge] (e.g. "1 USD = ₹84.15 → ₹12,622.85")
              └── [ProofAttachmentField]
```

### 5.2 Performance & Vercel React Best Practices

1. **Eliminating Waterfalls & Client Deduplication (`client-swr-dedup`)**:
   - Create a custom hook `useFxRate(currency, expenseDate)` with an in-memory cache `Map<string, number>`.
   - Switching between existing line items does not trigger duplicate network fetches.
2. **Debouncing Rate Requests (`js-early-exit`)**:
   - If `currency === 'INR'`, return `rate = 1.0` immediately without firing any network call.
   - Debounce date input changes by 300ms to avoid firing on partial date keystrokes.
3. **Re-render Optimization (`rerender-memo`)**:
   - `ExpenseRowItem` memoized with `React.memo` to prevent re-rendering all rows when only one row's currency or amount changes.
4. **Stripe Design System Tokens & Typography**:
   - Currency badges styled with `bg-[#F8FAFC] border-[#CBD5E1] text-[#061B31]`.
   - Converted amounts rendered in `JetBrains Mono` with tabular digits (`font-mono tabular-nums`).
   - Clear visual indicators when foreign currency is active:
     ```html
     <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
       1 USD = ₹84.15
     </span>
     ```

---

## 6. Testing & Verification Plan

### 6.1 Backend Automated Tests (`server/tests/`)
1. **`fx-rate-service.test.ts`**:
   - Test cache miss: fetches from CDN, writes to PostgreSQL, returns rate.
   - Test cache hit: returns from PostgreSQL without calling CDN.
   - Test fallback mirror: primary CDN 500 error triggers secondary Cloudflare mirror.
   - Test invalid currency: rejects non-allowlisted currency with 400 Bad Request.
2. **`travel-repository-currency.test.ts`**:
   - Create request with 1 INR expense (₹2,000) and 1 USD expense ($100 @ 84.15).
   - Assert `travel_expenses` stores `original_amount=100`, `original_currency='USD'`, `exchange_rate=84.15`, `inr_amount=8415.00`.
   - Assert `travel_requests.total_expenses` correctly equals `₹10,415.00`.

### 6.2 Frontend Automated Tests (`client/tests/`)
1. **`multi-currency-conversion.test.ts`**:
   - Selecting `USD` displays live conversion preview badge.
   - Changing expense date triggers rate update for historical date.
   - Changing amount updates the live calculated INR total instantly.
   - Summary card reflects aggregated INR total across mixed currencies.

---

## 7. Rollout & Phasing

- **Phase 1: Database Migration**: Run `005_add_multi_currency_support.sql` to backfill existing records.
- **Phase 2: Backend FX Service & Route**: Deploy `exchangeRate.service.ts` and `/api/travel/fx-rate`.
- **Phase 3: Frontend Line-Item Updates**: Upgrade `ExpenseRowItem.tsx` and `DynamicExpenseTable.tsx`.
- **Phase 4: Manager & Admin Workstations**: Upgrade `TravelDetailPage.tsx` and clearance portals to render dual currency values.
- **Phase 5: Automated Verification Suite**: Run all backend and frontend unit tests.
