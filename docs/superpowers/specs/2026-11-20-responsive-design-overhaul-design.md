# TripFlow Responsive Design Overhaul — Technical Design Specification

- **Date:** 2026-11-20
- **Status:** Draft (Spec Review)
- **Branch:** `feat/responsive-design-overhaul`
- **Scope:** Complete mobile (`< 640px`) and tablet (`640px – 1023px`) responsive overhaul across the TripFlow React 19 client application, while preserving desktop excellence (`>= 1024px`).

---

## 1. Executive Summary & Problem Statement

### 1.1 Context
TripFlow is an enterprise travel request, manager audit, and budget governance application built with React 19, Vite, and Tailwind CSS v4. While the desktop experience (`>= 1024px`) is mature and robust, an audit of client files identified critical layout breakages, viewport clipping, and touch usability failures on mobile and portrait tablet viewports:

1. **Persistent Desktop Sidebar:** `DashboardLayout.tsx` permanently indents the main content by `76px` or `256px` regardless of screen size. On a 360px mobile viewport, the fixed sidebar consumes up to 71% of available screen width, crushing the main view into an unusable 230px column without a mobile hamburger or overlay drawer.
2. **Fixed-Width Overflows:** Multiple components use hardcoded pixel/rem widths (e.g. `w-87.5` = 350px in `DepartmentBudgetsPage.tsx`, `w-64` = 256px in `ManagerQueuePortal.tsx`, `w-72` in `PhoneInputWithCountry.tsx`), causing severe horizontal page blowouts on small screens.
3. **Hardcoded 12-Column Grid in Modals:** `ResubmitRequestModal.tsx` hardcodes `grid-cols-12` across all breakpoints, compressing category dropdowns to ~60px and rendering form controls unreadable on mobile.
4. **Non-Wrapping Horizontal Flex Rows:** Action alert banners in `TravelDetailPage.tsx` and button clusters in `NewTravelRequestPage.tsx` use non-wrapping flex rows, causing text and buttons to collide or overflow screen edges.
5. **Data Tables Missing Mobile Fallbacks:** Unlike `TravelRequestsTable.tsx` (which has a card stack fallback), `AdminUsersPage.tsx` and `DepartmentBudgetsPage.tsx` only render raw 7-column desktop `<table>` elements wrapped in `overflow-x-auto`, requiring horizontal panning across the entire device screen.

### 1.2 Target Objectives
- **Zero Horizontal Overflow:** Eliminate horizontal scrollbars on mobile devices (`320px` to `428px`).
- **Unified Adaptive Shell:** Introduce a sticky mobile top header on `<lg` with a slide-over navigation drawer, frosted backdrop overlay, and dedicated Sign Out button, while preserving the pinned/hover desktop rail on `>=lg`.
- **Responsive Data Views:** Transform wide administrative and budget tables into touch-friendly card stacks on mobile (`md:hidden`) alongside desktop tables (`hidden md:block`).
- **Fluid Form Controls:** Convert rigid grids in modals and forms to responsive stacking (`grid-cols-1 sm:grid-cols-12`), apply viewport bounds to popovers, and make button bars full-width accessible on mobile.
- **Strict TDD & Performance:** Execute all changes via Test-Driven Development (TDD) using standard assertions in `client/tests/` and adhere to Vercel React Best Practices (no waterfalls, memoized derivations, zero hydration flickers).

---

## 2. Architectural Design

```
+-------------------------------------------------------------------------+
|                              VIEWPORTS                                  |
|  Mobile (< 640px)    |    Tablet (640px - 1023px)    |  Desktop (>= 1024px) |
+----------------------+-------------------------------+------------------+
| Sticky Mobile Header | Sticky Mobile Header          | Hidden (lg:hidden)|
| (h-14, TF, Title,    | (h-14, TF, Title,             |                  |
|  Notifs, Hamburger)  |  Notifs, Hamburger)           |                  |
+----------------------+-------------------------------+------------------+
| DynamicRoleSidebar   | DynamicRoleSidebar            | DynamicRoleSidebar|
| (Slide-over Drawer,  | (Slide-over Drawer,           | (Fixed Rail:     |
|  w-[280px], Overlay, |  w-[280px], Overlay,          |  76px hover or   |
|  Exit Close button)  |  Exit Close button)           |  256px pinned)   |
+----------------------+-------------------------------+------------------+
| Main Content:        | Main Content:                 | Main Content:    |
| pl-0 px-4 py-4 pt-16 | pl-0 px-6 py-5 pt-16          | pl-[76px|256px]  |
| 100% fluid width     | 100% fluid width              | px-6 py-5        |
+----------------------+-------------------------------+------------------+
```

