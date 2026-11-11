# TripFlow Day 3 Design Specification: Dynamic Role-Governed Dashboard & Direct Onboarding

- **Date**: 2026-11-11
- **Status**: Approved by User
- **Target Branch**: `feature/dynamic-role-dashboard`
- **Scope**: Day 3 Frontend Portals, Role-Based Routing, and End-to-End Governance Lifecycle

---

## 1. Executive Summary & Mentor Directive

Based on direct mentor guidance, the public promotional landing page and its child marketing components are eliminated from the active user flow. 

Corporate travel governance is an enterprise internal tool where:
1. **Direct Onboarding Entry**: Entering the application root `/` immediately routes users into the authentication/onboarding flow (`/signin` & `/signup`).
2. **Dynamic Role-Governed Dashboard**: Once authenticated, users land on a single unified route `/dashboard`. The view rendered at `/dashboard` dynamically adapts to the verified database role (`EMPLOYEE`, `MANAGER`, `ADMIN`) of the user returned by `GET /api/auth/me`.
3. **Zero Prototype Switchers**: Prototype demo role toggles in the navbar are strictly omitted. Role switching in evaluation is performed by updating the user's role in PostgreSQL (`UPDATE users SET role = '...' WHERE email = '...';`).
4. **Focused Role Scope**:
   - **`EMPLOYEE`**: Focused exclusively on personal travel requests (Case 1 reimbursement and Case 2 pre-trip authorization), upfront itemized expenses in Indian Rupees (`₹`), receipt/quote proof URLs, and handling revision resubmissions.
   - **`MANAGER`**: Focused exclusively on the Tier 1 Audit Queue for direct reports, proof inspection, approving and forwarding to Admin, or returning for revisions.
   - **`ADMIN`**: Focused exclusively on Tier 2 executive governance, real-time department budget tracking (`₹35,00,000.00` allocation pool), dual-route revision dispatching (Route A vs Route B), and settling reimbursements / clearing upcoming trips.

### 1.1 Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, `react-hook-form`, `zod`, `@hookform/resolvers/zod`.
- **Backend**: Node.js (ES Modules, TypeScript), PostgreSQL (`pg` pool).
- **Testing**: `npx tsx` / Node test runner.

---

## 2. Non-Negotiable Architectural Invariants

1. **Two-Tier Dual-Role Approval**:
   - Tier 1: Direct Line Manager acts as operational, itinerary, and expense auditor.
   - Tier 2: Admin acts as financial disbursement authority and executive clearance.
2. **Two Operational Travel Cases**:
   - **Case 1: Already Travelled (Post-trip Reimbursement)**: Employee submits actual incurred expenses + tax invoice/receipt proof $\rightarrow$ Manager audits $\rightarrow$ Admin settles payout (`SETTLED`).
   - **Case 2: Upcoming Travel (Pre-trip Authorization)**: Employee submits planned itinerary + estimated expenses + quote proof $\rightarrow$ Manager audits $\rightarrow$ Admin grants clearance (`APPROVED`).
3. **Manager Verification Invariant on Revision**:
   - If Admin requests alterations (whether routed via Manager via Route A or directly to Employee via Route B), upon Employee resubmission the request **must always return to the Manager first for re-verification** (`PENDING_MANAGER_REVIEW`) before progressing to Admin. Direct bypass to Admin is strictly prevented.
4. **Currency & Monospace Numerals**:
   - Currency strictly standardizes on Indian Rupees (`₹`) formatted with `font-mono tabular-nums` (e.g. `₹1,48,000.00`).
5. **Warm Storycraft Aesthetics**:
   - Canvas `#F7F4EE`, Ink `#2B231D`, Accent `#8A582B`, Border `#E8DFD3`.
   - **Zero colored circular status dots (`●`)**: Statuses are displayed exclusively with clean typographic badges.

---

## 3. Application Routing & Architecture

```
                                  [ User Enters / ]
                                          │
                                 Is Authenticated?
                                   /             \
                             No   /               \  Yes
                                 ▼                 ▼
                          [/signin]           [/dashboard]
                          (Auth Card)              │
                                                   ▼
                                         Inspect `user.role`
                                          (/api/auth/me)
                                         /       │      \
                                        /        │       \
                                       ▼         ▼        ▼
                                   EMPLOYEE   MANAGER   ADMIN
                                   Portal      Portal   Portal
```

### 3.1 Route Declarations (`client/src/routes/AppRoutes.tsx`)
* `/signin` $\rightarrow$ `SignInCard` (centered clean card with `TF` logo)
* `/signup` $\rightarrow$ `SignUpCard` (centered clean card with `TF` logo)
* `/forgot-password` $\rightarrow$ `ForgotPasswordCard`
* `/reset-password` $\rightarrow$ `ResetPasswordCard`
* `/dashboard` $\rightarrow$ Protected by `ProtectedRoute`. Renders dynamic `DashboardPage`.
* `/` $\rightarrow$ `<Navigate to="/dashboard" replace />` (redirects unauthenticated users to `/signin`)
* `*` $\rightarrow$ `<Navigate to="/dashboard" replace />` (catch-all redirects to `/dashboard`)

