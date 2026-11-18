# Stripe Design System Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul TripFlow's global UI/UX system to faithfully implement all 13 chapters of the Stripe Brand Guidelines extracted from the PDF: Colour (29 tokens), Neutrals, Full Palette, Typography, Type Scale (t00-t09), Spacing (base 2px), Shape (5 radii), Elevation (5 tiers), Iconography, Motion (5 durations & easings), Recharts Data Visualizations, and WCAG Accessibility.

**Architecture:** 
1. Redefine global Tailwind v4 `@theme` and CSS variables in `client/src/index.css` covering the 29-token palette, 5 radii (1px, 4px, 8px, 16px, 100px), 5 elevation shadows (xs, sm, md, lg, xl), 5 motion durations (100ms, 200ms, 300ms, 500ms, 800ms), and typographic scale.
2. Update Recharts data visualizations (`chart.tsx`, `MonthlyBurnChart`, `DepartmentCategoryPieChart`, `DepartmentComparisonChart`, `travelAnalytics.ts`, `budgetAnalytics.ts`) to use contrasting Stripe tokens for the 5 travel expense categories, 6-month burn series, and budget meters.
3. Modernize primitive UI components (`button.tsx`, `card.tsx`, `input.tsx`, `AuthField.tsx`, and `TravelStatusBadge.tsx`) to snap to the 5 radii, 5 elevation tiers, and motion durations.
4. Polish application layouts, forms, and navigation shells (`SignInCard`, `TripFlowHeader`, `DynamicRoleSidebar`) to eliminate residual brown tokens and ensure WCAG AA/AAA compliance.
5. Verify build integrity (`npm run build --prefix client`) and execute complete test suites.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Recharts 3, Class Variance Authority (CVA), Lucide React.

**Spec:** [docs/superpowers/specs/2026-11-18-stripe-design-system-revamp-design.md](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/docs/superpowers/specs/2026-11-18-stripe-design-system-revamp-design.md)

## Global Constraints

- Never alter underlying business logic, state machines, API endpoints, or database schemas.
- Adhere strictly to the Stripe Brand Guidelines PDF:
  - **Colour:** Primary `#533AFD`, Secondary `#E5EDF5`, Accent `#FFE0D1`, Canvas `#F2F7FE`, Inks `#061B31` and `#1A2C44`.
  - **Typography:** Display & Body scale `t00` (56px) through `t09` (12px), weights 300, 400, 500.
  - **Spacing:** Base 2px grid.
  - **Shape:** 5 radii (`1px`, `4px`, `8px`, `16px`, `100px`).
  - **Elevation:** 5 tiers (`xs`, `sm`, `md`, `lg`, `xl`).
  - **Motion:** 5 durations (`100ms`, `200ms`, `300ms`, `500ms`, `800ms`) with `cubic-bezier(0.16, 1, 0.3, 1)` responsive easing.
  - **Accessibility:** Text on `#E5EDF5` must strictly use dark navy `#061B31` to guarantee WCAG AAA contrast (> 11:1).
- Production build command `npm run build --prefix client` (`tsc -b && vite build`) must pass with zero errors.

## Review Focus

1. **29-Token & Neutral Coverage:** Verify all 29 Stripe tokens and the 7 neutrals are declared in `@theme` / `:root` and no `#8A582B` (legacy brown) remains.
2. **Typography & Scale:** Verify heading hierarchy cleanly matches the 14-size scale from `t00` (56px) down to `t09` (12px).
3. **Shape & Elevation Verification:** Verify cards, buttons, badges, and modals use the 5 border radii (`1px`, `4px`, `8px`, `16px`, `100px`) and 5 elevation tiers (`xs`, `sm`, `md`, `lg`, `xl`).
4. **Motion System:** Verify interactive buttons, inputs, modals, and charts use the 5 duration tiers (`100ms`, `200ms`, `300ms`, `500ms`, `800ms`) with responsive easing.
5. **Chart Legibility & Accessibility:** Verify all 5 expense categories, burn series, and budget thresholds use distinct, high-contrast Stripe tokens.

