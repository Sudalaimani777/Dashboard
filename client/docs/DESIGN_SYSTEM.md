# TripFlow Stripe Design System

The visual design system, token specifications, component standards, and UX guidelines for the **TripFlow** Corporate Travel & Expense Governance platform.

---

## 🏛️ Philosophy: High-Density Corporate Workstation

TripFlow is designed for corporate compliance officers, department managers, and enterprise executives who need to audit travel itineraries, evaluate multi-proof receipts, and inspect departmental burn rates rapidly.

To deliver maximum focus and legibility, TripFlow rejects generic "AI slop" in favor of the **Stripe Design System**:
- **Zero Distracting Gradients**: Flat, purposeful surfaces instead of purple-to-blue diagonal washes.
- **Zero Floating Pastel Icon Chips**: Eliminates bloated rounded pastel boxes (`bg-amber-100 p-3 rounded-2xl`).
- **Clean Form UX**: Inputs maintain a clean, uncluttered layout by displaying validation feedback strictly when an error occurs, eliminating redundant persistent helper copy under every field.
- **Strict Tabular Alignment**: Financial figures are set in monospace numerals (`font-mono tabular-nums`) adhering to Indian numbering conventions (`₹1,48,000.00`).
- **High-Visibility Border Contrast**: Replaces washed-out dividers with high-visibility slate borders (`#CBD5E1`).
- **Semantic Color Coding**: Visual feedback (emerald for approvals, orange/rose for revisions, crimson for rejections) gives immediate clarity without visual fatigue.

---

## 🎨 Color Palette Tokens

Configured in [client/src/index.css](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/client/src/index.css) via Tailwind CSS v4 `@theme` and CSS variables:

### 1. Canvas & Surfaces
| Token Name | Hex Code | Role & Application |
| :--- | :--- | :--- |
| `--color-canvas` | `#F2F7FE` | Cool neutral global page canvas. |
| `--color-surface` | `#FFFFFF` | Primary workstation cards, modals, dropdowns, and table bodies. |
| `--color-surface-subtle` | `#F8FAFC` | Table headers, secondary panels, and sidebar navigation foundations. |
| `--bjork-surface-hover` | `#F1F5F9` | Hover surface for table rows, list items, and inactive buttons. |
| `--bjork-surface-active` | `#E2E8F0` | Active pressed surface state. |

### 2. Brand Primary & Interactive
| Token Name | Hex Code | Role & Application |
| :--- | :--- | :--- |
| `--color-primary` | `#533AFD` | Stripe Blurple: Primary brand CTA, active tabs, and focus rings. |
| `--color-primary-hover` | `#4834DB` | Deep blurple hover state for primary action buttons. |
| `--color-secondary` | `#E5EDF5` | Ice Slate: Secondary button background, subtle pill containers. |
| `--color-secondary-hover`| `#D6D9FC` | Periwinkle tint hover state for secondary actions. |
| `--color-tertiary` | `#635BFF` | Stripe Violet: Accent highlights and hotel expense category indicators. |

### 3. Typography & Inks
| Token Name | Hex Code | Role & Application |
| :--- | :--- | :--- |
| `--color-ink` | `#061B31` | Midnight Ink: Primary headings, metric figures, and active navigation text. |
| `--color-text-main` | `#1A2C44` | High-contrast body copy and table cell content. |
| `--color-muted` | `#334155` | Slate Gray: Secondary metadata, form labels, and table header text. |
| `--color-faint` | `#50617A` | Faint Slate: Captions, helper guidance, and chart tick labels. |

### 4. Borders & Dividers
| Token Name | Hex Code | Role & Application |
| :--- | :--- | :--- |
| `--color-border` | `#CBD5E1` | High-visibility slate: Primary 1px border for cards, inputs, and tables. |
| `--color-border-warm` | `#CBD5E1` | Calibrated border token matching `--color-border`. |
| `--color-border-strong` | `#94A3B8` | Strong slate: Focused dividers and emphasized column separators. |

### 5. Semantic Feedback
| Token Name | Hex Code | Role & Application |
| :--- | :--- | :--- |
| `--color-success` | `#00D66F` | Stripe Mint: Approved badges, settled claims, and healthy budget headroom. |
| `--color-warning` | `#FF6118` | Stripe Vivid Orange: Revisions requested, approaching budget limits. |
| `--color-destructive` | `#DC2626` | Crimson: Rejection badges, cancellations, and validation errors. |

---

## 🔤 Typography & Tabular Numerals

TripFlow pairs a modern geometric sans-serif for interface prose with a high-readability monospace font for all financial and numerical data:

* **Primary Interface Font**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Weights: 400, 500, 600, 700)
* **Monetary & Code Font**: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Weights: 400, 500, 600, 700)
* **Fallback Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Strict Currency Formatting Rules
All financial figures represent Indian Rupees (`INR`) and must adhere to the following standard:
```tsx
// Rule: Always pair JetBrains Mono with tabular numbers for alignment
<span className="font-mono tabular-nums text-sm font-semibold text-ink">
  ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
</span>
```

