# Dynamic Role Sidebar & Dedicated Full-Page Workstations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Dynamic Role-Governed Sidebar, replace modals/drawers with dedicated full-page workstations (`/travel/new`, `/travel/audit/:id`, `/travel/clearance/:id`), and decompose all monolithic components into granular, single-responsibility units (<100–120 lines each) adhering to `/react-best-practices`.

**Architecture:** A persistent `<DashboardLayout />` wraps all application views with the `<DynamicRoleSidebar />` and top `<TripFlowHeader />`. React Router manages deep-linkable URLs for creation, manager audit, and admin clearance. Large forms, proof viewers, and decision cards are broken down into atomic subcomponents and dedicated hooks.

**Tech Stack:** React 19, TypeScript, React Router v7, Vite, Tailwind CSS v4, `react-hook-form`, `zod`, `@hookform/resolvers/zod`, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-11-11-dynamic-sidebar-and-full-pages-design.md`

---

## Global Constraints

- **Strict Component File Size Limit**: All component files must be under 120 lines; complex form state must be extracted into custom hooks.
- **No Modals/Drawers for Core Flows**: Submissions, manager reviews, and admin clearances must use full-page routes (`/travel/new`, `/travel/audit/:id`, `/travel/clearance/:id`).
- **Role Invariant**: Sidebar links are strictly determined by database `user.role` (`EMPLOYEE`, `MANAGER`, `ADMIN`).
- **Manager Re-verification Invariant**: Resubmissions strictly transition to `PENDING_MANAGER_REVIEW`.
- **Currency Standard**: Indian Rupees (`₹`) with `font-mono tabular-nums`.
- **Zero Circular Status Dots (`●`)**: Typographic badges only.
- **Warm Storycraft Design**: Canvas `#F7F4EE`, Ink `#2B231D`, Accent `#8A582B`, Border `#E8DFD3`.

---

## Review Focus

1. **Active Route & Tab Sync**: Ensure sidebar links correctly highlight based on the current URL and role tabs.
2. **Back Navigation & State Preservation**: Ensure back navigation from `/travel/new` or `/travel/audit/:id` cleanly preserves dashboard state without re-fetching loops.
3. **Deep-linking Authorization**: Direct URL access to `/travel/audit/:id` by an `EMPLOYEE` must be rejected or redirected with a 403 / permission error.
4. **Live Dynamic Itemized Summation**: Modifying expense row amounts in `/travel/new` updates the total in INR without float precision drift.
5. **Clean Zero-Error Compilation**: Ensure `npm --prefix client run build` compiles with 0 TypeScript/Vite errors.

---

### Task 1: Persistent Dashboard Shell & Dynamic Role Sidebar

**Files:**
- Create: `client/src/features/travel/layout/DynamicRoleSidebar.tsx`
- Create: `client/src/features/travel/layout/SidebarNavItem.tsx`
- Create: `client/src/features/travel/layout/SidebarUserProfile.tsx`
- Create: `client/src/features/travel/layout/DashboardLayout.tsx`
- Test: `client/tests/sidebar-nav.test.ts`

**Interfaces:**
- Consumes: `useAuth()` (`user.role`, `user.name`, `user.department`).
- Produces: `<DashboardLayout />` shell hosting collapsible `<DynamicRoleSidebar />` and `<Outlet />`.

- [x] **Step 1: Write test for sidebar role navigation config**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `SidebarNavItem.tsx` and `SidebarUserProfile.tsx`**
- [x] **Step 4: Implement `DynamicRoleSidebar.tsx` and `DashboardLayout.tsx`**
- [x] **Step 5: Run test to verify it passes**
- [x] **Step 6: Verify client build**

---

### Task 2: Dedicated New Travel Request Page (`/travel/new`) & Form Subcomponents

**Files:**
- Create: `client/src/features/travel/components/forms/TravelTypeToggle.tsx`
- Create: `client/src/features/travel/components/forms/TravelLogisticsFields.tsx`
- Create: `client/src/features/travel/components/forms/DynamicExpenseTable.tsx`
- Create: `client/src/features/travel/components/forms/ExpenseRowItem.tsx`
- Create: `client/src/features/travel/components/forms/ProofAttachmentField.tsx`
- Create: `client/src/features/travel/hooks/useTravelForm.ts`
- Create: `client/src/features/travel/pages/NewTravelRequestPage.tsx`

**Interfaces:**
- Consumes: `useTravelForm` (RHF + Zod), `useTravel().createTravelRequest`.
- Produces: Dedicated `/travel/new` page replacing `NewTravelRequestModal`.