---

## 4. Backend Authentication & Role Contract

The database `users` table already holds `role` (`'EMPLOYEE'`, `'MANAGER'`, `'ADMIN'`) and `department` (`002_create_travel_governance_tables.sql`).

### 4.1 Required Server Updates
1. `server/src/features/auth/auth.repository.ts`:
   - `findByEmail`, `findById`, and `create` queries updated to include `role` and `department`.
2. `server/src/features/auth/auth.service.ts`:
   - `sanitizeUser(user: User): SafeUser` includes `role: user.role || 'EMPLOYEE'` and `department: user.department || 'Engineering'`.
   - `getProfile()` returns the complete sanitized user with `role` and `department`.
3. `client/src/features/auth/types/auth.types.ts`:
   - Extend `User` interface:
     ```ts
     export interface User {
       id: string;
       name: string;
       email: string;
       role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
       department: string;
       created_at: string;
       updated_at: string;
     }
     ```

---

## 5. Portal Component Specifications

### 5.1 Shared Header: `<TripFlowHeader />`
- **Location**: `client/src/features/travel/components/TripFlowHeader.tsx`
- **Elements**:
  - Left: Centered `TF` brand icon + `TripFlow` title.
  - Center/Right: Authenticated user name, department, typographic role badge (`EMPLOYEE` / `MANAGER` / `ADMIN`).
  - Right: "Sign Out" button triggering `signout()` and navigating to `/signin`.

### 5.2 Typographic Status Badge: `<TravelStatusBadge />`
- **Location**: `client/src/features/travel/components/TravelStatusBadge.tsx`
- **Banned**: Circular colored dots (`●`).
- **Variants**:
  - `SUBMITTED`, `PENDING_MANAGER_REVIEW`: Subtle amber typographic tag `Auditing (Manager)`.
  - `PENDING_ADMIN_APPROVAL`: Subtle blue typographic tag `Pending Clearance`.
  - `APPROVED`: Emerald typographic tag `Approved`.
  - `SETTLED`: Green typographic tag `Settled (Paid)`.
  - `REVISION_REQUESTED_MANAGER`, `REVISION_REQUESTED_ADMIN`: Rose typographic tag `Revision Required`.
  - `CANCELLED`, `REJECTED`: Stone typographic tag `Closed`.

### 5.3 Employee Portal: `<EmployeeTravelPortal />`
- **Location**: `client/src/features/travel/components/EmployeeTravelPortal.tsx`
- **Sub-components**:
  1. **Metric Summary Bar**: Active Trips, In Review, Approved/Settled count, and Total Reimbursed/Estimated in Indian Rupees (`₹`).
  2. **Revision Action Banner**: Highlighted callout if any request has status `REVISION_REQUESTED_MANAGER` or `REVISION_REQUESTED_ADMIN`. Displays auditor remarks and a "Revise & Resubmit" button.
  3. **"New Travel Request" CTA & `<NewTravelRequestModal />`**:
     - Toggle between **Case 1 (Already Travelled - Post-trip Reimbursement)** and **Case 2 (Upcoming Travel - Pre-trip Authorization)**.
     - Inputs: Title, Purpose, Project Code, Origin, Destination, Departure Date, Return Date, Emergency Contact.
     - Upfront Proof URL: Tax Invoice/Receipt URL for Case 1; Itinerary Quotation URL for Case 2.
     - Dynamic Itemized Expenses: Rows with Category (`FLIGHT`, `HOTEL`, `MEALS_PER_DIEM`, `TRANSIT`, `MISC`), Merchant, and Amount in INR.
     - Live Summation: Displays total with formatted `₹` tabular numerals.
  4. **Travel Requests Table**:
     - Columns: ID/Title, Type, Dates, Destination, Expenses (`₹`), Status Badge, Actions (`View Details`, `Resubmit`).
  5. **`<TravelDetailDrawer />`**: Slide-over drawer displaying complete request metadata, itemized expenses, timeline audit log, and proof attachment link/preview.
  6. **`<ResubmitRequestModal />`**: Form allowing modifying itemized expenses and proof URL, explicitly displaying feedback comments from the reviewer.

