# TripFlow Day 3 Dynamic Role Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Day 3 TripFlow Dynamic Role-Governed Dashboard, Employee Travel Portal, Line Manager Queue, Admin Governance Hub, and End-to-End Governance Verification.

**Architecture:** A single dynamic entry route `/dashboard` inspects the authenticated user's database role (`EMPLOYEE`, `MANAGER`, `ADMIN`) returned from PostgreSQL via `/api/auth/me` and mounts the dedicated portal under a shared Warm Storycraft header. Backend authentication contracts are synchronized so users receive their true database role and department upon login and session refresh.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, `react-hook-form`, `zod`, `@hookform/resolvers`, Node.js (ES Modules, TypeScript), PostgreSQL (`pg` pool), `npx tsx` / Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-11-tripflow-dynamic-dashboard-day3-design.md`

---

## Global Constraints

- **Two-Tier Dual-Role Approval**: Line Manager is Tier 1 audit authority; Admin is Tier 2 clearance and disbursement authority.
- **Two Operational Cases**: Case 1 (Already Travelled - Post-trip Reimbursement) and Case 2 (Upcoming Travel - Pre-trip Authorization).
- **Manager Re-verification Invariant**: On revision resubmission (Route A or Route B), the request strictly transitions to `PENDING_MANAGER_REVIEW`, never bypassing to Admin.
- **Currency Standard**: All amounts rendered in Indian Rupees (`₹`) with `font-mono tabular-nums` formatting.
- **Warm Storycraft Design**: Canvas `#F7F4EE`, Ink `#2B231D`, Accent `#8A582B`, Border `#E8DFD3`.
- **Zero Circular Status Dots (`●`)**: Statuses use typographic text badges only.
- **Zero Prototype Role Switchers**: The UI strictly renders the view matching the authenticated user's database role.

---

## Review Focus

1. **User Role Contract Missing from Session**: Verifying `server/src/features/auth/auth.repository.ts` and `auth.service.ts` return `role` and `department` so `useAuth()` has `user.role`.
2. **Manager Revision Loop Bypass**: Verifying that an employee resubmission after Route B (direct from Admin) cannot transition to `PENDING_ADMIN_APPROVAL` directly.
3. **Live Itemized Expense Calculation**: Summation of multi-category itemized expenses accurately displays in Indian Rupees without float precision drift.
4. **Budget Headroom Overflow**: In Admin approval, budget meter warns when a request exceeds available department allocation (`₹35,00,000.00`).
5. **Missing Receipt or Quote Proof URL**: Submission validation catches missing proofs for both Case 1 and Case 2 upfront.

---

### Task 1: Backend & Frontend Auth Role Contract Synchronization

**Files:**
- Modify: `server/src/features/auth/auth.repository.ts`
- Modify: `server/src/features/auth/auth.service.ts`
- Modify: `client/src/features/auth/types/auth.types.ts`
- Test: `server/tests/auth-role-sync.test.ts`

**Interfaces:**
- Consumes: PostgreSQL `users` table columns `role` (`'EMPLOYEE' | 'MANAGER' | 'ADMIN'`) and `department`.
- Produces: `SafeUser` containing `{ id, name, email, role, department, created_at, updated_at }` returned on `/api/auth/me` and `/api/auth/signin`.

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Update `auth.repository.ts` and `auth.service.ts`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Verify client build**

Run: `cd client && npm run build`
Expected: PASS (0 errors)

---

### Task 2: TripFlow Typographic Status Badge & Shared Header

**Files:**
- Create: `client/src/features/travel/components/TravelStatusBadge.tsx`
- Create: `client/src/features/travel/components/TripFlowHeader.tsx`
- Test: `client/tests/travel-badge.test.ts`

**Interfaces:**
- Consumes: `TravelStatus` enum and `User` interface.
- Produces: `<TravelStatusBadge status={status} />` and `<TripFlowHeader user={user} onSignOut={signout} />`.

- [x] **Step 1: Write test for TravelStatusBadge mapping**

```ts
// client/tests/travel-badge.test.ts
import assert from 'node:assert/strict';
import { getStatusBadgeConfig } from '../src/features/travel/components/TravelStatusBadge';

async function run() {
  console.log('🧪 Testing TravelStatusBadge configuration...');

  const submitted = getStatusBadgeConfig('SUBMITTED');
  assert.equal(submitted.label, 'Pending Manager Review');
  assert.ok(!submitted.label.includes('●'), 'Must not contain colored dots');

  const approved = getStatusBadgeConfig('APPROVED');
  assert.equal(approved.label, 'Approved');

  const settled = getStatusBadgeConfig('SETTLED');
  assert.equal(settled.label, 'Settled (Paid)');

  const revManager = getStatusBadgeConfig('REVISION_REQUESTED_MANAGER');
  assert.equal(revManager.label, 'Revision Required (Manager)');

  const revAdmin = getStatusBadgeConfig('REVISION_REQUESTED_ADMIN');
  assert.equal(revAdmin.label, 'Revision Required (Admin)');

  console.log('✅ TravelStatusBadge Tests Passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx tsx client/tests/travel-badge.test.ts`
