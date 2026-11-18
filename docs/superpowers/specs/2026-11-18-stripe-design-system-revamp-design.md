# Stripe-Inspired Design System Revamp — Comprehensive Technical Design Specification

- **Date:** 2026-11-18
- **Author:** Antigravity & Engineering Team
- **Status:** Approved / In Implementation
- **Branch:** `feature/stripe-design-system-revamp`
- **Topic:** Complete Design System Specification adopting the Stripe Brand Guidelines (Colour, Neutrals, Full Palette, Typography, Type Scale, Spacing, Shape, Elevation, Iconography, Motion, Accessibility, and Usage Rules)

---

## 1. Executive Summary & Intent

This document formalizes the complete visual and technical specification for modernizing **TripFlow** (Corporate Travel & Expense Governance Platform). It translates the 13 chapters of the **Stripe Brand Guidelines** (extracted via `designlang` from `stripe.com`) directly into our React 19 + Tailwind CSS v4 codebase.

---

## 2. Colour System & The 29-Token Palette (PDF Chapter 03)

### 2.1 Core Identity Tokens
- **Primary:** `#533AFD` (RGB 83, 58, 253 · HSL 248°, 98%, 61%) — Signature Stripe Blurple. Reserved exclusively for primary CTAs, active status tabs, and key navigational anchors.
- **Secondary:** `#E5EDF5` (RGB 229, 237, 245 · HSL 210°, 44%, 93%) — Ice Slate. High-contrast secondary button fills, subtle tag backgrounds, and active filter pill containers.
- **Accent:** `#FFE0D1` (RGB 255, 224, 209 · HSL 20°, 100%, 91%) — Soft Coral Tint. Highlighting alerts, revision notices, and secondary callouts.

### 2.2 The 7 Primary Neutrals
- `#000000`: Deep absolute pitch black (code tokens / terminal borders).
- `#101010`: Deep dark ink (high-emphasis titles and headers).
- `#50617A`: Slate 600 (body copy secondary, form labels, chart axis ticks).
- `#64748D`: Slate 500 (table headers, muted metadata, breadcrumbs).
- `#7D8BA4`: Slate 400 (placeholders, disabled icons, inactive track fills).
- `#FFFFFF`: Pure white (card surfaces, modal backgrounds, input fields).
- `#F2F7FE`: Cool canvas background (global application background).

### 2.3 Complete 29-Token Audit & Functional Mapping
From Page 6 of the PDF, all 29 colors are mapped to explicit functional roles:

```
[Row 1]
#000000  -> Deep Base Black (Terminal / Strict Ink)
#533AFD  -> Stripe Primary Blurple (Primary CTAs, Active States)
#50617A  -> Slate Neutral 600 (Chart Ticks, Subtitle Text)
#061B31  -> Midnight Navy Ink (Primary Typography, Metric Numbers)
#FFFFFF  -> Pure White Surface (Cards, Dropdowns, Modals)

[Row 2]
#64748D  -> Slate Neutral 500 (Table Headers, Meta Info)
#0000EE  -> Standard Web Link Blue (External Documentation Links)
#E5EDF5  -> Stripe Ice Slate (Secondary Actions, Card Outlines)
#7F7DFC  -> Lavender Accent (Focus Halos, Tertiary Badges)
#3C4F69  -> Dark Slate (Secondary Headings, Modal Labels)

[Row 3]
#273951  -> Slate Navy (Card Headers, Form Group Titles)
#7389FF  -> Light Indigo (Chart Pending Burn Series, Soft Hover)
#1A2C44  -> Deep Slate Navy (Primary Table Cell Text, Form Labels)
#FF6118  -> Stripe Vivid Orange (Warnings, Budget >85%, Revisions)
#B9B9F9  -> Soft Lavender (Selected Row Highlight, Badge Hover)

[Row 4]
#7D8BA4  -> Pale Slate (Input Placeholders, Inactive Icons)
#D6D9FC  -> Soft Periwinkle (Input Focus Ring, Subtle Pill Fill)
#839BC8  -> Periwinkle Slate (Misc Expense Category, Grid Lines)
#101010  -> Deep Ink
#A3B5D6  -> Pale Blue Slate (Muted Chart Segments, Dividers)

[Row 5]
#81B81A  -> Stripe Lime (Secondary Positive Metrics, Safe Status)
#000EFF  -> Electric Blue (Hover Links, Active Chart Dot)
#2D2564  -> Deep Violet (Executive Metric Headers)
#FFE0D1  -> Soft Peach Accent (Revision Alert Banners)
#635BFF  -> Stripe Violet-Blue (Hotel Category, Primary Metric Fill)

[Row 6]
#00D66F  -> Stripe Mint Green (Approved / Settled Status, Surplus)
#4834DB  -> Deep Blurple (Primary Button Hover & Active Pressed)
#182659  -> Deep Midnight Blue (Sidebar Dark Variant)
```