### 5.4 Manager Queue Portal: `<ManagerQueuePortal />`
- **Location**: `client/src/features/travel/components/ManagerQueuePortal.tsx`
- **Sub-components**:
  1. **Audit Queue Table**: Lists requests from direct reports in `SUBMITTED` or `PENDING_MANAGER_REVIEW`.
  2. **Empty Queue State**: *"All caught up! No travel requests currently require your review."*
  3. **`<ManagerAuditDrawer />`**:
     - Displays full employee submission details and itemized breakdown.
     - **Proof Inspector**: Displays uploaded tax invoice/receipt or quote image proof with preview.
     - **Audit Actions**:
       - *Approve & Forward*: Calls `POST /api/travel/requests/:id/manager-review` with action `'APPROVE'`, transitioning to `PENDING_ADMIN_APPROVAL`.
       - *Request Changes*: Calls `POST /api/travel/requests/:id/manager-review` with action `'REQUEST_REVISION'`, transitioning to `REVISION_REQUESTED_MANAGER` with required feedback comments.

### 5.5 Admin Governance Portal: `<AdminGovernancePortal />`
- **Location**: `client/src/features/travel/components/AdminGovernancePortal.tsx`
- **Sub-components**:
  1. **`<DepartmentBudgetCard />`**:
     - Visual headroom gauge showing Total Allocation (`₹35,00,000.00`), Utilized Amount, and Remaining Headroom in Indian Rupees (`₹`).
     - Live indicator showing financial health and headroom remaining.
  2. **Executive Clearance Queue Table**: Lists requests currently in `PENDING_ADMIN_APPROVAL`.
  3. **`<AdminGovernanceDrawer />`**:
     - Displays manager audit history and timeline events.
     - Budget Headroom Check: Highlights whether request amount fits within department remaining headroom.
     - **Executive Actions**:
       - *Settle Reimbursement (Case 1)*: Calls `POST /api/travel/requests/:id/admin-review` with action `'SETTLE'`, transitioning to `SETTLED`.
       - *Grant Clearance (Case 2)*: Calls `POST /api/travel/requests/:id/admin-review` with action `'APPROVE'`, transitioning to `APPROVED`.
       - *Request Alterations*: Opens `<DualRouteRevisionModal />`.
  4. **`<DualRouteRevisionModal />`**:
     - Provides two revision dispatch choices:
       - **Route A (via Manager)**: Admin dispatches revision instructions to Manager (`target_role = 'MANAGER'`).
       - **Route B (direct to Employee)**: Admin dispatches revision instructions directly to Employee (`target_role = 'EMPLOYEE'`).
     - **Invariant Enforced**: In both cases, upon employee resubmission, status transitions to `PENDING_MANAGER_REVIEW`, guaranteeing manager re-audit before admin clearance.

---

## 6. Implementation Task Breakdown

| Task | Title | Description | Est. Hours |
|---|---|---|---|
| **Task 7A** | Auth Role Contract Sync | Update `auth.repository.ts`, `auth.service.ts`, and client `auth.types.ts` to return `role` and `department`. | 1.0 hr |
| **Task 7B** | Employee Portal & Modals | Implement `EmployeeTravelPortal.tsx`, `NewTravelRequestModal.tsx`, itemized INR table, and `ResubmitRequestModal.tsx`. | 2.5 hrs |
| **Task 8A** | Dynamic Dashboard Controller | Implement `DashboardPage.tsx` role router and shared `TripFlowHeader.tsx`. | 1.0 hr |
| **Task 8B** | Manager Audit Queue | Implement `ManagerQueuePortal.tsx` and `ManagerAuditDrawer.tsx` with Proof Inspector. | 1.5 hrs |
| **Task 8C** | Admin Governance Hub | Implement `AdminGovernancePortal.tsx`, `DepartmentBudgetCard.tsx`, and `DualRouteRevisionModal.tsx`. | 2.0 hrs |
| **Task 9** | E2E Governance Verification | Write and run `server/test-travel-e2e.ts` verifying Case 1 & Case 2 multi-role lifecycles and revision invariants. | 1.5 hrs |

---

## 7. Verification Gates

1. **Client Build Check**: `npm run build` succeeds with 0 TypeScript/Vite errors.
2. **Client Unit Tests**: Currency formatters (`₹`), avatar initials, and auth validation pass 100%.
3. **Automated E2E Test**: `server/test-travel-e2e.ts` verifies:
   - Case 1: Submit $\rightarrow$ Manager revision $\rightarrow$ Employee resubmit $\rightarrow$ Manager approve $\rightarrow$ Admin settle (`SETTLED`).
   - Case 2: Submit $\rightarrow$ Manager approve $\rightarrow$ Admin Route B revision $\rightarrow$ Employee resubmit $\rightarrow$ Manager re-approve $\rightarrow$ Admin approve (`APPROVED`).
   - Zero bypass invariant: employee resubmission strictly routes to Manager first.
4. **Design Invariant Audit**: Zero circular status dots (`●`), Warm Storycraft palette, monospace tabular figures for all currency values.