---

## 3. Detailed Component Specifications

### 3.1 Responsive Navigation Shell

#### File: `client/src/features/travel/layout/DashboardLayout.tsx`
* **Mobile Header (`lg:hidden`):**
  * Sticky `top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border-warm bg-surface/90 px-4 backdrop-blur-md`.
  * **Left:** Hamburger button with touch target `>= 44px` (`size-10 flex items-center justify-center rounded-lg border border-border-warm bg-surface`) displaying `Menu` icon + TF logo monogram (`TF`).
  * **Center:** Truncated active workspace title (computed from active route / tab, e.g. "My Travel Workspace", "Team Approvals", "Travel Governance").
  * **Right:** Action cluster:
    * Notification button with active unread pill badge (navigates to `?tab=notifications`).
    * User initials avatar circle (`size-8 bg-primary text-white`).
* **Drawer State Management:**
  * `const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)`
  * Automatically closes on route changes (`useEffect` watching `location.pathname`, `location.search`).
  * Automatically closes when any navigation item or quick action is clicked.
  * Closes on `Escape` keypress and on overlay backdrop tap.
  * Disables body scroll when drawer is open (`overflow-hidden` on document body).
* **Main Area Padding:**
  * Replaces rigid `pl-[256px] | pl-[76px]` with:
    ```tsx
    className={`flex-1 overflow-y-auto min-w-0 transition-all duration-300 ${
      // On mobile (<lg): zero left padding, top padding to clear 56px sticky header
      // On desktop (>=lg): dynamic left rail padding
      'pt-16 lg:pt-0 ' + (isPinned ? 'lg:pl-[256px]' : 'lg:pl-[76px]')
    }`}
    ```

#### File: `client/src/features/travel/layout/DynamicRoleSidebar.tsx`
* **Dual-Mode Shell:**
  * **Desktop (`hidden lg:flex`):** Retains current `fixed inset-y-0 left-0 z-40 bg-surface border-r border-border-warm shadow-xs flex flex-col p-3.5 transition-all duration-300 ${isExpanded ? 'w-[256px]' : 'w-[76px]'}`.
  * **Mobile Drawer (`lg:hidden`):**
    * Backdrop: `fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs transition-opacity` rendered conditionally or with Motion when `isMobileDrawerOpen` is true.
    * Drawer Panel: `fixed inset-y-0 left-0 z-50 flex h-full w-[280px] max-w-[85vw] flex-col bg-surface p-4 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`.
    * Header includes brand monogram, workspace subtitle, and an explicit `X` close button (`size-9` touch target).
    * Quick Action CTA button (`New Request` / `Add Member`) rendered at full width.
    * Navigation items list renders all role links with full labels and badge counts.
* **Sign Out Visibility (`SidebarUserProfile.tsx`):**
  * When rendered in mobile drawer mode (or when `isDrawerMode={true}`), the Sign Out button is **always visible** with an accessible label and icon.

---

### 3.2 Responsive Tables & Admin Ledgers

#### File: `client/src/features/users/pages/AdminUsersPage.tsx`
* **Dual View Architecture:**
  * `md:hidden`: Mobile Card Stack
  * `hidden md:block`: Desktop Tabular View (current 7 columns preserved)
