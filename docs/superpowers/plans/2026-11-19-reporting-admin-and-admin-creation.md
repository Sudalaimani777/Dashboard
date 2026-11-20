# Reporting Admin & Admin User Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Reporting Admin assignment for Managers, allow Admins to create and promote other Admins, and auto-route Manager personal trips and approved team escalations to their designated Reporting Admin.

**Architecture:** Extend PostgreSQL `users` with `reporting_admin_id UUID REFERENCES users(id)` and migration `007`. Update backend validation, repository joins, and travel service lifecycle so that Manager trips start directly in `PENDING_ADMIN_APPROVAL` assigned to their Reporting Admin, and approved employee trips automatically route to the Manager's Reporting Admin. Provide dynamic supervisor selection and Admin role options in frontend forms.

**Tech Stack:** Node.js, Express 5, PostgreSQL (`pg`), TypeScript, React 19, Tailwind CSS v4, Lucide React, Zod, React Hook Form, Tsx test runner, Oxlint.

**Spec:** [2026-11-19-reporting-admin-and-admin-creation-design.md](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/docs/superpowers/specs/2026-11-19-reporting-admin-and-admin-creation-design.md)

## Global Constraints

- Retain strict BOLA authorization guards: Requesters cannot audit or approve their own travel requests under any circumstances.
- `manager_id` on users is reserved for Employee -> Manager reporting.
- `reporting_admin_id` on users is reserved for Manager -> Admin reporting.
- Admin users have neither `manager_id` nor `reporting_admin_id`.
- Maintain full backward compatibility for existing travel requests where `admin_id` or `reporting_admin_id` is null.
- Zero Oxlint errors on client and 0 TypeScript compilation errors on both client and server.

## Review Focus

1. **Manager Trip Initial Status**: Manager personal trip submission starts in `PENDING_ADMIN_APPROVAL` rather than `PENDING_MANAGER_REVIEW` to eliminate self-review deadlocks.
2. **Targeted Notifications**: Notifications for Manager trips and forwarded team trips must target the specific Reporting Admin; if none assigned, gracefully fallback to active Admins.
3. **Hierarchy Integrity**: Ensure an Employee cannot be assigned a `reporting_admin_id` and a Manager cannot be assigned a `manager_id`.
4. **Self-Assignment Guard**: Ensure a user cannot be assigned as their own reporting admin.
5. **Form Reactivity**: In `NewUserPage.tsx` and `UserFormModal.tsx`, switching roles dynamically clears and updates the supervisor options without stale state.

---

### Task 1: Database Migration for Reporting Admin

**Files:**
- Create: `server/src/shared/db/migrations/007_add_reporting_admin.sql`
- Modify: `server/tests/db-migration.test.ts`

- [ ] **Step 1: Write migration SQL script**
  Create `server/src/shared/db/migrations/007_add_reporting_admin.sql`:
  ```sql
  DO $$ 
  BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reporting_admin_id UUID REFERENCES users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_users_reporting_admin ON users(reporting_admin_id);
  EXCEPTION
      WHEN OTHERS THEN NULL;
  END $$;
  ```

- [ ] **Step 2: Add migration verification test**
  Update `server/tests/db-migration.test.ts` to assert that migration 007 runs cleanly and column `reporting_admin_id` exists in `information_schema.columns`.

- [ ] **Step 3: Run migration test and verify**
  Run: `npx --prefix server tsx tests/db-migration.test.ts`
  Confirm exit code 0.

---

### Task 2: Backend User Types, Validation & TDD Test Suite

**Files:**
- Modify: `server/src/features/users/users.types.ts`
- Modify: `server/src/features/users/users.validation.ts`
- Create: `server/tests/users-reporting-admin.test.ts`

- [ ] **Step 1: Write failing TDD tests in `users-reporting-admin.test.ts`**
  Assert:
  1. `validateCreateUserInput` accepts `role: 'ADMIN'`.
  2. `validateCreateUserInput` accepts `role: 'MANAGER'` with valid `reportingAdminId`.
  3. `validateCreateUserInput` forces `reportingAdminId = null` for `EMPLOYEE` and `ADMIN`.
  4. `validateCreateUserInput` forces `managerId = null` for `MANAGER` and `ADMIN`.
  5. `validateUpdateUserInput` permits updating `reportingAdminId` and promoting to `'ADMIN'`.

