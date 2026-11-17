# Admin Pages & Workflow Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate TripFlow's 7 fragmented Admin surfaces into 3 high-density, non-redundant workflows: a 3-item sidebar with a unified Travel Governance Queue, a polymorphic Travel Request Workstation (`/travel/requests/:id`), and a single source of truth for member onboarding (`/admin/users/new`).

**Architecture:** 
1. Streamline `DynamicRoleSidebar.tsx` for Admin into 3 items (`governance`, `budgets`, `users`) with `+ Add Member` CTA.
2. Unify `AdminGovernancePortal.tsx` to render one table powered by status filter segment chips (`All`, `Awaiting Clearance`, `Tier 1 Oversight`, `In Revision`, `Settled & Closed`).
3. Enhance `TravelDetailPage.tsx` into a polymorphic review workstation mounting context-aware decision panels (`AdminClearanceCard`, `ManagerDecisionCard`, or read-only summary), aliasing `/travel/clearance/:id` and `/travel/audit/:id`.
4. Streamline `UserFormModal.tsx` to be edit-only, cementing `/admin/users/new` as the canonical creation route.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS, Lucide React, Motion.

**Spec:** `docs/superpowers/specs/2026-11-16-admin-pages-consolidation-design.md`

## Global Constraints

- Never break existing API endpoints or database constraints.
- Maintain backward compatibility for legacy tab query parameters (`tab=present`, `tab=revisions`, `tab=past`) by mapping them to `tab=governance`.
- Maintain route redirection for legacy routes `/travel/clearance/:id` and `/travel/audit/:id` pointing to `/travel/requests/:id`.
- Adhere strictly to Test-Driven Development (TDD): write failing tests first, verify red, implement minimal code, verify green.

## Review Focus

1. **Legacy Tab Redirection:** Direct navigation to `/dashboard?tab=present` must not break or render an empty state; it must smoothly resolve to the unified governance queue with the clearance filter active.
2. **Review Workstation Permission & Role Checks:** An Admin viewing an approved/settled request must see the read-only audit log, while viewing `PENDING_ADMIN_APPROVAL` must show `AdminClearanceCard`, and `PENDING_MANAGER_REVIEW` must show Tier 1 audit controls.
3. **Self-Review Guard:** If an Admin submits a personal travel request, they must not be allowed to clear or approve their own travel request.
4. **Member Creation Hierarchy:** Creating a member via `/admin/users/new` must correctly enforce only `EMPLOYEE` and `MANAGER` roles and populate available managers for employees.
5. **Production Build Integrity:** `tsc -b && vite build` in client and `tsc` in server must succeed without warnings or type errors.

---

### Task 1: Admin Sidebar Navigation Consolidation

**Files:**
- Modify: `client/src/features/travel/layout/DynamicRoleSidebar.tsx`
- Modify: `client/tests/sidebar-nav.test.ts`

- [x] **Step 1: Write failing test in `client/tests/sidebar-nav.test.ts`**
  Assert that for `role === 'ADMIN'`, `getRoleNavItems('ADMIN')` returns exactly 3 items:
  `['governance', 'budgets', 'users']` with labels:
  - `governance`: "Travel Governance"
  - `budgets`: "Department Budgets"
  - `users`: "Team & Access"
  And assert `getRoleQuickAction('ADMIN')` returns `Add Member` pointing to `/admin/users/new`.

- [x] **Step 2: Run test and verify RED**
  Run `npx tsx client/tests/sidebar-nav.test.ts` and confirm it fails because Admin currently has 5 items.

- [x] **Step 3: Update `DynamicRoleSidebar.tsx`**
  Update `getRoleNavItems('ADMIN')`:
  ```typescript
  case 'ADMIN':
    return [
      { id: 'governance', label: 'Travel Governance', icon: ShieldCheck },
      { id: 'budgets', label: 'Department Budgets', icon: PieChart },
      { id: 'users', label: 'Team & Access', icon: Users },
    ];
  ```

- [x] **Step 4: Run test and verify GREEN**
  Run `npx tsx client/tests/sidebar-nav.test.ts` and confirm all sidebar assertions pass.

---

### Task 2: Unified Governance Queue & Status Filters in `AdminGovernancePortal`

**Files:**
- Modify: `client/src/features/travel/components/AdminGovernancePortal.tsx`
- Modify: `client/src/features/dashboard/DashboardPage.tsx`
- Create: `client/tests/admin-governance-unified.test.ts`

- [x] **Step 1: Write failing test in `client/tests/admin-governance-unified.test.ts`**
  Test that `AdminGovernancePortal` handles `governance` tab and legacy tabs (`present`, `revisions`, `past`), and renders segmented status filter pills:
  - `ALL` (All Requests)
  - `CLEARANCE` (Awaiting Clearance)
  - `OVERSIGHT` (Tier 1 Oversight)
  - `REVISIONS` (In Revision)
  - `ARCHIVE` (Settled & Closed)
  And assert row action URLs point to `/travel/requests/:id`.