* **Mobile Card Stack Component:**
  * Container: `divide-y divide-border-warm rounded-xl border border-border-warm bg-surface overflow-hidden shadow-xs`.
  * Each user card contains:
    1. **Header Row:** Member name + "You" badge (if current actor) + Role badge (`ADMIN`, `MANAGER`, `EMPLOYEE`).
    2. **Sub-row:** Email address + Status pill (`Active` / `Deactivated`).
    3. **Details Grid (`grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-lg bg-surface-subtle border border-border-warm/60`):**
       - Department: name
       - Reporting: Supervisor name or "Executive Lead"
    4. **Action Footer:** Added date on left, action buttons on right:
       - `Edit` button: triggers `setEditingUser(member)` with min 40px touch height.
       - `Deactivate` / `Reactivate` lifecycle button: triggers confirmation dialog.
* **Filter Toolbar:**
  * Wrap role filter button group in `overflow-x-auto pb-1 scrollbar-none` to prevent horizontal clipping.
  * Update search bar input to `w-full sm:max-w-md`.

#### File: `client/src/features/travel/pages/DepartmentBudgetsPage.tsx`
* **Search Input Fluidity:**
  * Line 648: Replace fixed `h-8 pl-8 pr-3 w-87.5` with `h-8 pl-8 pr-3 w-full sm:w-72 md:w-80`.
* **Dual View Architecture for Corporate Ledger (Row 4):**
  * `md:hidden`: Mobile Pool Card Stack
  * `hidden md:block`: Desktop Tabular View (current 7 columns preserved)
* **Mobile Pool Card Component:**
  * Department name + Period pill (e.g. `Q4 2026`).
  * Financial metrics grid (`grid grid-cols-2 gap-2 text-xs`):
    - Total Allocation: `formatINR(row.totalAllocation)`
    - Utilized Spend: `formatINR(row.utilizedAmount)`
    - Available Headroom: color-coded (`text-destructive`, `text-amber-700`, or `text-[#3F624D]`)
  * Progress Bar: Dual-segment utilization bar with percentage label.
  * Action: "Adjust Allocation" button opening the allocation upsert drawer.

---

### 3.3 Forms, Popovers, Modals & Action Bars

#### File: `client/src/features/travel/components/ResubmitRequestModal.tsx`
* **Responsive Row Grid:**
  * Replace line 224's `grid grid-cols-12 gap-2 items-center` with:
    ```tsx
    grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-2 items-start sm:items-center bg-surface-subtle p-3 sm:p-2 rounded-lg border border-border-warm text-xs
    ```
  * Category dropdown: `w-full sm:col-span-3` with `<label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Category</label>`.
  * Merchant input: `w-full sm:col-span-4` with `<label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Merchant</label>`.
  * Amount input: `w-full sm:col-span-4` with `<label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Amount (₹)</label>`.
  * Trash button: `flex justify-end sm:col-span-1 sm:justify-center pt-1 sm:pt-0`.
* **Modal Viewport Clamping:**
  * Update container: `relative bg-surface rounded-xl border border-border-warm w-[calc(100%-2rem)] max-w-xl mx-auto my-auto p-4 sm:p-6 max-h-[85dvh] overflow-y-auto flex flex-col gap-4 shadow-xl z-10`.

#### File: `client/src/features/travel/components/forms/TravelTypeToggle.tsx`
* Update outer container from `flex w-full ... gap-1.5` to:
  ```tsx
  flex flex-col sm:flex-row w-full bg-surface-subtle p-1 rounded-lg border border-border-warm gap-1.5
  ```
* Buttons retain `flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-md text-xs font-semibold`.

#### File: `client/src/features/travel/components/forms/PhoneInputWithCountry.tsx`
* Line 174: Add viewport boundary safety to the country dropdown popover:
  ```tsx
  className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] right-0 sm:right-auto bg-surface rounded-xl border border-border-warm shadow-xl z-50 flex flex-col overflow-hidden"
  ```

#### File: `client/src/features/travel/components/ManagerQueuePortal.tsx`
* Line 275: Replace `w-64 sm:w-72 md:w-80` with `w-full sm:w-72 md:w-80`.

#### File: `client/src/features/travel/pages/TravelDetailPage.tsx`
* Lines 258–315 (Action Banners):
  * **Saved Travel Draft Banner:**
    * Outer: `bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs`.
    * Button group: `flex flex-wrap items-center gap-2 w-full sm:w-auto`.
  * **Employee Revision Required Banner:**
    * Outer: `bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs`.
    * Action button: `w-full sm:w-auto justify-center`.
