# Employee Pages & Workflows Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate TripFlow's 4 fragmented Employee sidebar tabs (`present`, `revisions`, `drafts`, `past`) down to 1 unified, high-density workspace: My Travel (`/dashboard?tab=trips`), driven by interactive status segment pills, contextual action buttons, pinned metrics, and seamless backward compatibility for legacy URL parameters.

**Architecture:**
1. Streamline `DynamicRoleSidebar.tsx` for `role === 'EMPLOYEE'` from 4 items down to 1 item (`trips`: "My Travel", icon: `Plane`), with quick action `+ New Request` (`/travel/new`).
2. Update `DashboardPage.tsx` to set default tab for `EMPLOYEE` to `'trips'` (while accepting legacy tab params).
3. Refactor `EmployeeTravelPortal.tsx` to render a single unified table driven by status segment pills:
   - `ALL` ("All Trips")
   - `IN_FLIGHT` ("In Flight")
   - `REVISIONS` ("Action Needed")
   - `DRAFTS` ("Saved Drafts")
   - `CONCLUDED` ("Settled & Concluded")
4. Support 100% backward compatibility by mapping incoming legacy query params (`?tab=present`, `?tab=revisions`, `?tab=drafts`, `?tab=past`) into the corresponding status segment pills.
5. Provide contextual row action buttons:
   - "Fix & Resubmit" for revision requests (`/travel/requests/:id/edit?tab=revisions`)
   - "Resume Draft" for saved drafts (`/travel/requests/:id/edit?tab=drafts`)
   - "Inspect" for all other requests (`/travel/requests/:id`)
   - "Clone" secondary action for repeat trips.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS, Lucide React, Motion.

**Spec:** `docs/superpowers/specs/2026-11-16-employee-pages-consolidation-design.md`

## Global Constraints

- Never break existing API endpoints, server routes, or database schemas.
- Maintain backward compatibility for legacy tab parameters:
  - `?tab=present` $\rightarrow$ maps to `trips` with `IN_FLIGHT` segment.
  - `?tab=revisions` $\rightarrow$ maps to `trips` with `REVISIONS` segment.
  - `?tab=drafts` $\rightarrow$ maps to `trips` with `DRAFTS` segment.
  - `?tab=past` $\rightarrow$ maps to `trips` with `CONCLUDED` segment.
- Adhere strictly to Test-Driven Development (TDD): write failing tests first, verify red, implement minimal code, verify green.
- Do not commit changes to git until all roles (Admin, Manager, Employee) are tested and the user gives explicit instruction.

## Review Focus

1. **Legacy Tab Resolution:** Direct navigation from bookmarks, back buttons, or redirects (`/dashboard?tab=revisions`, `?tab=drafts`, `?tab=past`) must immediately display the correct filtered dataset without rendering an empty state or error.
2. **Contextual Action Labeling:** Rows requiring employee fix must show `"Fix & Resubmit"` with reviewer remarks; drafts must show `"Resume Draft"`; concluded trips must offer `"Clone"`.
3. **KPI & Banner Consistency:** If revisions exist, an amber warning banner must guide the employee to take action; metric card clicks must smoothly filter the view without full page unmounts.
4. **Production Build Integrity:** `npm --prefix client run build` (`tsc -b && vite build`) and `tsc` in `server/` must pass with zero errors and zero warnings.

---

### Task 1: Employee Sidebar Navigation Consolidation

**Files:**
- Modify: `client/src/features/travel/layout/DynamicRoleSidebar.tsx`
- Modify: `client/tests/sidebar-nav.test.ts`

- [x] **Step 1: Write failing test in `client/tests/sidebar-nav.test.ts`**
  Update assertions for `role === 'EMPLOYEE'`:
  Assert that `getRoleNavItems('EMPLOYEE')` returns exactly 1 item:
  `['trips']` with:
  - `id`: `'trips'`
  - `label`: `'My Travel'`
  - `icon`: `Plane`
  Assert quick action for `EMPLOYEE` is `New Request` (`PlusCircle`) pointing to `/travel/new`.

- [x] **Step 2: Run test and verify RED**
  Run: `npx tsx client/tests/sidebar-nav.test.ts`
  Expected: FAIL with "Employee should have 1 navigation item" (currently has 4).

- [x] **Step 3: Update `DynamicRoleSidebar.tsx`**
  Update `getRoleNavItems('EMPLOYEE')`:
  ```typescript
  case 'EMPLOYEE':
  default:
    return [
      { id: 'trips', label: 'My Travel', icon: Plane },
    ];
  ```

- [x] **Step 4: Run test and verify GREEN**
  Run: `npx tsx client/tests/sidebar-nav.test.ts`
  Expected: PASS.

---

### Task 2: Unified Employee Travel Workspace & Status Segment Pills

**Files:**
- Modify: `client/src/features/travel/components/EmployeeTravelPortal.tsx`
- Modify: `client/src/features/dashboard/DashboardPage.tsx`
- Create: `client/tests/employee-governance-unified.test.ts`