---

## 3. Typography & Type Scale (PDF Chapter 04)

### 3.1 Families & Weights
- **Display & Headings:** `Plus Jakarta Sans` / `sohne-var` (Weights: `500 Medium`, `600 SemiBold`, `700 Bold`)
- **Body & Forms:** `Plus Jakarta Sans` / `Inter` (Weights: `300 Light`, `400 Regular`, `500 Medium`)
- **Mono:** `JetBrains Mono` (Weights: `400 Regular`, `500 Medium`) for currency amounts, ledger transaction IDs, and receipt metadata.

### 3.2 Exact Type Scale (14 Sizes from PDF Page 8)
- **`t00` (56px / `text-5xl`):** Hero headline, big display numbers.
- **`t01` (48px / `text-4xl`):** Main marketing / top portal titles.
- **`t02` (32px / `text-3xl`):** Primary portal page headers (e.g., *"Admin Governance Portal"*).
- **`t03` (26px / `text-2xl`):** Section headers, metric card numbers.
- **`t04` (22px / `text-xl`):** Card titles, modal headers.
- **`t05` (20px / `text-lg`):** Sub-card headers, prominent alert titles.
- **`t06` (18px / `text-base`):** Strong callouts, table highlight titles.
- **`t07` (16px / `text-base`):** Default body copy, primary inputs, buttons (`h-11`).
- **`t08` (14px / `text-sm`):** Secondary buttons, form labels, table cells, chart tooltips.
- **`t09` (12px / `text-xs`):** Status badges, helper text, timestamps, chart axis ticks.

---

## 4. Spacing Scale & Rhythm (PDF Chapter 05)

- **Base Unit:** `2px` (All layout margins, paddings, and gaps snap to exact 2px multiples).
- **Captured Scale Steps:**
  - `1px`: Border stroke widths and subtle hairline dividers.
  - `2px` / `4px` / `8px`: Micro-spacing (badge padding, icon-to-label gaps, checkbox margins).
  - `12px` / `16px`: Form field vertical padding, small card gap.
  - `20px` / `24px`: Standard card padding, modal content padding.
  - `28px` / `32px`: Grid column gaps, table section vertical margins.
  - `40px` / `48px`: Portal header margins, hero metric row spacing.
  - `52px` / `60px` / `64px` / `72px` / `80px`: Major page layout gutters and dashboard section separations.

---

## 5. Shape, Border Radii & Elevation (PDF Chapter 06)

### 5.1 Border Radii
- **`1px` (`rounded-[1px]`):** Strict data table borders, hairline progress bar notches.
- **`4px` (`rounded`):** Form checkboxes, inner chart bars, code snippets, micro-tags.
- **`8px` (`rounded-lg`):** Table rows, input fields, small buttons (`size="sm"`), tooltips.
- **`16px` (`rounded-2xl`):** Default card containers, metric summary tiles, modals, primary buttons (`size="default"` / `size="lg"`).
- **`100px` (`rounded-full`):** Status badges, user avatar circles, pill filter tabs, dot indicators.

### 5.2 Elevation Tiers (5 Shadow Levels)
- **`xs`:** `0 1px 2px rgba(6, 27, 49, 0.04)` — Table rows, subtle button outlines.
- **`sm`:** `0 1px 3px rgba(6, 27, 49, 0.06), 0 1px 2px rgba(6, 27, 49, 0.04)` — Standard cards, input hover state.
- **`md`:** `0 4px 6px -1px rgba(6, 27, 49, 0.08), 0 2px 4px -2px rgba(6, 27, 49, 0.04)` — Dropdown menus, popovers, active card hover.
- **`lg`:** `0 10px 15px -3px rgba(6, 27, 49, 0.08), 0 4px 6px -4px rgba(6, 27, 49, 0.04)` — Flyout drawers, sticky table headers.
- **`xl`:** `0 20px 25px -5px rgba(6, 27, 49, 0.10), 0 8px 10px -6px rgba(6, 27, 49, 0.04)` — Modal dialogs (`ResubmitRequestModal`, `UserFormModal`).