Expected: FAIL with module not found.

- [x] **Step 3: Implement `TravelStatusBadge.tsx` and `TripFlowHeader.tsx`**

`TravelStatusBadge.tsx`: Exports `getStatusBadgeConfig` helper and React component displaying clean typographic badge with zero circular dots (`●`).
`TripFlowHeader.tsx`: Displays TF logo, user name, department, typographic role tag (`EMPLOYEE` / `MANAGER` / `ADMIN`), and Sign Out button.

- [x] **Step 4: Run test to verify it passes**

Run: `npx tsx client/tests/travel-badge.test.ts`
Expected: PASS

- [x] **Step 5: Verify client build**

Run: `cd client && npm run build`
Expected: PASS (0 errors)

---

### Task 3: Employee Travel Portal & Modals (Case 1 & Case 2)

**Files:**
- Create: `client/src/features/travel/components/NewTravelRequestModal.tsx`
- Create: `client/src/features/travel/components/ResubmitRequestModal.tsx`
- Create: `client/src/features/travel/components/TravelDetailDrawer.tsx`
- Create: `client/src/features/travel/components/EmployeeTravelPortal.tsx`

**Interfaces:**
- Consumes: `useTravel()` hook from `TravelContext.tsx`.
- Produces: Full Employee portal supporting Case 1 & Case 2 submission, INR calculation, proof URLs, revision resubmissions, and slide-over detail drawer.

- [x] **Step 1: Implement `NewTravelRequestModal.tsx`**
  - Toggle between Case 1 (Already Travelled - Post-trip Reimbursement) and Case 2 (Upcoming Travel - Pre-trip Authorization).
  - Form inputs: Title, Purpose, Project Code, Origin, Destination, Dates, Emergency Contact.
  - Proof URL: Tax Invoice/Receipt URL for Case 1; Itinerary Quotation URL for Case 2.
  - Dynamic Itemized Expenses: Add/Remove row with Category (`FLIGHT`, `HOTEL`, `MEALS_PER_DIEM`, `TRANSIT`, `MISC`), Merchant, and Amount in INR.
  - Real-time sum calculation formatted with `formatINR()` tabular numerals.

- [x] **Step 2: Implement `TravelDetailDrawer.tsx` and `ResubmitRequestModal.tsx`**
  - Detail drawer displays request info, proof preview, itemized expense breakdown, and timeline history.
  - Resubmit modal allows updating expenses and proof URL, explicitly displaying feedback comments from the reviewer.

- [x] **Step 3: Implement `EmployeeTravelPortal.tsx`**
  - Stat cards: Active Trips, In Review, Settled/Approved, Total Expenditure in `₹`.
  - Revision Action Banner: Highlighted alert if any request is in `REVISION_REQUESTED_MANAGER` or `REVISION_REQUESTED_ADMIN` with 1-click "Fix & Resubmit" button.
  - Requests table with columns: ID/Title, Type, Dates, Destination, Total INR (`font-mono tabular-nums`), Typographic Status Badge, Actions.
  - "New Travel Request" CTA button opening modal.

- [x] **Step 4: Verify client build**

Run: `cd client && npm run build`
Expected: PASS (0 errors)

---

### Task 4: Dynamic Dashboard Controller & Role Router

**Files:**
- Modify: `client/src/features/dashboard/DashboardPage.tsx`
- Create placeholder/stubs for `ManagerQueuePortal.tsx` and `AdminGovernancePortal.tsx` so `DashboardPage` can route cleanly to all three.

**Interfaces:**
- Consumes: `useAuth()`.
- Produces: Clean dynamic controller that inspects `user.role` and renders `<EmployeeTravelPortal />`, `<ManagerQueuePortal />`, or `<AdminGovernancePortal />`.

- [x] **Step 1: Replace legacy reader code in `DashboardPage.tsx`**
  - Read `user` from `useAuth()`.
  - Show loading state while `isLoading`.
  - Render `<EmployeeTravelPortal />` if `user.role === 'EMPLOYEE'`.
  - Render `<ManagerQueuePortal />` if `user.role === 'MANAGER'`.
  - Render `<AdminGovernancePortal />` if `user.role === 'ADMIN'`.

- [x] **Step 2: Verify client build**

Run: `cd client && npm run build`
Expected: PASS (0 errors)

---

### Task 5: Tier 1 Line Manager Queue & Proof Inspector

**Files:**
- Create: `client/src/features/travel/components/ManagerAuditDrawer.tsx`
- Create: `client/src/features/travel/components/ManagerQueuePortal.tsx`

**Interfaces:**
- Consumes: `useTravel()` hook (`requests`, `managerReview`).
- Produces: Manager Audit Queue view of direct reports' pending requests, Proof Inspector drawer, Approve & Forward action, and Request Changes action.