* Top Metadata Header:
  * Dates and duration pill wrapped in `w-full sm:w-auto` to prevent squeezing against title on `<sm`.

#### File: `client/src/features/travel/pages/NewTravelRequestPage.tsx` & `ResubmitTravelRequestPage.tsx`
* Bottom Action Cluster:
  * Form footer buttons:
    ```tsx
    flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border-warm
    ```
  * Primary submit and draft buttons occupy `w-full sm:w-auto` for accessible mobile tapping.

#### File: `client/src/features/travel/components/forms/ProofAttachmentField.tsx`
* Document item row:
  * Update from `flex items-center justify-between` to:
    ```tsx
    flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-surface-subtle/70 border border-border-warm
    ```
  * Action buttons (`Preview`, `Download`, `Remove`): `flex items-center gap-1.5 self-end sm:self-auto shrink-0`.

---

## 4. Performance & Best Practices (Vercel Guidelines)

1. **Re-render Optimization (`rerender-`):**
   * Mobile card stacks directly consume memoized filter outputs (`filteredUsers`, `filteredPoolRows`) without creating redundant `.filter()` or `.map()` passes (`js-combine-iterations`).
   * Drawer toggle functions use functional state setters (`setIsMobileDrawerOpen((prev) => !prev)`) to maintain stable references (`rerender-functional-setstate`).
2. **Hydration & Layout Stability:**
   * Dynamic classes use standard Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`) instead of JS-evaluated window width checks where possible, preventing layout shift (CLS) during client hydration.
   * Drawer mounting handles conditional backdrop transitions cleanly via Motion or CSS opacity.
3. **Touch Targets & Accessibility (WCAG 2.2 AA):**
   * All mobile interactive elements (hamburger, drawer links, card action buttons, cancel/submit buttons) guarantee a minimum touch target size of 40px–44px with clear focus-visible rings.

---

## 5. Test-Driven Development (TDD) Plan

### 5.1 Test Execution Harness
All client tests run via Node with TypeScript support:
```bash
node .\server\node_modules\tsx\dist\cli.mjs client\tests\<test-file>.test.ts
```

### 5.2 Test Specifications to Author First (RED Phase)

1. **`client/tests/responsive-shell.test.ts`:**
   * Assert `DashboardLayout` renders mobile top bar with `TF` brand, hamburger trigger, and active tab title on `<lg`.
   * Assert drawer opens when hamburger is toggled and closes on backdrop click.
   * Assert `DashboardLayout` applies `pt-16` and zero left margin/padding on mobile viewports.
   * Assert `SidebarUserProfile` renders the Sign Out button in drawer mode.

2. **`client/tests/responsive-tables.test.ts`:**
   * Assert `AdminUsersPage` outputs an `md:hidden` mobile card stack containing user name, email, role badge, status pill, and Edit/Deactivate buttons.
   * Assert `DepartmentBudgetsPage` outputs an `md:hidden` card stack for department pools and verifies pool search input lacks `w-87.5`.

3. **`client/tests/responsive-forms-modals.test.ts`:**
   * Assert `ResubmitRequestModal` expense items use `grid-cols-1 sm:grid-cols-12`.
   * Assert `TravelTypeToggle` applies `flex-col sm:flex-row`.
   * Assert `PhoneInputWithCountry` popover includes `max-w-[calc(100vw-2rem)]`.
   * Assert `TravelDetailPage` alert banners apply `flex-col sm:flex-row`.

### 5.3 Verification Checklist
- [ ] All unit tests pass (`node .\server\node_modules\tsx\dist\cli.mjs client/tests/<test>.test.ts`)
- [ ] TypeScript compiler checks pass cleanly (`tsc -b` via `npm --prefix client run build`)
- [ ] Production bundle compiles with zero syntax/asset errors
- [ ] Linter checks pass (`npm --prefix client run lint`)
- [ ] No regression on existing suite (`client/tests/sidebar-nav.test.ts`, `users-schema-admin.test.ts`, etc.)