---

## 6. Iconography (PDF Chapter 07)

- **Library:** Lucide React (stroke width: `1.75px` to `2.0px`, optical size `16px` to `20px`).
- **Color Mapping:**
  - Active / Navigated: `#533AFD`
  - Inactive / Muted: `#50617A`
  - Disabled / Placeholder: `#7D8BA4`
  - Success Action: `#00D66F`
  - Destructive / Delete: `#DC2626`
- **Container Radii:** Embedded icons sit in `rounded-lg` or `rounded-full` containers with `#E5EDF5` or `rgba(83, 58, 253, 0.08)` soft backgrounds.

---

## 7. Motion & Transitions (PDF Chapter 08)

### 7.1 Durations (5 Tiers from PDF Page 12)
- **`100ms`:** Instant feedback (button press, checkbox toggle, dropdown click).
- **`200ms`:** Hover transitions, focus ring transitions, icon micro-rotations.
- **`300ms`:** Accordion collapse/expand, tab switching, toast banner entry/exit.
- **`500ms`:** Modal scale-in/backdrop fade, sidebar sliding drawer.
- **`800ms`:** Analytical chart bar/pie drawing, progress bar smooth animations.

### 7.2 Easings
- **Default Transition:** `cubic-bezier(0.16, 1, 0.3, 1)` (Stripe snappy ease-out — responsive and crisp).
- **Hover / Micro:** `ease-out` (150ms-200ms).
- **Modal Entry:** `cubic-bezier(0.16, 1, 0.3, 1)` with subtle scale (`scale(0.98)` to `scale(1)`).

---

## 8. Data Visualizations & Recharts Color System

### 8.1 6-Month Spend Burn Charts (`MonthlyBurnChart`, `ManagerMonthlyBurnChart`, `EmployeeMonthlyBurnChart`)
- **Approved Spend Series:** `#533AFD` (Stripe Blurple)
- **Pending Spend Series:** `#7389FF` (Light Indigo)
- **Axis & Ticks:** `#50617A` (Slate 600)
- **Grid Lines:** `#E5EDF5` (Ice Slate)
- **Tooltip Container:** Surface `#FFFFFF`, border `#E5EDF5`, drop shadow with text `#061B31`.

### 8.2 Expense Category Share Pie Charts (`DepartmentCategoryPieChart`, `EmployeeCategoryPieChart`, `ManagerCategoryPieChart`)
- `FLIGHT`: **`#533AFD`** (Stripe Blurple)
- `HOTEL`: **`#635BFF`** (Stripe Indigo)
- `MEALS_PER_DIEM`: **`#FF6118`** (Stripe Vivid Coral / Orange)
- `TRANSIT`: **`#00D66F`** (Stripe Mint Green)
- `MISC`: **`#839BC8`** (Periwinkle Slate)
- `UNSPENT`: **`#E5EDF5`** (Ice Slate)

### 8.3 Department Budget Comparison & Budget Rails
- Utilization < 70% (Safe): `bg-[#00D66F]`
- Utilization 70%–85% (Alert): `bg-[#533AFD]`
- Utilization > 85% (Critical): `bg-[#FF6118]`

---

## 9. Accessibility & WCAG Constraints (PDF Chapter 11 & 13)

- **Strict Rule from Stripe Spec:** *"When a colour pair fails WCAG, fix the colour — not the contrast check."*
- **Elimination of Failing Pairs:** The PDF notes `#FFFFFF` on `#E3ECF7` fails contrast (1.19:1). In TripFlow, all text on `#E5EDF5` secondary surfaces uses dark ink **`#061B31`** or **`#1A2C44`**, guaranteeing an **AAA contrast ratio of > 11:1**.
- **Interactive Focus Rings:** Every interactive button and field enforces `focus-visible:ring-2 focus-visible:ring-[#533AFD] focus-visible:ring-offset-2`.

---

## 10. Usage Guidelines (PDF Chapter 13)

1. **Lead with the primary:** `#533AFD` belongs strictly on calls-to-action and one accent moment per screen. Never on long body copy.
2. **Two type families, three weights:** Headlines and body use `Plus Jakarta Sans` across weights 300, 400, and 500.
3. **Snap to the spacing scale:** Every margin, padding, and gap lands on the base-2px scale.
4. **Treat accessibility as a hard constraint:** Never use light text on light backgrounds.