- [x] **Step 1: Implement `ManagerAuditDrawer.tsx`**
  - Shows employee submission details, dates, purpose, and itemized expense rows.
  - **Proof Inspector**: Displays uploaded receipt/invoice or quotation image preview.
  - Action: **Approve & Forward to Admin** (`POST /api/travel/requests/:id/manager-review` with action `'APPROVE'`).
  - Action: **Request Changes** (modal to specify revision instructions, action `'REQUEST_REVISION'`).

- [x] **Step 2: Implement `ManagerQueuePortal.tsx`**
  - Filters requests where status is `SUBMITTED` or `PENDING_MANAGER_REVIEW`.
  - Renders Audit Queue table with direct reports' requests.
  - Renders clean empty state when queue is clear.

- [x] **Step 3: Verify client build**

Run: `cd client && npm run build`
Expected: PASS (0 errors)

---

### Task 6: Tier 2 Admin Governance Hub, Budget Meter & Dual Revision Dispatch

**Files:**
- Create: `client/src/features/travel/components/DepartmentBudgetCard.tsx`
- Create: `client/src/features/travel/components/DualRouteRevisionModal.tsx`
- Create: `client/src/features/travel/components/AdminGovernanceDrawer.tsx`
- Create: `client/src/features/travel/components/AdminGovernancePortal.tsx`

**Interfaces:**
- Consumes: `useTravel()` hook (`budget`, `adminReview`).
- Produces: Executive governance hub with `₹35,00,000.00` budget meter, Route A/Route B revision dispatch modal, and Case 1 settlement / Case 2 approval actions.

- [x] **Step 1: Implement `DepartmentBudgetCard.tsx`**
  - Displays Total Allocation (`₹35,00,000.00`), Utilized Amount, and Remaining Headroom in Indian Rupees (`₹`).
  - Progress meter showing percentage utilized.

- [x] **Step 2: Implement `DualRouteRevisionModal.tsx`**
  - Modal allowing Admin to select Route A (via Manager) or Route B (direct to Employee) with comments.
  - Enforces the non-negotiable invariant that both routes return to Manager first upon resubmission.

- [x] **Step 3: Implement `AdminGovernanceDrawer.tsx` and `AdminGovernancePortal.tsx`**
  - Clearance Queue of requests in `PENDING_ADMIN_APPROVAL`.
  - Settle Reimbursement button for Case 1 (`SETTLED`).
  - Grant Clearance button for Case 2 (`APPROVED`).
  - Request Alterations button opening `DualRouteRevisionModal`.

- [x] **Step 4: Verify client build**

Run: `cd client && npm run build`
Expected: PASS (0 errors)

---

### Task 7: End-to-End Automated Multi-Role Verification & Invariant Audit

**Files:**
- Create: `server/test-travel-e2e.ts`
- Modify: `TaskList.md`

**Interfaces:**
- Tests all 3 roles, Case 1 reimbursement lifecycle, Case 2 authorization lifecycle, and revision invariants through actual HTTP API calls against the running database.

- [x] **Step 1: Implement `server/test-travel-e2e.ts`**
  - Create Employee, Manager, Admin accounts with proper roles.
  - **Case 1 Lifecycle**:
    1. Employee submits Reimbursement request with ₹54,000 in expenses and invoice proof.
    2. Manager audits $\rightarrow$ requests revision.
    3. Employee resubmits $\rightarrow$ verify it transitions back to Manager (`PENDING_MANAGER_REVIEW`), not bypassing to Admin.
    4. Manager approves $\rightarrow$ transitions to `PENDING_ADMIN_APPROVAL`.
    5. Admin settles $\rightarrow$ transitions to `SETTLED`.
  - **Case 2 Lifecycle**:
    1. Employee submits Upcoming travel request with ₹1,20,000 in estimated expenses.
    2. Manager approves $\rightarrow$ transitions to `PENDING_ADMIN_APPROVAL`.
    3. Admin dispatches Route B revision (direct to Employee).
    4. Employee resubmits $\rightarrow$ verify it transitions to Manager (`PENDING_MANAGER_REVIEW`), strictly upholding the re-verification invariant.
    5. Manager re-approves $\rightarrow$ Admin grants clearance (`APPROVED`).
  - Verify 403 Forbidden when Employee attempts manager/admin review endpoints.

- [x] **Step 2: Run E2E test to verify 100% pass**

Run: `npx tsx server/test-travel-e2e.ts`
Expected: PASS (All assertions satisfied)

- [x] **Step 3: Run full client build and unit test suite**

Run: `cd client && npm run build && npx tsx tests/auth-validation.test.ts && npx tsx tests/currency.test.ts && npx tsx tests/travel-badge.test.ts`
Expected: PASS (0 errors, 100% tests passing)

- [x] **Step 4: Update `TaskList.md`**

Mark Tasks 7, 8, 9 as completed with comprehensive documentation.

---
