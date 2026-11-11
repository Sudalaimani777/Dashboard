# TripFlow — Project Task Tracking & Context Guide

> **Purpose for AI Agents & Developers**: This document serves as the single source of truth for project status, architecture, invariants, and step-by-step task progress. When resuming work in a new conversation or session, read this file first to maintain full context and ensure seamless continuity without losing context.

---

## 📌 Project Overview & Metadata

* **Project**: **TripFlow** (Corporate Travel Request & Expense Governance Platform)
* **Active Workspace**: `c:\Users\SudalaimaniKannan\Documents\Codings\Readventure`
* **Target Git Branch**: `feature/travel-request-system` (tracking `origin/feature/travel-request-system`)
* **Pull Request**: [GitHub PR Comparison](https://github.com/Sudalaimani777/Dashboard/compare/Project...feature/travel-request-system?expand=1)
* **Google Sheet Tracker**: [TripFlow 3-Day Project Estimation Sheet](https://docs.google.com/spreadsheets/d/10XdNSyR_Vkbs1yVZfKnnolMDHZcJrza-Jo8fXvs0xw8/edit)
* **Primary Spec**: [`docs/superpowers/specs/2026-11-06-tripflow-travel-request-system-design.md`](docs/superpowers/specs/2026-11-06-tripflow-travel-request-system-design.md) (v2.0.0 Approved)
* **Master Implementation Plan**: [`docs/superpowers/plans/2026-11-09-tripflow-travel-governance.md`](docs/superpowers/plans/2026-11-09-tripflow-travel-governance.md)
* **Interactive Mockup**: [`docs/mockups/tripflow-full-mockup.html`](docs/mockups/tripflow-full-mockup.html)

---

## 🔒 Non-Negotiable Architectural Invariants

Any agent or contributor modifying this codebase **must** adhere to these strict rules:

1. **Two-Tier Dual-Role Approval**:
   - Direct Line **Managers** act as Tier 1 operational & expense auditors.
   - **Admins** act as Tier 2 executive clearance and finance disbursement authorities.
2. **Two Dedicated Operational Cases**:
   - **Case 1: Already Travelled (Post-trip Reimbursement)**: Employee submits actual incurred payment expenses + tax invoice/receipt proof photos $\rightarrow$ Manager audits $\rightarrow$ Admin settles payout (`SETTLED`).
   - **Case 2: Upcoming Travel (Pre-trip Authorization)**: Employee submits planned itinerary + estimated expenses + quote proof photos $\rightarrow$ Manager audits $\rightarrow$ Admin grants clearance (`APPROVED`).
3. **Manager Verification Invariant on Revision**:
   - When an Admin requests alterations, they can route instructions via Manager (Route A) or direct to Employee (Route B).
   - In **both cases**, upon Employee resubmission, the request **always returns to the Manager first for re-verification** before progressing to the Admin. It must never bypass the Manager directly to Admin.
4. **Unified Upfront Expenses & Proof**:
   - In both cases, itemized expense categories (`FLIGHT`, `HOTEL`, `MEALS_PER_DIEM`, `TRANSIT`, `MISC`) and supporting attachment image URLs must be supplied upon initial submission.
5. **Currency Standard**:
   - Database defaults to `currency: 'INR'`. All UI displays must format in **Indian Rupees (`₹`)** with monospace tabular figures (`font-mono tabular-nums`) adhering to Indian numbering conventions (e.g., `₹1,48,000.00`).
6. **Warm Storycraft Design System**:
   - Canvas `#F7F4EE`, Ink `#2B231D`, Accent `#8A582B`, Border `#E8DFD3`.
   - **Zero colored circular status dots (`●`)**: Statuses must be displayed using clean typographic badges.
7. **Strict Dynamic Role-Governed Dashboard (No Prototype Switchers)**:
   - The dashboard dynamically renders views strictly based on the authenticated user's database role (`user.role` from `/api/auth/me`):
     - `EMPLOYEE` $\rightarrow$ Employee Travel Portal (`EmployeeTravelPage`).
     - `MANAGER` $\rightarrow$ Line Manager Audit Queue (`ManagerQueuePage`) + personal travel tab.
     - `ADMIN` $\rightarrow$ Executive Governance Hub (`AdminGovernancePage`).
   - Mock/prototype role switcher pills in the navigation bar are strictly banned in production code. Real users cannot toggle roles.
   - The topbar displays only the authenticated user's name, department, and typographic role badge.
   - Unauthorized route or API access strictly yields `403 Forbidden`.

---

## 📅 3-Day Development Schedule (8.0 Hours / Day)

| Day | Date | Category | Key Milestones | Est. Hours | Status |
| :---: | :---: | :--- | :--- | :---: | :---: |
| **Day 1** | **09/11/2026** | **Database & Backend Foundation** | Tasks 1, 2, 3: PostgreSQL Schema Migration & Seed Data, TypeScript Domain Contracts & FSM, Relational Repository Layer | **8.0 Hours** | **Completed** |
| **Day 2** | **10/11/2026** | **Backend Logic & Frontend State** | Tasks 4, 5, 6: Travel Service Layer & Governance Rules, Express 5 Controllers & Route Guards, Frontend State Context & API Client | **8.0 Hours** | **Completed** |
| **Day 3** | **11/11/2026** | **Portals, Governance & E2E Verification** | Tasks 7, 8, 9: Employee Portal UI & Uploader, Manager Queue & Admin Governance Drawers, 100% E2E Automated Verification | **8.0 Hours** | **Pending** |
| **Total** | | | **Complete Production-Ready 2-Tier Governance System** | **24.0 Hours** | |

---

## 📋 Detailed Task Checklist

### 🚀 Day 1: Database & Backend Foundation (09/11/2026) — 8.0 Hours

- [x] **Task 1: PostgreSQL Schema Migration (Seed Data Omitted per Instructions)** (Est: 2.5 Hours) — ✅ Completed
  - [x] Create `server/tests/db-migration.test.ts` to test schema tables, foreign keys, and INR defaults.
  - [x] Run test to verify it fails (`npx tsx server/tests/db-migration.test.ts`).
  - [x] Write SQL migration `server/src/shared/db/migrations/002_create_travel_governance_tables.sql`:
    - Alter `users` check constraint to `('EMPLOYEE', 'MANAGER', 'ADMIN')` and add `manager_id UUID`.
    - Create `department_budgets` table (default `total_allocation = 3500000.00` INR).
    - Create `travel_requests` table with 10 statuses, `travel_type`, `currency` default `INR`, `revision_target`.
    - Create `travel_expenses` table with category checks, merchant, amount, receipt image URL.
    - Create `request_timeline_events` audit ledger table with actor, role, transitions, remarks.
  - [x] Automatically executed via `server/src/shared/db/migrate.ts`.
  - [x] Run migration test `npm run test:migration` and verify 100% passes.
  - [x] *(Seed data intentionally skipped per user explicit instruction)*.

- [x] **Task 2: Travel Types, State Machine & Validation Schemas** (Est: 2.5 Hours) — ✅ COMPLETED
  - [x] Create unit test `server/tests/travel-state-machine.test.ts` validating all 47 allowed transitions, revision loops, and rejecting bypasses.
  - [x] Create domain type contracts `server/src/features/travel/travel.types.ts`:
    - Enums: `TravelType`, `TravelStatus`, `ExpenseCategory`, `RevisionTarget`, `UserRole`.
    - Interfaces: `TravelRequest`, `TravelExpense`, `TimelineEvent`, `DepartmentBudget`.
  - [x] Create validation schemas in `server/src/features/travel/travel.validation.ts`:
    - Validate upfront expenses and receipt URLs.
    - Validate revision routing (`MANAGER` vs `EMPLOYEE`).
  - [x] Implement state machine transition logic and permission boundaries (`ALLOWED_TRANSITIONS`, `validateStatusTransition`, `canEmployeeModify`).
  - [x] Run unit test suite `npm run test:fsm` and verify 47/47 tests pass.

- [x] **Task 3: Relational Repository Layer** (Est: 3.0 Hours) — ✅ COMPLETED
  - [x] Create repository test `server/tests/travel-repo.test.ts` for database CRUD, transactions, and audit events.
  - [x] Implement `server/src/features/travel/travel.repository.ts` & `server/src/modules/travel/repositories/travel.repository.ts`:
    - `createRequestWithExpenses()` (atomic transaction inserting request + expenses + timeline event).
    - `findById()`, `findScopedRequests()` (role-based: Employee sees own, Manager sees direct reports, Admin sees all).
    - `updateStatusWithTimeline()` (atomic status change with immutable timeline audit log).
    - `updateExpenses()` (for employee modification upon revision).
    - `getDepartmentBudget()`, `updateBudgetUtilization()`.
  - [x] Run repository test `npm run test:repo` and verify 29/29 tests pass.
  - [x] Git commit: `feat(travel): implement travel relational repository with atomic transactions`.

---

### ⚙️ Day 2: Backend Logic & Frontend State (10/11/2026) — 8.0 Hours

- [x] **Task 4: Travel Service Layer & Governance Rules** (Est: 3.0 Hours) — ✅ COMPLETED
  - [x] Create service test `server/tests/travel-service.test.ts`.
  - [x] Implement `server/src/features/travel/travel.service.ts` & `server/src/modules/travel/services/travel.service.ts`:
    - `createRequest()`, `managerReview()`, `adminReview()`, `employeeResubmit()`, `cancelRequest()`.
    - Strict enforcement: Admin revision Route A & Route B both transition to `PENDING_MANAGER_REVIEW` upon resubmission.
    - Department budget headroom checks before Admin approval (with forceOverride option).
  - [x] Verify test suite passes (10/10 tests pass).
  - [x] Git commit: `feat(travel): implement travel governance service and revision invariants (Task 4)`.

- [x] **Task 5: Express 5 Controllers, Role-Based Route Guards & Endpoints** (Est: 2.5 Hours) — ✅ COMPLETED
  - [x] Create API route integration test `server/tests/travel-api.test.ts`.
  - [x] Implement role authorization middleware in `server/src/shared/middleware/role.middleware.ts` (`requireRole(['MANAGER', 'ADMIN'])`).
  - [x] Implement `server/src/features/travel/travel.controller.ts` & `server/src/modules/travel/controllers/travel.controller.ts`.
  - [x] Register routes in `server/src/features/travel/travel.routes.ts` & `server/src/modules/travel/routes/travel.routes.ts`:
    - `POST /api/travel/requests`
    - `GET /api/travel/requests` & `GET /api/travel/requests/:id`
    - `POST /api/travel/requests/:id/manager-review`
    - `POST /api/travel/requests/:id/admin-review`
    - `POST /api/travel/requests/:id/resubmit`
    - `GET /api/travel/budgets`
  - [x] Mount travel router in `server/src/app.ts`.
  - [x] Run test suite and verify all API endpoints return proper status codes and error envelopes (11/11 tests pass).
  - [x] Git commit: `feat(travel): add travel REST API controllers, role guards, and endpoints (Task 5)`.

- [x] **Task 6: Frontend Travel State & API Client** (Est: 2.5 Hours) — ✅ COMPLETED
  - [x] Implement Axios API service in `client/src/features/travel/services/travel.api.ts` & `client/src/services/travelApi.ts`.
  - [x] Implement `client/src/features/travel/types/travel.types.ts` & `client/src/types/travel.ts` mirroring backend domain contracts.
  - [x] Implement Indian Rupee currency formatter utilities (`client/src/features/travel/utils/currency.ts` & `client/src/utils/currency.ts`) using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
  - [x] Implement React context & hook in `client/src/features/travel/context/TravelContext.tsx` & `useTravel.ts`.
  - [x] Create test `client/tests/currency.test.ts` verifying `₹`, Lakhs/Crores, and monospace tabular formatting (5/5 tests pass).
  - [x] Verify frontend build passes cleanly (`npm run build` completed with 0 errors).
  - [x] Git commit: `feat(client): implement travel API client, state context, and INR currency helpers (Task 6)`.

---

### 🎨 Day 3: Dynamic Role Dashboard, Portals & E2E Verification (11/11/2026) — 8.0 Hours

- [x] **Task 7A: Direct Onboarding & Landing Page Removal (Mentor Directive)** — ✅ COMPLETED
  - [x] Eliminate marketing landing page (`client/src/features/landing/`) from user flow per mentor directive.
  - [x] Update `AppRoutes.tsx` so unauthenticated users land directly on `/signin` (Onboarding).
  - [x] Update centered enterprise auth layout with `TF` brand icon (no "Need help?" or "TripFlow" text).
  - [x] Verified `npm run build` passes cleanly with 0 errors.

- [x] **Task 7B: Auth Role Contract Sync & Employee Travel Portal UI** (Est: 3.0 Hours) — ✅ COMPLETED
  - [x] Update `auth.repository.ts`, `auth.service.ts`, and `client/src/features/auth/types/auth.types.ts` to return `role` and `department`.
  - [x] Implement `client/src/features/travel/components/TravelStatusBadge.tsx` with clean typographic tags (zero colored circular dots `●`).
  - [x] Build `NewTravelRequestModal.tsx` powered by **`react-hook-form`** & **`zod`**:
    - Case 1: Already Travelled (Actual payment expenses + tax invoice receipt URL).
    - Case 2: Upcoming Travel (Estimated expenses + quotation proof URL).
    - Dynamic itemized expense table with live sum in Indian Rupees (`₹`).
  - [x] Build `ResubmitRequestModal.tsx` returning requests to Manager upon revision.
  - [x] Implement `TravelDetailDrawer.tsx` with proof inspector and audit ledger.
  - [x] Implement `EmployeeTravelPortal.tsx` with travel metrics and requests data table.

- [x] **Task 8: Dynamic Role-Governed Dashboard, Manager Queue & Admin Governance Hub** (Est: 3.0 Hours) — ✅ COMPLETED
  - [x] Replace legacy Book reader (`client/src/features/dashboard/DashboardPage.tsx`) with dynamic role controller rendering views according to authenticated `user.role` from `/api/auth/me`.
  - [x] Implement shared enterprise header `TripFlowHeader.tsx` (`[TF Logo] • [User Name] • [Department] • [Typographic Role Badge] • [Sign Out]`).
  - [x] Implement Tier 1 Line Manager Queue: `client/src/features/travel/components/ManagerQueuePortal.tsx` & `ManagerAuditDrawer.tsx` (Proof Inspector, Approve & Forward, Request Changes).
  - [x] Implement Tier 2 Admin Governance Hub: `client/src/features/travel/components/AdminGovernancePortal.tsx`:
    - Department quarterly budget meter card `DepartmentBudgetCard.tsx` (`₹35,00,000.00` pool).
    - Dual-route revision dispatch modal `DualRouteRevisionModal.tsx` (Route A: via Manager, Route B: direct to Employee).
    - Payout settlement drawer `AdminGovernanceDrawer.tsx` for Case 1 reimbursement disbursement and clearance for Case 2.

- [x] **Task 9: Full End-to-End Automated Integration Verification & Design Audit** (Est: 2.0 Hours) — ✅ COMPLETED
  - [x] Write full E2E lifecycle test `server/test-travel-e2e.ts` in pure Node.js:
    - Case 1 lifecycle: Submit $\rightarrow$ Manager request change $\rightarrow$ Employee resubmit $\rightarrow$ Manager approve $\rightarrow$ Admin settle (`SETTLED`).
    - Case 2 lifecycle: Submit $\rightarrow$ Manager approve $\rightarrow$ Admin revise Route B $\rightarrow$ Employee resubmit (strictly routes to Manager) $\rightarrow$ Manager re-approve $\rightarrow$ Admin grant clearance (`APPROVED`).
    - Security checks: 403 Forbidden for unauthorized role API calls.
  - [x] Run full test suite: `npx tsx server/test-travel-e2e.ts` (100% passed).
  - [x] Audit frontend UI against Warm Storycraft criteria (zero circular dots `●`, canvas `#F7F4EE`, monospace tabular numerals).
  - [x] Verify frontend build passes cleanly (`npm run build` completed with 0 errors).


---

## 🛠️ Instructions for Resuming Work

When starting a new session or subagent conversation:
1. **Read this file (`TaskList.md`) first** to identify the current active task and completed checkboxes.
2. Verify git status and ensure you are on `feature/travel-request-system`:
   ```bash
   git status
   git branch
   ```
3. Run existing verification tests to confirm the current state:
   ```bash
   cd server
   npm test
   ```
4. Pick up the next unchecked task item (`- [ ]`). Follow Test-Driven Development (TDD):
   - Write or review the test first.
   - Run the test to confirm failure.
   - Implement the code.
   - Run the test to confirm it passes.
5. Once a task is verified, check off the corresponding items in `TaskList.md` (`- [x]`), commit the changes with a clear commit message, and push to origin:
   ```bash
   git add <modified-files> TaskList.md
   git commit -m "<task commit message>"
   git push origin feature/travel-request-system
   ```

---

## 📜 Git Commit Log (Recent)

* `6b3b732` — `docs: update README to reflect TripFlow corporate travel governance platform`
* `651fc92` — `docs: add comprehensive 9-task implementation plan for TripFlow travel governance`
* `f4c4c84` — `docs(spec): update travel request system design to v2.0.0 (Manager Tier 1 role, upfront expenses/proof, dual revision routing, and Indian Rupees ₹ currency)`
* `516e05d` — `docs(spec): add travel request system specification and interactive mockup`
