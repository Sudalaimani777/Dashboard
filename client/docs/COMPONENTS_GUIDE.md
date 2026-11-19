# TripFlow Client Components Guide

This document catalogs the UI component architecture, shared design primitives, and domain-specific workstations implemented in the **TripFlow Web Client**.

---

## 🏛️ Component Architecture & Visual Philosophy

TripFlow follows the **Stripe Design System** architecture with modular feature-based encapsulation:
1. **Shared Primitives ([src/shared/components/ui/](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/client/src/shared/components/ui))**: Atomic, highly reusable design primitives powered by Tailwind CSS v4, [Radix UI](https://www.radix-ui.com/), and [class-variance-authority](https://cva.style/docs).
2. **Domain Workstations ([src/features/travel/components/](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/client/src/features/travel/components))**: Enterprise portals, review workstations, proof viewers, and audit logs.
3. **Typography & Styling**:
   - Interface text: **Plus Jakarta Sans** (weights 400, 500, 600, 700).
   - Numerical & Financial data: **JetBrains Mono** (`font-mono tabular-nums`) for currency (`INR` / `₹`), flight numbers, and dates.
   - Core Palette: Cool Canvas (`#F2F7FE`), Card Surface (`#FFFFFF`), Primary Blurple (`#533AFD`), Midnight Ink (`#061B31`), Hairline Border (`#CBD5E1`).

---

## 📂 Component Directory Layout

```
client/src/
├── shared/
│   ├── components/
│   │   ├── ErrorBoundary.tsx             # Global application error catcher
│   │   └── ui/                           # Base design primitives
│   │       ├── alert.tsx                 # Semantic status alerts (default, destructive)
│   │       ├── button.tsx                # Multi-variant button primitive
│   │       ├── card.tsx                  # Elevated surface cards & headers
│   │       ├── chart.tsx                 # Recharts wrapper & tooltip configurations
│   │       ├── input.tsx                 # Styled text input with permanent helper text
│   │       ├── label.tsx                 # Radix UI label wrapper
│   │       ├── password-input.tsx        # Password input with toggle visibility & strength
│   │       └── index.ts                  # Shared primitives barrel export
│   └── utils/
│       └── cn.ts                         # clsx + twMerge utility
├── features/
│   ├── auth/components/                  # Sign-in, recovery cards & password strength meters
│   ├── dashboard/                        # Dynamic dashboard orchestrator & avatar helpers
│   ├── travel/components/
│   │   ├── audit/                        # Decision dialogs, proof viewer, audit timeline
│   │   ├── charts/                       # Recharts analytics (monthly burn, headroom, category pie)
│   │   ├── forms/                        # Travel request creation, date pickers, country phone
│   │   ├── layout/                       # Role sidebar, nav items, user profile widget
│   │   ├── tables/                       # High-density data tables & action triggers
│   │   └── TravelStatusBadge.tsx         # Semantic status indicators
│   └── users/components/                 # User provisioning modal & directory tables
```

---

## 🧱 Core Shared Primitives (`shared/components/ui/`)

### 1. Button (`button.tsx`)

A polymorphic button component built with `class-variance-authority` and `@radix-ui/react-slot`.

```tsx
import { Button } from '@/shared/components/ui/button';

// Standard Primary Button
<Button variant="default" size="default">
  Authorize Travel
</Button>

// Secondary Button
<Button variant="secondary" size="sm">
  Download PDF
</Button>

// Destructive Action
<Button variant="destructive" size="default">
  Reject Request
</Button>
```

#### Variants & Sizes Matrix

| Prop | Option | Description |
| :--- | :--- | :--- |
| `variant` | `default` | Primary Stripe Blurple (`#533AFD`) background with subtle hover lift (`#4834DB`). |
| | `secondary` | Soft slate background (`#E5EDF5`) with midnight text (`#061B31`). |
| | `destructive` | Crimson red (`#DC2626`) for rejections and destructive workflows. |
| | `outline` | Hairline border (`#CBD5E1`) with transparent canvas background. |
| | `ghost` | Borderless button for inline table actions and icon triggers. |
| | `link` | Underlined text action with primary color styling. |
| `size` | `default` | Standard height (`h-10 px-4 py-2 text-sm`). |
| | `sm` | Compact height (`h-8 rounded-md px-3 text-xs`) for table rows. |
| | `lg` | Large height (`h-11 rounded-md px-8 text-base`) for auth cards. |
| | `icon` | Equal dimensions (`h-9 w-9`) for standalone icon buttons. |
| `asChild` | `boolean` | Passes styling down to child element (e.g. `react-router-dom` `Link`). |

---

### 2. Input & PasswordInput (`input.tsx`, `password-input.tsx`)

High-contrast form inputs designed to eliminate AI-slop reflexes (no low-contrast grey borders, no floating labels without permanent guidance).

#### Features:
* **Border Contrast**: Border color `#CBD5E1` with explicit dark border on hover `#94A3B8`.
* **Focus State**: Ring `#533AFD` with 2px offset.
* **Helper Guidance**: Always paired with permanent helper text below inputs for immediate user feedback.

```tsx
import { Input } from '@/shared/components/ui/input';
import { PasswordInput } from '@/shared/components/ui/password-input';

// Standard Text Input
<Input
  placeholder="e.g. Q4 Client Review - London"
  className="font-sans"
/>

// Password Input with show/hide toggle
<PasswordInput
  placeholder="Enter account password"
  autoComplete="current-password"
/>
```

---

### 3. Card Container (`card.tsx`)

Surface container with 5 elevation tiers (`--shadow-xs` through `--shadow-xl`) and hairline border `#CBD5E1`.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/shared/components/ui/card';

<Card className="shadow-xs border border-[#CBD5E1] bg-white">
  <CardHeader>
    <CardTitle className="text-base font-semibold text-[#061B31]">
      Budget Allocation
    </CardTitle>
    <CardDescription className="text-xs text-[#50617A]">
      Q4 FY2026 Fiscal Headroom for Product Engineering
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Metric or form elements */}
  </CardContent>
  <CardFooter className="border-t border-[#F2F7FE] bg-[#F8FAFC]">
    {/* Actions */}
  </CardFooter>