---

### Task 1: Complete Stripe Token Engine Migration (Colour, Neutrals, Scale, Shape, Elevation, Motion)

**Files:**
- Modify: `client/src/index.css`
- Create: `client/tests/stripe-theme-tokens.test.ts`

**Interfaces:**
- Consumes: Tailwind v4 `@theme` directive, CSS variables.
- Produces: Global CSS variables for full palette, typography, shape, elevation, and motion.

- [x] **Step 1: Write failing test in `client/tests/stripe-theme-tokens.test.ts`**

```typescript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Complete Stripe Token Engine Migration...');
  const cssPath = path.resolve(import.meta.dirname, '../src/index.css');
  assert.ok(fs.existsSync(cssPath), 'index.css must exist');

  const content = fs.readFileSync(cssPath, 'utf8');

  // 1. Verify elimination of legacy brown tokens
  assert.ok(!content.includes('#8A582B'), 'Must not contain legacy primary brown #8A582B');
  assert.ok(!content.includes('#996735'), 'Must not contain legacy secondary brown #996735');
  assert.ok(!content.includes('#F7F4EE'), 'Must not contain legacy canvas #F7F4EE');

  // 2. Verify Colour & Full Palette (29 tokens)
  assert.ok(content.includes('--color-primary: #533AFD;'), 'Must define Stripe primary #533AFD');
  assert.ok(content.includes('--color-primary-hover: #4834DB;'), 'Must define Stripe hover #4834DB');
  assert.ok(content.includes('--color-secondary: #E5EDF5;'), 'Must define Stripe secondary #E5EDF5');
  assert.ok(content.includes('--color-canvas: #F2F7FE;'), 'Must define Stripe canvas #F2F7FE');
  assert.ok(content.includes('--color-ink: #061B31;'), 'Must define Stripe ink #061B31');
  assert.ok(content.includes('#FFE0D1'), 'Must include Stripe accent #FFE0D1');
  assert.ok(content.includes('#635BFF'), 'Must include Stripe violet #635BFF');
  assert.ok(content.includes('#00D66F'), 'Must include Stripe mint #00D66F');
  assert.ok(content.includes('#FF6118'), 'Must include Stripe orange #FF6118');

  // 3. Verify Shape & 5 Border Radii (1px, 4px, 8px, 16px, 100px)
  assert.ok(content.includes('--radius-xs: 1px;') || content.includes('1px'), 'Must define 1px radius');
  assert.ok(content.includes('--radius-sm: 4px;') || content.includes('4px'), 'Must define 4px radius');
  assert.ok(content.includes('--radius-md: 8px;') || content.includes('8px'), 'Must define 8px radius');
  assert.ok(content.includes('--radius-lg: 16px;') || content.includes('16px'), 'Must define 16px radius');
  assert.ok(content.includes('--radius-full: 100px;') || content.includes('100px'), 'Must define 100px radius');

  // 4. Verify 5 Elevation Tiers (xs, sm, md, lg, xl)
  assert.ok(content.includes('--shadow-xs:'), 'Must define shadow-xs');
  assert.ok(content.includes('--shadow-sm:'), 'Must define shadow-sm');
  assert.ok(content.includes('--shadow-md:'), 'Must define shadow-md');
  assert.ok(content.includes('--shadow-lg:'), 'Must define shadow-lg');
  assert.ok(content.includes('--shadow-xl:'), 'Must define shadow-xl');

  // 5. Verify 5 Motion Durations & Easing
  assert.ok(content.includes('--duration-100: 100ms;') || content.includes('100ms'), 'Must define 100ms duration');
  assert.ok(content.includes('--duration-200: 200ms;') || content.includes('200ms'), 'Must define 200ms duration');
  assert.ok(content.includes('--duration-300: 300ms;') || content.includes('300ms'), 'Must define 300ms duration');
  assert.ok(content.includes('--duration-500: 500ms;') || content.includes('500ms'), 'Must define 500ms duration');
  assert.ok(content.includes('--duration-800: 800ms;') || content.includes('800ms'), 'Must define 800ms duration');
  assert.ok(content.includes('cubic-bezier(0.16, 1, 0.3, 1)'), 'Must define Stripe responsive ease-out curve');

  console.log('✅ ALL STRIPE TOKEN ENGINE TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Token engine test failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `.\server\node_modules\.bin\tsx.cmd client\tests\stripe-theme-tokens.test.ts`
Expected: FAIL

- [x] **Step 3: Update `client/src/index.css`**

Add the comprehensive Stripe `@theme` and `:root` configuration:

```css
@import "tailwindcss";