### Type Hierarchy
| Level | Font Family | Size & Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title (H1)** | Plus Jakarta Sans | `text-2xl` (24px), `font-bold` | `leading-tight` | Workstation headers |
| **Section Title (H2)** | Plus Jakarta Sans | `text-lg` (18px), `font-bold` | `leading-snug` | Card titles, portal section headers |
| **Subsection (H3)** | Plus Jakarta Sans | `text-sm` (14px), `font-semibold` | `leading-normal` | Table headers, modal titles |
| **Body Copy** | Plus Jakarta Sans | `text-sm` (14px), `font-normal` | `leading-relaxed` | Descriptions, remarks, audit notes |
| **Monetary Amounts** | JetBrains Mono | `text-sm` to `text-base`, `font-semibold` | `tabular-nums` | Expense line items, total budget meters |
| **Captions / Timestamps**| JetBrains Mono | `text-xs` (12px), `font-medium` | `tabular-nums` | Date boundaries, flight codes, timestamps |

---

## 📐 Elevation, Radii & Motion Systems

### 5 Elevation Tiers
TripFlow uses calibrated drop shadows tinted with midnight navy (`rgba(6, 27, 49, ...)`) to provide clean separation without harsh outlines:

| Token | CSS Box Shadow Definition | Usage |
| :--- | :--- | :--- |
| `--shadow-xs` | `0 1px 2px rgba(6, 27, 49, 0.04)` | Subtle buttons, segmented tab pills, badges |
| `--shadow-sm` | `0 1px 3px rgba(6, 27, 49, 0.06), 0 1px 2px rgba(6, 27, 49, 0.04)` | Workstation cards, table containers |
| `--shadow-md` | `0 4px 6px -1px rgba(6, 27, 49, 0.08), 0 2px 4px -2px rgba(6, 27, 49, 0.04)` | Dropdown menus, tooltips, popovers |
| `--shadow-lg` | `0 10px 15px -3px rgba(6, 27, 49, 0.08), 0 4px 6px -4px rgba(6, 27, 49, 0.04)` | Drawer sidebars, floating confirm bars |
| `--shadow-xl` | `0 20px 25px -5px rgba(6, 27, 49, 0.10), 0 8px 10px -6px rgba(6, 27, 49, 0.04)` | Modal dialogs, receipt preview lightboxes |

### 5 Border Radii
| Token | Value | Applied To |
| :--- | :--- | :--- |
| `--radius-xs` | `1px` | Hairline dividers, focus ring offsets |
| `--radius-sm` | `4px` | Small tags, table selection checkboxes |
| `--radius-md` | `8px` | Buttons, inputs, form selects, status badges |
| `--radius-lg` | `16px` | Primary workstation cards, modals, dialog sheets |
| `--radius-full`| `100px` | Avatar badges, segmented toggle pills, circular icons |

### Motion Tokens & Easing
All animated state changes (drawers, modal entrances, and tooltips) follow the Stripe cubic-bezier curve:
* **Timing Curve**: `--ease-stripe: cubic-bezier(0.16, 1, 0.3, 1)`
* **Durations**:
  * `--duration-100` (`100ms`): Button hover and press state transitions.
  * `--duration-200` (`200ms`): Segmented tab toggles and dropdown menus.
  * `--duration-300` (`300ms`): Modal dialog fade-ins and drawer slide-outs.
  * `--duration-500` (`500ms`): Chart progress bars and accordion reveals.

---

## 🧩 Component Standards & Primitives

### 1. Buttons (`client/src/shared/components/ui/button.tsx`)
- **Primary**: `bg-[#533AFD] hover:bg-[#4834DB] text-white shadow-xs rounded-md font-medium`
- **Secondary**: `bg-[#E5EDF5] hover:bg-[#D6D9FC] text-[#061B31] shadow-xs rounded-md`
- **Outline**: `border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#061B31] shadow-xs rounded-md`
- **Destructive**: `bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs rounded-md`
- **Sizes**:
  - `sm`: `h-8 px-3 text-xs`
  - `md`: `h-10 px-4 text-sm`
  - `lg`: `h-12 px-6 text-base`

### 2. Form Inputs (`client/src/shared/components/ui/input.tsx`)
- **Border**: High-visibility `border border-[#CBD5E1]` (never faded or washed out).
- **Focus**: `focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD] focus:outline-none`.
- **Background & Text**: Crisp `bg-white text-[#061B31] placeholder:text-[#50617A]`.
- **Clean Form Standard**: Avoid persistent helper copy beneath inputs; render error messages conditionally only when field validation fails:
  ```tsx
  {errors.title && (
    <p className="mt-1 text-xs text-[#DC2626]">{errors.title.message}</p>
  )}
  ```