</Card>
```

---

### 4. Alert (`alert.tsx`)

Accessible alert banners for system notifications, validation errors, and policy violations.

| Variant | Border & Text | Background | Usage |
| :--- | :--- | :--- | :--- |
| `default` | Border `#CBD5E1`, Text `#061B31` | `#F8FAFC` | General announcements and audit notices. |
| `destructive` | Border `#DC2626`, Text `#9E2A2B` | `#FEF2F2` | Form errors, rejection explanations, network failures. |

---

## ✈️ Domain & Governance Components (`features/travel/`)

### 1. TravelStatusBadge (`components/TravelStatusBadge.tsx`)

Visual indicator displaying request state with semantic colors and icons.

```tsx
import { TravelStatusBadge } from '@/features/travel/components/TravelStatusBadge';

<TravelStatusBadge status="PENDING_MANAGER_REVIEW" />
<TravelStatusBadge status="APPROVED" />
<TravelStatusBadge status="SETTLED" />
```

#### Status Token Mappings

| Status | Text & Border | Background | Icon | Label |
| :--- | :--- | :--- | :--- | :--- |
| `DRAFT` | `#50617A` | `#F1F5F9` | `FileEdit` | Draft |
| `PENDING_MANAGER_REVIEW` | `#8A582B` | `#FFFBEB` | `Clock` | Pending Manager Review |
| `REVISION_REQUESTED_BY_MANAGER` | `#D97706` | `#FEF3C7` | `AlertTriangle` | Revision (Manager) |
| `PENDING_ADMIN_APPROVAL` | `#533AFD` | `#EEF2FF` | `ShieldAlert` | Pending Admin Approval |
| `REVISION_REQUESTED_BY_ADMIN_TO_MANAGER` | `#B45309` | `#FEF3C7` | `CornerDownLeft` | Revision (Admin $\rightarrow$ Mgr) |
| `REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE` | `#B45309` | `#FEF3C7` | `CornerDownRight` | Revision (Admin $\rightarrow$ Emp) |
| `APPROVED` | `#00A857` | `#ECFDF5` | `CheckCircle2` | Approved (Cleared) |
| `SETTLED` | `#059669` | `#ECFDF5` | `Receipt` | Settled (Disbursed) |
| `REJECTED` | `#DC2626` | `#FEF2F2` | `XCircle` | Rejected |
| `CANCELLED` | `#64748B` | `#F8FAFC` | `Ban` | Cancelled |