- [ ] **Step 2: Run test to confirm failure**
  Run: `npx --prefix server tsx tests/users-reporting-admin.test.ts`
  Confirm failure due to `'ADMIN'` rejection and missing `reportingAdminId`.

- [ ] **Step 3: Update `users.types.ts` and `users.validation.ts`**
  - Add `reportingAdminId?: string | null` to `CreateManagedUserDto` and `UpdateManagedUserDto`.
  - Add `reporting_admin_id` and `reporting_admin_name` to `UserDirectoryItem`.
  - Update `validateCreateUserInput` and `validateUpdateUserInput` to allow `'ADMIN'` and handle `reportingAdminId`.

- [ ] **Step 4: Re-run tests and confirm passing**
  Run: `npx --prefix server tsx tests/users-reporting-admin.test.ts`
  Confirm all tests pass.

---

### Task 3: Backend Users Repository & Service

**Files:**
- Modify: `server/src/features/users/users.repository.ts`
- Modify: `server/src/features/users/users.service.ts`

- [ ] **Step 1: Update repository query joins**
  In `server/src/features/users/users.repository.ts`:
  - Update `USER_DIRECTORY_SELECT` to left join `users adm ON u.reporting_admin_id = adm.id` and select `u.reporting_admin_id, adm.name AS reporting_admin_name`.
  - Update `createUser` to accept `reportingAdminId: string | null` and insert into `reporting_admin_id`.
  - Update `updateUser` to support updating `reporting_admin_id`.

- [ ] **Step 2: Update `users.service.ts`**
  - In `createManagedUser`: pass `validated.reportingAdminId` to repository.
  - In `updateManagedUser`: pass `validated.reportingAdminId` to repository.

- [ ] **Step 3: Verify user lifecycle tests**
  Run: `npx --prefix server tsx tests/user-lifecycle-deletion-guard.test.ts`
  Confirm all tests pass with code 0.

---

### Task 4: Travel Workflow & Auto-Routing Engine

**Files:**
- Modify: `server/src/features/travel/travel.service.ts`
- Create: `server/tests/travel-reporting-admin-routing.test.ts`

- [ ] **Step 1: Write failing TDD test for travel routing**
  In `server/tests/travel-reporting-admin-routing.test.ts`:
  1. Test: Manager submits travel request $\rightarrow$ status is immediately `PENDING_ADMIN_APPROVAL` and `admin_id` is set to Manager's `reporting_admin_id`.
  2. Test: Targeted notification is dispatched to Manager's `reporting_admin_id`.
  3. Test: Manager approves Employee trip $\rightarrow$ request transitions to `PENDING_ADMIN_APPROVAL` with `admin_id` set to Manager's `reporting_admin_id`.

- [ ] **Step 2: Run test to confirm failure**
  Run: `npx --prefix server tsx tests/travel-reporting-admin-routing.test.ts`
  Confirm test fails.

- [ ] **Step 3: Update `TravelService.createRequest`**
  In `server/src/features/travel/travel.service.ts`:
  - When requester is a `MANAGER`:
    - Fetch requester's `reporting_admin_id`.
    - If not draft, set status to `PENDING_ADMIN_APPROVAL` (Option A).
    - Set `admin_id = requester.reporting_admin_id`.
    - Dispatch targeted `MANAGER_OVERSIGHT` notification to `reporting_admin_id` (fallback to all admins if null).

- [ ] **Step 4: Update `TravelService.managerReview`**
  In `server/src/features/travel/travel.service.ts`:
  - When manager approves and transitions request to `PENDING_ADMIN_APPROVAL`:
    - Fetch manager's `reporting_admin_id`.
    - If manager has `reporting_admin_id`:
      - Set `travel_requests.admin_id = manager.reporting_admin_id`.
      - Send `PENDING_ADMIN_APPROVAL` notification directly to `manager.reporting_admin_id`.

