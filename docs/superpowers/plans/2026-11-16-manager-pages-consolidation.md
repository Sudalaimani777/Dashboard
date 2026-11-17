# Manager Pages & Workflows Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate TripFlow's 5 fragmented Line Manager tabs down to 2 high-density, non-redundant workspaces: Team Approvals (`/dashboard?tab=team`) and My Personal Travel (`/dashboard?tab=personal`), while ensuring `/travel/requests/:id` serves as the single in-situ workstation and retiring `ManagerAuditPage.tsx`.

**Architecture:** 
1. Streamline `DynamicRoleSidebar.tsx` for `role === 'MANAGER'` from 5 items to 2 items (`team` and `personal`).
2. Unify `ManagerQueuePortal.tsx` (`tab=team`) to render a single table driven by status segment pills (`All Team Requests`, `Pending Audit`, `In Revision`, `Awaiting Admin`, `Waiting on Employee`, `Settled & Closed`).
3. Consolidate personal travel and drafts in `ManagerQueuePortal.tsx` (`tab=personal`) with lifecycle sub-filter segments (`All Trips`, `In Flight`, `Action Needed`, `Saved Drafts`, `Past Archive`).
4. Support 100% backward compatibility by mapping legacy query params (`tab=present`, `tab=revisions`, `tab=past`, `tab=drafts`) into the appropriate workspace and pre-selected segment.
5. Decommission duplicate `ManagerAuditPage.tsx` now that `/travel/requests/:id` handles in-situ manager decisions.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS, Lucide React, Motion.

**Spec:** `docs/superpowers/specs/2026-11-16-manager-pages-consolidation-design.md`

## Global Constraints

- Never break existing API endpoints, server routes, or database schemas.
- Maintain backward compatibility for legacy tab parameters:
  - `?tab=present` $\rightarrow$ maps to `tab=team` with `AUDIT` segment.
  - `?tab=revisions` $\rightarrow$ maps to `tab=team` with `REVISIONS` segment.
  - `?tab=past` $\rightarrow$ maps to `tab=team` with `CONCLUDED` segment (or `AWAITING_ADMIN` if `bucket=AWAITING_ADMIN`).
  - `?tab=drafts` $\rightarrow$ maps to `tab=personal` with `DRAFTS` segment.
- Prevent self-audit: Managers must never be allowed to approve or clear their own travel requests in the team queue or in the polymorphic workstation.
- Adhere strictly to Test-Driven Development (TDD): write failing tests first, verify red, implement minimal code, verify green.

## Review Focus

1. **Legacy Tab Pre-selection:** Direct navigation to `/dashboard?tab=revisions` or `/dashboard?tab=past` must not render an empty state or crash; it must resolve to the unified team queue with the matching segment active.
2. **In-Flight Active Statuses:** Requests awaiting Admin clearance (`PENDING_ADMIN_APPROVAL`) and requests waiting on employee correction must not be hidden in "Past History"; they must be visible under their respective status pills.
3. **Personal Drafts Continuity:** Editing, submitting, and resuming drafts must work seamlessly inside the `tab=personal` workspace.
4. **Self-Review Guard:** If a Manager submits a personal travel request, it must not appear in their own team audit queue and must be blocked from self-approval at `/travel/requests/:id`.
5. **Production Build Integrity:** `tsc -b && vite build` in `client/` and `tsc` in `server/` must pass with zero errors and zero warnings.

---

### Task 1: Manager Sidebar Navigation Consolidation

**Files:**
- Modify: `client/src/features/travel/layout/DynamicRoleSidebar.tsx`
- Modify: `client/tests/sidebar-nav.test.ts`

- [x] **Step 1: Write failing test in `client/tests/sidebar-nav.test.ts`**
  Update assertions for `role === 'MANAGER'`:
  Assert that `getRoleNavItems('MANAGER')` returns exactly 2 items:
  `['team', 'personal']` with labels:
  - `team`: "Team Approvals" (icon: `Users`)
  - `personal`: "My Travel" (icon: `Plane`)
  Assert quick action for `MANAGER` is `New Request` (`PlusCircle`) pointing to `/travel/new`.