---

### 2. ProofInspectorViewer (`components/audit/ProofInspectorViewer.tsx`)

Multi-proof document inspection modal for attached receipts, flight quotations, and hotel vouchers.

#### Key Capabilities:
- **Cloudinary Image Zoom**: Interactive lightbox preview for image receipts (`.png`, `.jpg`, `.webp`).
- **PDF & Document Linkouts**: Embedded link triggers to view or download external PDF quotes in a secure new tab.
- **Metadata Inspection**: Displays file name, upload timestamp, and file size.

---

### 3. AuditTimelineLog (`components/audit/AuditTimelineLog.tsx`)

Immutable chronological audit ledger rendering state changes and reviewer comments.

```tsx
import { AuditTimelineLog } from '@/features/travel/components/audit/AuditTimelineLog';

<AuditTimelineLog events={selectedRequest.timeline} />
```

#### Render Details:
- Vertical timeline line with status-colored checkpoint nodes.
- Actor identification: Name, role badge (`EMPLOYEE`, `MANAGER`, `ADMIN`), and relative timestamp.
- Remarks Callout: Reviewer notes and structured rejection/revision instructions.

---

### 4. PhoneInputWithCountry (`components/forms/PhoneInputWithCountry.tsx`)

International phone number input with country code picker and format validation.

#### Features:
- Searchable country dropdown with flag icons and international dialing prefixes (e.g. `+91` India, `+1` US, `+44` UK).
- Enforces numeric-only local phone digits.
- Conforms to international E.164 dial standards.

---

### 5. TravelMetricsGrid (`components/shared/TravelMetricsGrid.tsx`)

High-density KPI card grid displaying operational metrics across dashboards.

```tsx
<TravelMetricsGrid
  items={[
    { label: 'Active Submissions', value: '4', change: '+2 this month', icon: Plane },
    { label: 'Cleared for Booking', value: '₹2,45,000.00', icon: CheckCircle2 },
    { label: 'Awaiting Settlement', value: '₹34,800.00', icon: Clock }
  ]}
/>
```

* Financial metrics strictly formatted with `font-mono tabular-nums` via `formatINR()`.

---

### 6. Interactive Analytics Charts (`components/charts/`)

Integrated with [Recharts](https://recharts.org/) using custom tooltip overlays and Stripe color palettes:
* **`DepartmentCategoryPieChart`**: Expense category distribution (`FLIGHT`, `HOTEL`, `MEALS_PER_DIEM`, `TRANSIT`, `MISC`).
* **`EmployeeMonthlyBurnChart`**: Month-over-month travel expenditure trends.
* **`HeadroomRadialGauge`**: Department fiscal headroom against allocation limits.

---

## ♿ Accessibility & Formatting Invariants

1. **Indian Rupee Standard**: All financial values must be rendered via `formatINR()` or `formatINRCompact()` with monospace tabular digits (`font-mono tabular-nums`).
2. **Keyboard Navigation**: All interactive modal viewers, dropdowns, and tabs support standard keyboard triggers (`Escape`, `Tab`, `ArrowKeys`).
3. **Contrast Compliance**: Minimum contrast ratio of 4.5:1 for body copy and 3:1 for interactive borders.