- [x] **Step 2: Run test and verify RED**
  Run `npx tsx client/tests/admin-governance-unified.test.ts` and confirm it fails.

- [x] **Step 3: Update `AdminGovernancePortal.tsx` and `DashboardPage.tsx`**
  - In `DashboardPage.tsx`, map default Admin tab to `governance` if not specified or if legacy tab is provided.
  - In `AdminGovernancePortal.tsx`:
    - Support `activeTab === 'governance'`, resolving legacy `present` $\rightarrow$ `CLEARANCE`, `revisions` $\rightarrow$ `REVISIONS`, `past` $\rightarrow$ `ARCHIVE`.
    - Replace the 3 separate table layouts with a unified table displaying segmented filter pills with badge counts.
    - Set row action to navigate directly to `/travel/requests/${req.id}?tab=governance`.
    - Keep the 4-card KPI metric strip pinned at the top.

- [x] **Step 4: Run test and verify GREEN**
  Run `npx tsx client/tests/admin-governance-unified.test.ts` and confirm it passes.

---

### Task 3: Polymorphic Travel Request Workstation & Route Aliasing

**Files:**
- Modify: `client/src/features/travel/pages/TravelDetailPage.tsx`
- Modify: `client/src/routes/AppRoutes.tsx`
- Create: `client/tests/travel-detail-polymorphic.test.ts`

- [x] **Step 1: Write failing test in `client/tests/travel-detail-polymorphic.test.ts`**
  Verify that:
  - `AppRoutes.tsx` redirects `/travel/clearance/:id` $\rightarrow$ `/travel/requests/:id`.
  - `AppRoutes.tsx` redirects `/travel/audit/:id` $\rightarrow$ `/travel/requests/:id`.
  - `TravelDetailPage.tsx` imports and renders `AdminClearanceCard` and `ManagerDecisionCard` dynamically based on user role and request status.

- [x] **Step 2: Run test and verify RED**
  Run `npx tsx client/tests/travel-detail-polymorphic.test.ts` and confirm it fails.

- [x] **Step 3: Implement polymorphic decision panel in `TravelDetailPage.tsx`**
  - Integrate `useAuditDecision` into `TravelDetailPage.tsx`.
  - Load department budget when an Admin inspects a request to feed `BudgetImpactGauge`.
  - Render `AdminClearanceCard` when `user?.role === 'ADMIN'` and `request.status === 'PENDING_ADMIN_APPROVAL'`.
  - Render `ManagerDecisionCard` when `(user?.role === 'MANAGER' || (user?.role === 'ADMIN' && request.userId !== user?.id))` and `request.status === 'PENDING_MANAGER_REVIEW'`.
  - Update `AppRoutes.tsx` to redirect `/travel/clearance/:id` and `/travel/audit/:id` to `/travel/requests/:id`.

- [x] **Step 4: Run test and verify GREEN**
  Run `npx tsx client/tests/travel-detail-polymorphic.test.ts` and confirm it passes.

---

### Task 4: Streamline Member Onboarding

**Files:**
- Modify: `client/src/features/users/components/UserFormModal.tsx`
- Modify: `client/src/features/users/pages/AdminUsersPage.tsx`
- Modify: `client/tests/users-management.test.ts`

- [x] **Step 1: Write failing test in `client/tests/users-management.test.ts`**
  Assert that:
  - `UserFormModal.tsx` contains only edit functionality and removes create-mode code.
  - `AdminUsersPage.tsx` navigates directly to `/admin/users/new` when "+ Add Member" is clicked.

- [x] **Step 2: Run test and verify RED**
  Run `npx tsx client/tests/users-management.test.ts` and confirm failure.

- [x] **Step 3: Refactor `UserFormModal.tsx` to be edit-only**
  - Remove `mode === 'create'` and `CreateUserForm` from `UserFormModal.tsx`.
  - Rename/refactor the modal to focus exclusively on member editing (`department`, `managerId`, and `role`).
  - Verify `AdminUsersPage.tsx` opens `UserFormModal` only for editing.

- [x] **Step 4: Run test and verify GREEN**
  Run `npx tsx client/tests/users-management.test.ts` and confirm it passes.

---

### Task 5: Full Regression Testing & Production Build Verification

**Files:**
- Run all test suites across `client/` and `server/`.

- [x] **Step 1: Run all client tests**
  ```bash
  npx tsx client/tests/sidebar-nav.test.ts
  npx tsx client/tests/admin-governance-unified.test.ts
  npx tsx client/tests/travel-detail-polymorphic.test.ts
  npx tsx client/tests/users-management.test.ts
  ```
  Confirm 100% pass.

- [x] **Step 2: Run all server tests**
  ```bash
  cd server; npx tsx tests/user-lifecycle-auth.test.ts; npx tsx tests/users-api.test.ts
  ```
  Confirm 100% pass.

- [x] **Step 3: Run production builds**
  ```bash
  cd client; npm run build
  cd server; npm run build
  ```
  Confirm zero errors in both client and server builds.