- [x] **Step 2: Run test and verify RED**
  Run: `npx tsx client/tests/sidebar-nav.test.ts`
  Expected: FAIL with "Manager should have 2 navigation items" (currently has 5).

- [x] **Step 3: Update `DynamicRoleSidebar.tsx`**
  Update `getRoleNavItems('MANAGER')`:
  ```typescript
  case 'MANAGER':
    return [
      { id: 'team', label: 'Team Approvals', icon: Users },
      { id: 'personal', label: 'My Travel', icon: Plane },
    ];
  ```

- [x] **Step 4: Run test and verify GREEN**
  Run: `npx tsx client/tests/sidebar-nav.test.ts`
  Expected: PASS.

---

### Task 2: Unified Team Approvals Workspace in `ManagerQueuePortal`

**Files:**
- Modify: `client/src/features/travel/components/ManagerQueuePortal.tsx`
- Modify: `client/src/features/dashboard/DashboardPage.tsx`
- Create: `client/tests/manager-governance-unified.test.ts`

- [x] **Step 1: Write failing test in `client/tests/manager-governance-unified.test.ts`**
  Test that `ManagerQueuePortal` handles `team` tab and legacy tabs (`present`, `revisions`, `past`), and renders segmented status filter pills:
  - `ALL` (All Team Requests)
  - `AUDIT` (Pending Audit)
  - `REVISIONS` (In Revision)
  - `AWAITING_ADMIN` (Awaiting Admin)
  - `WAITING_EMPLOYEE` (Waiting on Employee)
  - `CONCLUDED` (Settled & Closed)
  And assert row action URLs point to `/travel/requests/:id?tab=team`.

- [x] **Step 2: Run test and verify RED**
  Run: `npx tsx client/tests/manager-governance-unified.test.ts`
  Expected: FAIL (file or implementation missing).

- [x] **Step 3: Update `DashboardPage.tsx` and `ManagerQueuePortal.tsx`**
  - In `DashboardPage.tsx`, set default tab for `user.role === 'MANAGER'` to `'team'` if no tab parameter is supplied.
  - In `ManagerQueuePortal.tsx`:
    - Define `ManagerTeamStatusSegment`: `'ALL' | 'AUDIT' | 'REVISIONS' | 'AWAITING_ADMIN' | 'WAITING_EMPLOYEE' | 'CONCLUDED'`.
    - Map legacy `activeTab` values:
      - `present` $\rightarrow$ pre-selects `AUDIT`
      - `revisions` $\rightarrow$ pre-selects `REVISIONS`
      - `past` $\rightarrow$ pre-selects `CONCLUDED` (or `AWAITING_ADMIN` if bucket passed)
      - default for `team` $\rightarrow$ `ALL` (or active segment)
    - Replace the separate table renders with a single unified `TravelRequestsTable` filtered by active segment + search query + trip type.
    - Set row action: `navigate('/travel/requests/' + req.id + '?tab=team')`.
    - Retain pinned KPI metrics grid and right sidebar analytics (`Team Spend Mix` and `Waiting on Direct Reports`).

- [x] **Step 4: Run test and verify GREEN**
  Run: `npx tsx client/tests/manager-governance-unified.test.ts`
  Expected: PASS.

---

### Task 3: Consolidated Personal Travel & Drafts Workspace

**Files:**
- Modify: `client/src/features/travel/components/ManagerQueuePortal.tsx`
- Modify: `client/tests/manager-governance-unified.test.ts`