- [x] **Step 1: Implement `TravelTypeToggle.tsx` and `ExpenseRowItem.tsx`**
- [x] **Step 2: Implement `TravelLogisticsFields.tsx` and `ProofAttachmentField.tsx`**
- [x] **Step 3: Implement `DynamicExpenseTable.tsx` and `useTravelForm.ts`**
- [x] **Step 4: Implement `NewTravelRequestPage.tsx` with breadcrumbs and live INR calculation**
- [x] **Step 5: Verify client build**

---

### Task 3: Dedicated Line Manager Audit Workstation (`/travel/audit/:id`)

**Files:**
- Create: `client/src/features/travel/components/audit/ProofInspectorViewer.tsx`
- Create: `client/src/features/travel/components/audit/ManagerDecisionCard.tsx`
- Create: `client/src/features/travel/components/audit/AuditTimelineLog.tsx`
- Create: `client/src/features/travel/hooks/useAuditDecision.ts`
- Create: `client/src/features/travel/pages/ManagerAuditPage.tsx`

**Interfaces:**
- Consumes: `useTravel().reviewAsManager`, `useTravel().getRequestById`.
- Produces: Dedicated split-workstation page at `/travel/audit/:id` replacing `ManagerAuditDrawer`.

- [x] **Step 1: Implement `ProofInspectorViewer.tsx` and `AuditTimelineLog.tsx`**
- [x] **Step 2: Implement `ManagerDecisionCard.tsx` and `useAuditDecision.ts`**
- [x] **Step 3: Implement `ManagerAuditPage.tsx` with proof view and approval dispatch**
- [x] **Step 4: Verify client build**

---

### Task 4: Dedicated Executive Admin Clearance Workstation (`/travel/clearance/:id`)

**Files:**
- Create: `client/src/features/travel/components/audit/BudgetImpactGauge.tsx`
- Create: `client/src/features/travel/components/audit/AdminClearanceCard.tsx`
- Create: `client/src/features/travel/components/audit/DualRouteSelector.tsx`
- Create: `client/src/features/travel/pages/AdminClearancePage.tsx`
- Create: `client/src/features/travel/pages/DepartmentBudgetsPage.tsx`

**Interfaces:**
- Consumes: `useTravel().reviewAsAdmin`, `useTravel().budget`.
- Produces: Dedicated executive clearance workstation at `/travel/clearance/:id` replacing `AdminGovernanceDrawer`.

- [x] **Step 1: Implement `BudgetImpactGauge.tsx` and `DualRouteSelector.tsx`**
- [x] **Step 2: Implement `AdminClearanceCard.tsx`**
- [x] **Step 3: Implement `AdminClearancePage.tsx` and `DepartmentBudgetsPage.tsx`**
- [x] **Step 4: Verify client build**

---

### Task 5: Role Dashboard Refactoring with Lifecycle Tabs & Granular Subcomponents

**Files:**
- Create: `client/src/features/travel/components/tables/TravelRequestsTable.tsx`
- Create: `client/src/features/travel/components/tables/TravelTableRow.tsx`
- Create: `client/src/features/travel/components/shared/TravelMetricsGrid.tsx`
- Modify: `client/src/features/travel/components/EmployeeTravelPortal.tsx` (Refactor to modular <100 lines)
- Modify: `client/src/features/travel/components/ManagerQueuePortal.tsx` (Refactor to modular <100 lines)
- Modify: `client/src/features/travel/components/AdminGovernancePortal.tsx` (Refactor to modular <100 lines)

**Interfaces:**
- Consumes: Dynamic lifecycle tabs (`present`, `revisions`, `past`).
- Produces: Clean, modular portals linking to the new dedicated pages.

- [x] **Step 1: Implement `TravelTableRow.tsx` and `TravelRequestsTable.tsx`**
- [x] **Step 2: Implement `TravelMetricsGrid.tsx`**
- [x] **Step 3: Refactor `EmployeeTravelPortal.tsx`, `ManagerQueuePortal.tsx`, `AdminGovernancePortal.tsx`**
- [x] **Step 4: Verify client build**

---

### Task 6: Routing Integration & Full Verification

**Files:**
- Modify: `client/src/routes/AppRoutes.tsx`
- Modify: `client/src/features/dashboard/DashboardPage.tsx`
- Test: Full integration test suite

- [x] **Step 1: Wire all routes inside `AppRoutes.tsx` under `<DashboardLayout />`**
- [x] **Step 2: Run all unit and integration tests**
- [x] **Step 3: Run client production build (`npm --prefix client run build`)**
- [x] **Step 4: Update `TaskList.md` and verification documentation**
