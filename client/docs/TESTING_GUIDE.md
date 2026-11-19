# TripFlow Client Testing Guide

This document outlines the testing philosophy, test suite inventory, execution commands, and guidelines for writing standalone assertion tests in the **TripFlow Web Client**.

---

## 🧪 Testing Philosophy

The TripFlow frontend maintains a high bar of software quality and visual integrity using **lightweight, standalone TypeScript verification suites**.
* **Zero Heavy Harness Overhead**: Tests execute in sub-seconds directly via `npx tsx` without requiring browser automation or heavyweight test runners for purely algorithmic, typographic, and invariant checks.
* **Deterministic Verification**: Every critical business logic rule (currency formatting, date boundaries, phone dial prefixes, permission filtering) is verified against explicit invariant assertions.
* **Continuous Visual & Token Auditing**: The test suite validates Tailwind CSS v4 design tokens, contrast ratios, and element sizing to prevent regressions toward generic AI patterns.

---

## 📂 Test Suites Directory & Categorization

All client tests reside in [client/tests/](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/client/tests). The 47 test suites are grouped into 8 key domains:

```
client/tests/
├── 💰 Currency & Financials
│   ├── currency.test.ts                           # INR (₹) formatting, Indian numbering system (Lakhs/Crores)
│   ├── expense-amount-input.test.ts               # Input parsing, zero handling, and decimal constraints
│   └── expense-subtotal.test.ts                   # Real-time subtotal summation and mismatch detection
│
├── 📞 Country Phone & Contact Validation
│   ├── country-phone.test.ts                      # Dial code parsing, international prefix formatting
│   └── country-phone-formats.test.ts              # E.164 dial standards (+91, +1, +44)
│
├── 📅 Travel Dates & Timezones
│   ├── travel-dates.test.ts                       # Date range logic, departure vs return ordering
│   ├── expense-date-boundaries.test.ts            # Verification that expense dates fall within trip range
│   └── travel-form-date-validation.test.ts        # Upcoming travel past-date restrictions
│
├── 🏛️ Governance Portals & Role Queues
│   ├── admin-governance-unified.test.ts           # Admin clearance ledger, dual-route review controls
│   ├── admin-queue.test.ts                        # Admin queue filtering and approval triggers
│   ├── admin-single-route-revision.test.ts        # Admin Route A vs Route B revision dispatch
│   ├── admin-toggle-ui.test.ts                    # User activation/deactivation UI state
│   ├── employee-governance-unified.test.ts        # Employee trips table, status badges, actions
│   ├── employee-spend-analytics.test.ts           # Employee spend velocity and category analytics
│   ├── manager-governance-unified.test.ts         # Manager audit workstation, queue counts
│   ├── manager-queue.test.ts                      # Subordinate filtering and team queue guards
│   ├── manager-team-analytics.test.ts             # Department burn rate and team spend aggregation
│   └── users-management.test.ts                   # Admin user directory, deletion guards
│
├── 📝 Forms, Alterations & Validation
│   ├── auth-validation.test.ts                    # Sign-in, sign-up, password recovery schema tests
│   ├── form-blur-validation.test.ts               # Real-time validation triggers on blur
│   ├── merchant-validation.test.ts                # Non-empty merchant names and sanitize checks
│   ├── resubmit-alterations-field.test.ts         # Mandatory alteration remarks invariant
│   └── view-revisions-action.test.ts              # Revision history retrieval and display
│
├── 🎨 Stripe Design System & Tokens
│   ├── stripe-theme-tokens.test.ts                # Hex code verification for canvas, surface, primary blurple
│   ├── stripe-contrast-readability.test.ts        # WCAG 2.1 AA text contrast validation
│   ├── stripe-primitives.test.ts                  # Button, Card, and Input component styling
│   ├── stripe-residual-audit.test.ts              # Audit ensuring complete removal of legacy Warm Storycraft
│   ├── stripe-chart-colors.test.ts                # Recharts palette conformity
│   ├── form-input-borders.test.ts                 # #CBD5E1 hairline border enforcement
│   ├── form-permanent-helper-text.test.ts         # Permanent form helper text presence
│   ├── kpi-card-compact-height.test.ts            # Compact padding and height checks for KPI cards
│   └── portal-table-contrast.test.ts              # Table row alternate shading and divider contrast
│
├── 📎 Proof Attachments & Lightbox Viewer
│   ├── proof-attachment-form.test.ts              # Multi-proof attachment array handling
│   ├── proof-attachment-preview-download.test.ts  # Download and external viewing links
│   └── proof-inspector-viewer.test.ts             # Lightbox modal zoom and metadata inspection
│
└── 📊 Budgets & Navigation
    ├── budget-analytics.test.ts                   # Headroom calculations and utilization velocity
    ├── department-budget-redesign.test.ts         # Budget rail and allocation card layouts
    ├── department-budget-scroll.test.ts           # Scrollable budget containers
    ├── department-category-pie-chart.test.ts      # Category breakdown aggregation
    ├── avatar-initial.test.ts                     # User avatar initial generation
    ├── clone-trip-search.test.ts                  # Past trip pre-fill and clone search
    ├── refresh-button.test.ts                     # Manual queue refresh triggers
    ├── scroll-reset.test.ts                       # Viewport restoration on route transitions
    ├── sidebar-nav.test.ts                        # Role-specific sidebar item resolution
    ├── travel-badge.test.ts                       # Badge variant and icon color mapping
    ├── travel-detail-polymorphic.test.ts          # Unified travel detail workstation layout
    └── travel-metrics-grid.test.ts                # Tabular numerical grid formatting
```