- [x] **Step 1: Write failing test in `client/tests/employee-governance-unified.test.ts`**
  Test that `EmployeeTravelPortal` logic handles:
  - Default tab `'trips'` and status segments:
    - `ALL` (All Trips)
    - `IN_FLIGHT` (In Flight: `SUBMITTED`, `PENDING_MANAGER_REVIEW`, `PENDING_ADMIN_APPROVAL`)
    - `REVISIONS` (Action Needed: `REVISION_REQUESTED_*`)
    - `DRAFTS` (Saved Drafts: `DRAFT`)
    - `CONCLUDED` (Settled & Concluded: `APPROVED`, `SETTLED`, `REJECTED`, `CANCELLED`)
  - Legacy tab parameter auto-mapping:
    - `present` $\rightarrow$ pre-selects `IN_FLIGHT`
    - `revisions` $\rightarrow$ pre-selects `REVISIONS`
    - `drafts` $\rightarrow$ pre-selects `DRAFTS`
    - `past` $\rightarrow$ pre-selects `CONCLUDED`
  - Dynamic table row action determination:
    - Revision rows produce `"Fix & Resubmit"`
    - Draft rows produce `"Resume Draft"`
    - Concluded / In-Flight rows produce `"Inspect"`

- [x] **Step 2: Run test and verify RED**
  Run: `npx tsx client/tests/employee-governance-unified.test.ts`
  Expected: FAIL (file or implementation missing).

- [x] **Step 3: Update `DashboardPage.tsx`**
  Update `defaultTab` for `EMPLOYEE` in `DashboardPage.tsx`:
  ```typescript
  const defaultTab =
    user?.role === 'ADMIN' ? 'governance' : user?.role === 'MANAGER' ? 'team' : 'trips';
  ```

- [x] **Step 4: Refactor `EmployeeTravelPortal.tsx`**
  - Define `EmployeeStatusSegment = 'ALL' | 'IN_FLIGHT' | 'REVISIONS' | 'DRAFTS' | 'CONCLUDED'`.
  - Resolve initial segment state from `activeTab` or query params (`present` $\rightarrow$ `IN_FLIGHT`, `revisions` $\rightarrow$ `REVISIONS`, `drafts` $\rightarrow$ `DRAFTS`, `past` $\rightarrow$ `CONCLUDED`, `trips` $\rightarrow$ `ALL`).
  - Render unified header with text search, trip type pill (`ALL`, `UPCOMING`, `CLAIMS`), and quick launch buttons (`Plan Upcoming Trip`, `Claim Past Travel`).
  - Render top metric strip with interactive segment filtering (clicking Attention Required filters to `REVISIONS` / `DRAFTS`; clicking Cleared Trips filters to `CONCLUDED`).
  - Render pinned amber banner if `allRevisions.length > 0` with 1-click filter to `REVISIONS`.
  - Render status segment pill bar (`ALL`, `IN_FLIGHT`, `REVISIONS`, `DRAFTS`, `CONCLUDED`) with real-time badges.
  - Render single unified `TravelRequestsTable` with dynamic row actions:
    - `isRevision` $\rightarrow$ `"Fix & Resubmit"` (`/travel/requests/${req.id}/edit?tab=revisions`) with reviewer remarks preview.
    - `isDraft` $\rightarrow$ `"Resume Draft"` (`/travel/requests/${req.id}/edit?tab=drafts`).
    - `isConcluded` $\rightarrow$ `"Inspect"` (`/travel/requests/${req.id}?tab=past`) + `"Clone"` (`/travel/new?clone=${req.id}`).
    - `isInFlight` $\rightarrow$ `"Inspect"` (`/travel/requests/${req.id}`).
  - Include `"Export CSV"` button in table header.
  - Render adaptive right aside with `CategorySpendBreakdownCard`, `RecentActivityFeedCard`, and context guides (`RevisionWorkflowGuideCard`, `DraftReadinessSummaryCard`, `PolicyChecklistCard`).

- [x] **Step 5: Run test and verify GREEN**
  Run: `npx tsx client/tests/employee-governance-unified.test.ts`
  Expected: PASS.

---

### Task 3: Regression Verification & Production Build

**Files:**
- Verify all client and server test suites
- Verify clean build artifacts

- [x] **Step 1: Run all client test suites**
  Execute:
  ```powershell
  npx tsx client/tests/sidebar-nav.test.ts
  npx tsx client/tests/employee-governance-unified.test.ts
  npx tsx client/tests/manager-governance-unified.test.ts
  npx tsx client/tests/admin-governance-unified.test.ts
  npx tsx client/tests/travel-detail-polymorphic.test.ts
  npx tsx client/tests/users-management.test.ts
  ```
  Expected: All 6 suites PASS.

- [x] **Step 2: Run server test suites**
  Execute:
  ```powershell
  npx tsx server/test-travel-e2e.ts
  npx tsx server/test-e2e-full-flow.ts
  ```
  Expected: All server integration tests PASS.

- [x] **Step 3: Run client production build**
  Execute:
  ```powershell
  npm --prefix client run build
  ```
  Expected: `tsc -b && vite build` succeeds with 0 errors.

- [x] **Step 4: Run server compilation**
  Execute:
  ```powershell
  npm --prefix server run build
  ```
  Expected: `tsc` succeeds with 0 errors.