- [x] **Step 1: Write failing test assertions in `client/tests/manager-governance-unified.test.ts`**
  Assert that:
  - `ManagerQueuePortal.tsx` handles `activeTab === 'personal'` and legacy `activeTab === 'drafts'`.
  - Supports personal lifecycle segment pills:
    - `ALL` (All Trips)
    - `ACTIVE` (In Flight)
    - `REVISIONS` (Action Needed)
    - `DRAFTS` (Saved Drafts)
    - `ARCHIVE` (Past Archive)
  - In `DRAFTS` segment, row action provides `"Resume Draft"` navigating to `/travel/requests/:id/edit?tab=personal`.
  - In `REVISIONS` segment, banner displays count of personal requests requiring revision.

- [x] **Step 2: Run test and verify RED**
  Run: `npx tsx client/tests/manager-governance-unified.test.ts`
  Expected: FAIL on personal workspace assertions.

- [x] **Step 3: Refactor personal workspace in `ManagerQueuePortal.tsx`**
  - Map `activeTab === 'drafts'` to `activeTab = 'personal'` with segment `DRAFTS`.
  - Implement personal status segments (`ALL`, `ACTIVE`, `REVISIONS`, `DRAFTS`, `ARCHIVE`).
  - Render personal requests with appropriate actions:
    - For drafts: `"Resume Draft"` $\rightarrow$ `/travel/requests/${req.id}/edit?tab=personal`.
    - For revisions: `"Fix & Resubmit"` $\rightarrow$ `/travel/requests/${req.id}/edit?tab=personal`.
    - For active / past: `"Inspect"` $\rightarrow$ `/travel/requests/${req.id}?tab=personal`.
  - Retain `CategorySpendBreakdownCard` ("Personal Spend Mix") and `RecentActivityFeedCard` in aside.

- [x] **Step 4: Run test and verify GREEN**
  Run: `npx tsx client/tests/manager-governance-unified.test.ts`
  Expected: PASS.

---

### Task 4: Complete Deprecation & Retirement of `ManagerAuditPage.tsx`

**Files:**
- Modify / Delete: `client/src/features/travel/pages/ManagerAuditPage.tsx`
- Verify: `client/src/routes/AppRoutes.tsx`
- Test: `client/tests/travel-detail-polymorphic.test.ts`

- [x] **Step 1: Check route aliasing in `AppRoutes.tsx`**
  Verify that `/travel/audit/:id` routes to `LegacyTravelReviewRedirect` (redirecting to `/travel/requests/:id`).

- [x] **Step 2: Remove redundant `ManagerAuditPage.tsx`**
  Remove `client/src/features/travel/pages/ManagerAuditPage.tsx` or replace with minimal deprecated alias redirect.
  Ensure no components or routes import `ManagerAuditPage`.

- [x] **Step 3: Run polymorphic workstation test**
  Run: `npx tsx client/tests/travel-detail-polymorphic.test.ts`
  Expected: PASS.

---

### Task 5: End-to-End Regression Verification & Production Build

**Files:**
- Run all test suites across `client/` and `server/`.

- [x] **Step 1: Run all client tests**
  ```bash
  npx tsx client/tests/sidebar-nav.test.ts
  npx tsx client/tests/manager-governance-unified.test.ts
  npx tsx client/tests/admin-governance-unified.test.ts
  npx tsx client/tests/travel-detail-polymorphic.test.ts
  npx tsx client/tests/users-management.test.ts
  npx tsx client/tests/admin-queue.test.ts
  npx tsx client/tests/manager-queue.test.ts
  ```
  Expected: 100% PASS.

- [x] **Step 2: Run all server tests**
  ```bash
  cd server; npx tsx tests/user-lifecycle-auth.test.ts; npx tsx tests/users-api.test.ts
  ```
  Expected: 100% PASS.

- [x] **Step 3: Run client production build**
  ```bash
  cd client; npm run build
  ```
  Expected: PASS with 0 TypeScript errors and 0 Vite warnings.

- [x] **Step 4: Run server production build**
  ```bash
  cd server; npm run build
  ```
  Expected: PASS with 0 errors.