---

## 🚀 Running Tests

All tests are executable via `npx tsx` from the project root or the `client/` directory.

### 1. Run a Specific Test Suite
```bash
# Example: Run Indian Rupee currency formatter test
npx tsx client/tests/currency.test.ts

# Example: Run Stripe design token verification
npx tsx client/tests/stripe-theme-tokens.test.ts

# Example: Run travel date boundary test
npx tsx client/tests/travel-dates.test.ts
```

### 2. Run Batches of Tests (PowerShell)

#### Run All Design System & Token Tests:
```powershell
Get-ChildItem client/tests/stripe*.test.ts | ForEach-Object { npx tsx $_.FullName }
```

#### Run All Governance & Queue Tests:
```powershell
Get-ChildItem client/tests/*governance*.test.ts, client/tests/*queue*.test.ts | ForEach-Object { npx tsx $_.FullName }
```

#### Run All 47 Client Tests:
```powershell
Get-ChildItem client/tests/*.test.ts | ForEach-Object {
    Write-Host "Running $($_.Name)..." -ForegroundColor Cyan
    npx tsx $_.FullName
}
```

---

## ✍️ How to Write a New Test

Every test file follows a clean, self-contained assertion pattern without external test frameworks.

### Example Template (`client/tests/sample-feature.test.ts`):

```typescript
// client/tests/sample-feature.test.ts

// 1. Define standard assert helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

// 2. Import functions, schemas, or utilities to test
import { formatINR } from '../src/features/travel/utils/currency';

// 3. Encapsulate tests in runner function
function runSampleTests() {
  console.log('🧪 Running Sample Feature Tests...\n');

  // Test Case 1: Indian Numbering System
  const formatted = formatINR(148000);
  console.log('Formatted Amount:', formatted);
  assert(formatted.includes('₹'), 'Must contain rupee currency symbol');
  assert(formatted.includes('1,48,000'), 'Must adhere to Indian numbering (Lakhs)');

  // Test Case 2: Zero value handling
  const zeroFormatted = formatINR(0);
  assert(zeroFormatted.includes('0.00'), 'Zero amount must include two decimal places');

  console.log('\n✅ ALL SAMPLE FEATURE TESTS PASSED!\n');
}

// 4. Execute immediately
runSampleTests();
```

### Rules for Writing Client Tests:
1. **Meaningful Error Messages**: Provide clear failure messages in the second argument of `assert()`.
2. **Deterministic Data**: Avoid using `Math.random()` or real network calls; mock external API responses.
3. **Strict Numbering Standards**: Verify all currency checks using Indian Rupee (`INR` / `₹`) formatting.
4. **Log Progress Clearly**: Use emojis (`🧪`, `✅`, `❌`) to provide fast visual feedback in the console.