### 3. Password Input (`client/src/shared/components/ui/password-input.tsx`)
- Features an accessible show/hide toggle button with `Eye` / `EyeOff` icons.
- Includes `aria-label="Show password"` / `aria-label="Hide password"`.
- `tabIndex={-1}` so keyboard tab navigation flows uninterrupted to the next field.

### 4. Cards & Containers (`client/src/shared/components/ui/card.tsx`)
- Container: `bg-white border border-[#CBD5E1] rounded-lg shadow-sm`.
- Header: `CardTitle` uses `text-[#061B31] font-bold`, while `CardDescription` uses `text-[#50617A] text-xs`.

### 5. Status Badges (`TravelStatusBadge.tsx`)
Status pills pair clear typography with high-contrast semantic borders and background tints:
- **`APPROVED` / `SETTLED`**: `bg-emerald-50 text-emerald-700 border-emerald-200` with mint dot (`#00D66F`).
- **`PENDING_MANAGER_REVIEW` / `PENDING_ADMIN_APPROVAL`**: `bg-indigo-50 text-indigo-700 border-indigo-200` with blurple dot (`#533AFD`).
- **`REVISION_REQUESTED_*`**: `bg-orange-50 text-orange-700 border-orange-200` with vivid orange dot (`#FF6118`).
- **`REJECTED` / `CANCELLED`**: `bg-rose-50 text-rose-700 border-rose-200` with crimson dot (`#DC2626`).

---

## 📊 Data Visualization & Chart Color Ramps

TripFlow's interactive charts (built with **Recharts**) adhere to strict contrast standards:

### 1. Expense Category Palette (`EXPENSE_CATEGORY_META`)
| Category | Color Token | Hex Code | Visual Identity |
| :--- | :--- | :--- | :--- |
| **`FLIGHT`** | Stripe Blurple | `#533AFD` | Corporate airfare |
| **`HOTEL`** | Stripe Indigo | `#635BFF` | Lodging and accommodation |
| **`MEALS_PER_DIEM`** | Stripe Vivid Orange | `#FF6118` | Daily food and per diem allowances |
| **`TRANSIT`** | Stripe Mint | `#00D66F` | Ground transportation, taxis, rails |
| **`MISC`** | Periwinkle Slate | `#839BC8` | Incidental and miscellaneous costs |
| **`Unspent Headroom`**| Ice Slate | `#E5EDF5` | Remaining department quarterly budget |

### 2. Chart Grid & Container Styling
- **Grid Lines**: `stroke="#E5EDF5"` (clean separation without visual noise).
- **Axis Labels / Ticks**: `fill="#50617A"` with `JetBrains Mono` font for numeric scales.
- **Tooltip Container**: `bg-white border border-[#CBD5E1] rounded-md shadow-md text-[#061B31]`.
- **Cursor Highlight**: `fill="rgba(83, 58, 253, 0.05)"` with `stroke="#533AFD"`.

### 3. Spend Velocity & Comparison Charts
- **6-Month Burn Charts**:
  - Approved Series: `#533AFD` (Stripe Blurple)
  - Pending Review Series: `#7389FF` (Light Indigo)
- **Department Headroom Comparison**:
  - Safe Utilization (<75%): `#00D66F` (Mint)
  - Alert Utilization (75%–90%): `#533AFD` (Blurple)
  - Critical / Over Budget (>90%): `#FF6118` (Vivid Orange)

---

## 🛡️ Design System Quality & Verification Checklist

When building new components or workstations for TripFlow, verify against this checklist:
- [ ] **No Legacy Tokens**: Zero brown (`#8A582B`), tan (`#E8DFD3`), or warm beige (`#FAF8F5`) colors.
- [ ] **High-Contrast Borders**: All inputs, tables, and cards use `#CBD5E1` (never washed-out `#E5EDF5` or `#E2E8F0`).
- [ ] **Tabular Numerals**: Every monetary figure in Indian Rupees is formatted with `font-mono tabular-nums` and the `₹` symbol.
- [ ] **Clean Inputs**: No persistent helper copy under every input field; render error copy only when validation fails.
- [ ] **Standard Radii**: Adheres to the 5 border radii (`--radius-xs` to `--radius-full`).
- [ ] **Standard Elevation**: Adheres to the 5 drop-shadow tiers (`--shadow-xs` to `--shadow-xl`).
- [ ] **Accessible Contrast**: Meets WCAG AA contrast standards for all text on `#F2F7FE` and `#FFFFFF`.

### Automated Verification Suites
Run the dedicated assertion test suites to verify styling integrity:
```bash
cd client
npx tsx tests/stripe-theme-tokens.test.ts
npx tsx tests/stripe-primitives.test.ts
npx tsx tests/stripe-contrast-readability.test.ts
npx tsx tests/stripe-chart-colors.test.ts
npx tsx tests/form-input-borders.test.ts
npx tsx tests/form-permanent-helper-text.test.ts
```