- [ ] **Step 5: Run travel tests and confirm passing**
  Run: `npx --prefix server tsx tests/travel-reporting-admin-routing.test.ts`
  Run: `npm --prefix server run test:fsm`
  Confirm all 47 FSM tests and routing tests pass.

---

### Task 5: Client User Schemas & API Integration

**Files:**
- Modify: `client/src/features/users/schemas/users.schema.ts`
- Modify: `client/src/features/users/utils/users.utils.ts`
- Modify: `client/src/features/users/services/users.api.ts`
- Create: `client/tests/users-schema-admin.test.ts`

- [ ] **Step 1: Write client schema test**
  In `client/tests/users-schema-admin.test.ts`:
  - Verify `createUserSchema` accepts `role: 'ADMIN'` and optional `reportingAdminId`.
  - Verify `updateUserSchema` accepts `role: 'ADMIN'` and optional `reportingAdminId`.

- [ ] **Step 2: Update `client/src/features/users/schemas/users.schema.ts`**
  - Update `createUserSchema`:
    - `role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN'])`
    - `reportingAdminId: z.string().optional().nullable()`
  - Update `updateUserSchema`:
    - `role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN'])`
    - `reportingAdminId: z.string().optional().nullable()`

- [ ] **Step 3: Update `users.utils.ts` and `users.api.ts`**
  - Add `reporting_admin_id` and `reporting_admin_name` to `DirectoryUser`.
  - Add `reportingAdminId` to `CreateUserPayload` and `UpdateUserPayload`.

- [ ] **Step 4: Run schema test and verify**
  Run: `npx --prefix server tsx client/tests/users-schema-admin.test.ts`
  Confirm passing.

---

### Task 6: Frontend UI Components for Admin & Reporting Admin

**Files:**
- Modify: `client/src/features/users/pages/NewUserPage.tsx`
- Modify: `client/src/features/users/components/UserFormModal.tsx`
- Modify: `client/src/features/users/pages/AdminUsersPage.tsx`

- [x] **Step 1: Update `NewUserPage.tsx`**
  - Add `<option value="ADMIN">Administrator</option>` to role select.
  - Separate state/lists for `managers` and `admins`.
  - When `role === 'EMPLOYEE'`: show "Reporting Manager" selector.
  - When `role === 'MANAGER'`: show "Reporting Admin" selector with explanatory subtitle.
  - When `role === 'ADMIN'`: hide supervisor dropdown and show executive description.
  - In `onSubmit`: pass `managerId` for Employee and `reportingAdminId` for Manager.

- [x] **Step 2: Update `UserFormModal.tsx`**
  - Allow selecting `ADMIN` for role.
  - Show "Reporting Admin" dropdown when role is `MANAGER`.
  - Show "Reporting Manager" dropdown when role is `EMPLOYEE`.
  - Pass updated supervisor ID on submit.

- [x] **Step 3: Update `AdminUsersPage.tsx`**
  - Display assigned supervisor chip in directory table:
    - Employee: `Manager: [Name]`
    - Manager: `Admin: [Name]`
    - Admin: `Executive`

---

### Task 7: Full Test Suite, Linting & Build Verification

**Files:**
- Run: Client tests, Server tests, Lint, Build

- [x] **Step 1: Run all client tests**
  Run: `npx --prefix server tsx client/tests/sidebar-nav.test.ts`
  Run: `npx --prefix server tsx client/tests/users-schema-admin.test.ts`

- [x] **Step 2: Run all server tests**
  Run: `npm --prefix server run test:fsm`
  Run: `npx --prefix server tsx tests/users-reporting-admin.test.ts`
  Run: `npx --prefix server tsx tests/travel-reporting-admin-routing.test.ts`

- [x] **Step 3: Run client linter**
  Run: `npm --prefix client run lint`
  Verify 0 errors.

- [x] **Step 4: Run client and server builds**
  Run: `npm --prefix client run build`
  Run: `npm --prefix server run build`
  Confirm both exit with code 0.