@theme {
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Global Canvas & Surfaces */
  --color-canvas: #F2F7FE;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F8FAFC;
  --color-border-warm: #E2E8F0;
  --color-border: #E5EDF5;
  --color-border-strong: #CBD5E1;

  /* Brand Primary & Interactive */
  --color-primary: #533AFD;
  --color-primary-hover: #4834DB;
  --color-secondary: #E5EDF5;
  --color-secondary-hover: #D6D9FC;
  --color-tertiary: #635BFF;

  /* Typography / Inks */
  --color-ink: #061B31;
  --color-text-main: #1A2C44;
  --color-muted: #50617A;
  --color-faint: #7D8BA4;

  /* Semantic Feedback */
  --color-success: #00D66F;
  --color-warning: #FF6118;
  --color-destructive: #DC2626;

  /* 5 Border Radii (PDF Chapter 06) */
  --radius-xs: 1px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 100px;

  /* 5 Elevation Tiers (PDF Chapter 06) */
  --shadow-xs: 0 1px 2px rgba(6, 27, 49, 0.04);
  --shadow-sm: 0 1px 3px rgba(6, 27, 49, 0.06), 0 1px 2px rgba(6, 27, 49, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(6, 27, 49, 0.08), 0 2px 4px -2px rgba(6, 27, 49, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(6, 27, 49, 0.08), 0 4px 6px -4px rgba(6, 27, 49, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(6, 27, 49, 0.10), 0 8px 10px -6px rgba(6, 27, 49, 0.04);

  /* 5 Motion Durations & Easing (PDF Chapter 08) */
  --duration-100: 100ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-800: 800ms;
  --ease-stripe: cubic-bezier(0.16, 1, 0.3, 1);
}

:root {
  font-family: var(--font-sans);
  background-color: #F2F7FE;
  color: #061B31;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;

  /* Stripe 29 Tokens & Full Palette */
  --stripe-primary: #533AFD;
  --stripe-primary-hover: #4834DB;
  --stripe-secondary: #E5EDF5;
  --stripe-accent: #FFE0D1;
  --stripe-canvas: #F2F7FE;
  --stripe-surface: #FFFFFF;
  --stripe-ink: #061B31;
  --stripe-ink-body: #1A2C44;
  --stripe-neutral-black: #000000;
  --stripe-neutral-dark: #101010;
  --stripe-neutral-600: #50617A;
  --stripe-neutral-500: #64748D;
  --stripe-neutral-400: #7D8BA4;
  --stripe-violet: #635BFF;
  --stripe-indigo-light: #7389FF;
  --stripe-periwinkle: #D6D9FC;
  --stripe-mint: #00D66F;
  --stripe-lime: #81B81A;
  --stripe-orange: #FF6118;

  /* Functional Status Variables */
  --blk-error: #DC2626;
  --blk-warning: #FF6118;
  --blk-success: #00D66F;
  --blk-accent-ink: #533AFD;
  --blk-accent-fill: #533AFD;
  --blk-accent-fill-ink: #FFFFFF;
}

body {
  margin: 0;
  min-height: 100dvh;
  background-color: #F2F7FE;
  color: #061B31;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `.\server\node_modules\.bin\tsx.cmd client\tests\stripe-theme-tokens.test.ts`
Expected: PASS with "✅ ALL STRIPE TOKEN ENGINE TESTS PASSED!"

---

### Task 2: Data Visualization & Chart System Overhaul

**Files:**
- Modify: `client/src/features/travel/utils/travelAnalytics.ts:17-26`
- Modify: `client/src/features/travel/utils/budgetAnalytics.ts:240-333`
- Modify: `client/src/shared/components/ui/chart.tsx:50-58`
- Modify: `client/src/features/travel/components/charts/MonthlyBurnChart.tsx:17-53`
- Modify: `client/src/features/travel/components/charts/ManagerMonthlyBurnChart.tsx:16-52`
- Modify: `client/src/features/travel/components/charts/EmployeeMonthlyBurnChart.tsx:16-52`
- Modify: `client/src/features/travel/components/charts/DepartmentComparisonChart.tsx:50-58`
- Create: `client/tests/stripe-chart-colors.test.ts`

- [x] **Step 1: Write failing test in `client/tests/stripe-chart-colors.test.ts`**

```typescript
import assert from 'node:assert/strict';
import { EXPENSE_CATEGORY_META } from '../src/features/travel/utils/travelAnalytics';
import { computeCategoryShares } from '../src/features/travel/utils/budgetAnalytics';

async function run() {
  console.log('🧪 Testing Stripe Chart Colors & Categories...');

  assert.equal(EXPENSE_CATEGORY_META.FLIGHT.color, '#533AFD', 'Flight should be Stripe Blurple #533AFD');
  assert.equal(EXPENSE_CATEGORY_META.HOTEL.color, '#635BFF', 'Hotel should be Stripe Indigo #635BFF');
  assert.equal(EXPENSE_CATEGORY_META.MEALS_PER_DIEM.color, '#FF6118', 'Meals should be Stripe Vivid Orange #FF6118');
  assert.equal(EXPENSE_CATEGORY_META.TRANSIT.color, '#00D66F', 'Transit should be Stripe Mint #00D66F');
  assert.equal(EXPENSE_CATEGORY_META.MISC.color, '#839BC8', 'Misc should be Periwinkle Slate #839BC8');

  const emptyShares = computeCategoryShares(undefined, 0);
  assert.equal(emptyShares[0].color, '#E5EDF5', 'Unspent headroom must be Ice Slate #E5EDF5');

  console.log('✅ ALL STRIPE CHART COLOR TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Chart test failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `.\server\node_modules\.bin\tsx.cmd client\tests\stripe-chart-colors.test.ts`

- [x] **Step 3: Update `travelAnalytics.ts` and `budgetAnalytics.ts`**

Update `EXPENSE_CATEGORY_META`:
```typescript
export const EXPENSE_CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; shortLabel: string; color: string }
> = {
  FLIGHT: { label: 'Airfare & Flights', shortLabel: 'Flights', color: '#533AFD' },
  HOTEL: { label: 'Accommodations', shortLabel: 'Hotel', color: '#635BFF' },
  MEALS_PER_DIEM: { label: 'Meals & Per Diem', shortLabel: 'Meals', color: '#FF6118' },
  TRANSIT: { label: 'Ground Transit', shortLabel: 'Transit', color: '#00D66F' },
  MISC: { label: 'Incidental / Misc', shortLabel: 'Misc', color: '#839BC8' },
};
```
In `budgetAnalytics.ts`, update `UNSPENT` fallback color to `#E5EDF5` and `computeBudgetHealthBadge` threshold colors (`#00D66F`, `#533AFD`, `#FF6118`).

- [x] **Step 4: Update Recharts Chart Container & Burn Charts**

In `chart.tsx`:
- Cartesian axis tick fill: `#50617A`
- Grid lines stroke: `#E5EDF5`
- Tooltip cursor stroke: `#533AFD`

In `MonthlyBurnChart.tsx`, `ManagerMonthlyBurnChart.tsx`, `EmployeeMonthlyBurnChart.tsx`:
- `approved`: `#533AFD`
- `pending`: `#7389FF`
- Legend indicators: `bg-[#533AFD]` and `bg-[#7389FF]`

In `DepartmentComparisonChart.tsx`:
- Utilization colors: `<70%` -> `bg-[#00D66F]`, `70-85%` -> `bg-[#533AFD]`, `>85%` -> `bg-[#FF6118]`

- [x] **Step 5: Run tests to verify they pass**

Run: `.\server\node_modules\.bin\tsx.cmd client\tests\stripe-chart-colors.test.ts`
Run: `.\server\node_modules\.bin\tsx.cmd client\tests\department-category-pie-chart.test.ts`
Expected: PASS

---

### Task 3: UI Primitives (Shape, Elevation, Motion, Buttons, Badges)

**Files:**
- Modify: `client/src/shared/components/ui/button.tsx`
- Modify: `client/src/shared/components/ui/card.tsx`
- Modify: `client/src/shared/components/ui/input.tsx`
- Modify: `client/src/features/auth/components/AuthField.tsx`
- Modify: `client/src/features/travel/components/TravelStatusBadge.tsx`
- Create: `client/tests/stripe-primitives.test.ts`

- [x] **Step 1: Write failing test in `client/tests/stripe-primitives.test.ts`**

```typescript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getStatusBadgeConfig } from '../src/features/travel/components/TravelStatusBadge';

async function run() {
  console.log('🧪 Testing Stripe UI Primitives...');

  const buttonPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/button.tsx');
  const buttonSource = fs.readFileSync(buttonPath, 'utf8');
  assert.ok(buttonSource.includes('#533AFD'), 'Button must use primary #533AFD');
  assert.ok(!buttonSource.includes('#8A582B'), 'Button must not use brown #8A582B');
  assert.ok(buttonSource.includes('#E5EDF5'), 'Button must use secondary #E5EDF5');
  assert.ok(buttonSource.includes('duration-200'), 'Button must use 200ms motion duration');

  const cardPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/card.tsx');
  const cardSource = fs.readFileSync(cardPath, 'utf8');
  assert.ok(cardSource.includes('#E5EDF5'), 'Card must use modern border #E5EDF5');
  assert.ok(!cardSource.includes('#E8DFD3'), 'Card must not use tan border #E8DFD3');

  const approvedBadge = getStatusBadgeConfig('APPROVED');
  assert.ok(approvedBadge.className.includes('emerald'), 'Approved badge should use emerald');
  assert.ok(approvedBadge.dotClassName.includes('emerald') || approvedBadge.dotClassName.includes('#00D66F'));

  console.log('✅ ALL STRIPE PRIMITIVES TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Primitives test failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `.\server\node_modules\.bin\tsx.cmd client\tests\stripe-primitives.test.ts`

- [x] **Step 3: Update `button.tsx` with Stripe Radii, Motion & Variants**

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#533AFD] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#533AFD] text-white hover:bg-[#4834DB] shadow-xs active:scale-[0.98]',
        primary: 'bg-[#533AFD] text-white hover:bg-[#4834DB] shadow-xs active:scale-[0.98]',
        destructive: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-xs',
        outline: 'border border-[#E5EDF5] bg-white text-[#1A2C44] hover:bg-[#F2F7FE] hover:border-[#839BC8]/40',
        secondary: 'bg-[#E5EDF5] text-[#061B31] border border-[#839BC8]/30 hover:bg-[#D6D9FC]',
        ghost: 'text-[#1A2C44] bg-transparent hover:bg-[#F2F7FE] hover:text-[#061B31]',
        link: 'text-[#533AFD] underline-offset-4 hover:underline hover:text-[#4834DB] p-0 h-auto',
      },
      size: {
        default: 'h-11 px-5 py-2 text-sm',
        sm: 'h-9 px-3.5 text-xs rounded-lg',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base font-semibold rounded-xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);
```

- [x] **Step 4: Update `card.tsx`, `input.tsx`, `AuthField.tsx`, and `TravelStatusBadge.tsx`**

- `Card`: `rounded-2xl border border-[#E5EDF5] bg-[#FFFFFF] p-6 shadow-xs`
- `CardTitle`: `text-xl font-bold tracking-tight text-[#061B31]`
- `CardDescription`: `text-sm text-[#50617A]`
- `Input`: `border border-[#E5EDF5] bg-white text-[#1A2C44] placeholder:text-[#7D8BA4] focus-visible:border-[#533AFD] focus-visible:ring-2 focus-visible:ring-[#533AFD]/20`
- `TravelStatusBadge`:
  - `APPROVED` / `SETTLED`: `border-emerald-200 bg-emerald-50 text-emerald-800` (dot: `bg-[#00D66F]`)
  - `PENDING_*`: `border-[#D6D9FC] bg-[#F2F7FE] text-[#533AFD]` (dot: `bg-[#533AFD]`)
  - `REVISION_*`: `border-orange-200 bg-orange-50 text-orange-900` (dot: `bg-[#FF6118]`)
  - `DRAFT` / `CANCELLED`: `border-slate-200 bg-slate-100 text-slate-700` (dot: `bg-[#64748D]`)

- [x] **Step 5: Run tests to verify they pass**

Run: `.\server\node_modules\.bin\tsx.cmd client\tests\stripe-primitives.test.ts`
Expected: PASS

---

### Task 4: Portals, Layouts & Residual Clean-Up

**Files:**
- Modify: `client/src/features/travel/components/TripFlowHeader.tsx`
- Modify: `client/src/features/auth/components/SignInCard.tsx`
- Modify: `client/src/features/auth/components/ForgotPasswordCard.tsx`
- Modify: `client/src/features/auth/components/ResetPasswordCard.tsx`
- Modify: `client/src/features/travel/layout/DynamicRoleSidebar.tsx`
- Create: `client/tests/stripe-residual-audit.test.ts`

- [x] **Step 1: Write test in `client/tests/stripe-residual-audit.test.ts`**

```typescript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Auditing codebase for residual hardcoded brown values...');

  const filesToCheck = [
    '../src/features/auth/components/SignInCard.tsx',
    '../src/features/auth/components/ForgotPasswordCard.tsx',
    '../src/features/travel/components/TripFlowHeader.tsx',
    '../src/features/travel/layout/DynamicRoleSidebar.tsx',
  ];

  for (const rel of filesToCheck) {
    const fullPath = path.resolve(import.meta.dirname, rel);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(!content.includes('#8A582B'), `${rel} must not contain #8A582B`);
    assert.ok(!content.includes('#754820'), `${rel} must not contain #754820`);
  }

  console.log('✅ ALL RESIDUAL AUDIT CHECKS PASSED!');
}

run().catch((err) => {
  console.error('❌ Residual audit failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Update portal files & clean up residual brown hex codes**

- Replace `#8A582B` and `#754820` with `#533AFD` and `#4834DB`.
- In `DynamicRoleSidebar.tsx`, update active state styling to `bg-[#E5EDF5] text-[#533AFD] font-semibold border-l-2 border-[#533AFD]`.

- [x] **Step 3: Run test to verify it passes**

Run: `.\server\node_modules\.bin\tsx.cmd client\tests\stripe-residual-audit.test.ts`
Expected: PASS

---

### Task 5: Production Build & Full Regression Verification

**Files:**
- Client test suite
- Client build output

- [x] **Step 1: Execute all client test suites**

Run:
```powershell
.\server\node_modules\.bin\tsx.cmd client\tests\sidebar-nav.test.ts
.\server\node_modules\.bin\tsx.cmd client\tests\department-category-pie-chart.test.ts
.\server\node_modules\.bin\tsx.cmd client\tests\admin-governance-unified.test.ts
.\server\node_modules\.bin\tsx.cmd client\tests\stripe-theme-tokens.test.ts
.\server\node_modules\.bin\tsx.cmd client\tests\stripe-chart-colors.test.ts
.\server\node_modules\.bin\tsx.cmd client\tests\stripe-primitives.test.ts
.\server\node_modules\.bin\tsx.cmd client\tests\stripe-residual-audit.test.ts
```
Expected: All 7 suites report PASS.

- [x] **Step 2: Execute Client Production Build**

Run: `npm run build --prefix client`
Expected: Production build passes with zero TypeScript or Vite errors.

- [x] **Step 3: Run Oxlint**

Run: `npm run lint --prefix client`
Expected: Zero lint errors.
