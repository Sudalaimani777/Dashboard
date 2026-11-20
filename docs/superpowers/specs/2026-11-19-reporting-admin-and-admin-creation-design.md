# Reporting Admin & Admin User Creation Specification

**Date:** 2026-11-19  
**Status:** Approved  
**Author:** Antigravity Engineering  

---

## 1. Problem Statement

1. **Manager Oversight Vacuum**: When an Admin onboards a Manager, no supervisor is assigned (`manager_id = null`). When that Manager submits personal travel, the request enters `PENDING_MANAGER_REVIEW` and broadcasts a generic notification to all active Admins. The manager cannot review their own request, leaving it in an ambiguous state without an assigned reviewer.
2. **Missing Admin Creation Capability**: When an Admin creates a new team member (`/admin/users/new`), the role choices are constrained to `EMPLOYEE` and `MANAGER`. The system blocks creating or elevating users to `ADMIN`.
3. **Disjointed Approval Escalation**: When a Manager approves an Employee's trip (`APPROVE_AND_FORWARD`), it enters `PENDING_ADMIN_APPROVAL` with `admin_id = null`, losing the organizational line-of-reporting to the Manager's direct supervisor.

---

## 2. Goals & Success Criteria

1. **Role Hierarchy**:
   - `EMPLOYEE`: Reports to a designated line `manager_id` (Manager).
   - `MANAGER`: Reports to a designated `reporting_admin_id` (Admin).
   - `ADMIN`: Executive root; reports to no one.
2. **Admin Creation & Promotion**:
   - Admins can onboard new users with the `ADMIN` role.
   - Admins can edit existing users and promote them to `ADMIN`.
3. **Manager Travel Routing (Option A)**:
   - When a Manager submits a travel request, it starts directly in **`PENDING_ADMIN_APPROVAL`** (bypassing redundant Tier 1 self-audit).
   - Pre-assigns `travel_requests.admin_id` to the Manager's `reporting_admin_id`.
   - Sends a targeted notification directly to that specific Reporting Admin.
4. **Employee Forwarding Auto-Routing**:
   - When a Manager reviews and approves an Employee's travel request (`APPROVE_AND_FORWARD`), the system retrieves the Manager's `reporting_admin_id` and automatically routes the trip to that designated Admin by setting `travel_requests.admin_id = manager.reporting_admin_id`.
   - Sends the executive clearance notification directly to that designated Admin.

---

## 3. Database Schema (`server/src/shared/db/migrations/007_add_reporting_admin.sql`)

```sql
-- Migration 007: Add reporting_admin_id to users table
DO $$ 
BEGIN
    -- 1. Add reporting_admin_id column referencing users(id)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reporting_admin_id UUID REFERENCES users(id) ON DELETE SET NULL;
    
    -- 2. Index for fast hierarchy lookups
    CREATE INDEX IF NOT EXISTS idx_users_reporting_admin ON users(reporting_admin_id);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
```

---

## 4. Backend Architecture

### 4.1 Type Definitions (`server/src/features/users/users.types.ts`)
```ts
export type ManagedUserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: ManagedUserRole;
  department: string;
  manager_id: string | null;
  manager_name: string | null;
  reporting_admin_id: string | null;
  reporting_admin_name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateManagedUserDto {
  name: string;
  email: string;
  password: string;
  role: ManagedUserRole;
  department: string;
  managerId?: string | null;
  reportingAdminId?: string | null;
}

export interface UpdateManagedUserDto {
  role?: ManagedUserRole;
  department?: string;
  managerId?: string | null;
  reportingAdminId?: string | null;
  isActive?: boolean;
}
```

### 4.2 Validation Logic (`server/src/features/users/users.validation.ts`)
- Allow `role` to be `'EMPLOYEE'`, `'MANAGER'`, or `'ADMIN'`.
- Validate role-based reporting assignments:
  - `role === 'EMPLOYEE'`: `managerId` is optional/UUID; `reportingAdminId` is forced to `null`.
  - `role === 'MANAGER'`: `managerId` is forced to `null`; `reportingAdminId` is optional/UUID.
  - `role === 'ADMIN'`: both `managerId` and `reportingAdminId` are forced to `null`.
- Prevent self-assignment (`reportingAdminId !== userId`).

### 4.3 Repository Queries (`server/src/features/users/users.repository.ts`)
- `USER_DIRECTORY_SELECT`:
  ```sql
  SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.department,
    u.manager_id,
    u.reporting_admin_id,
    u.is_active,
    m.name AS manager_name,
    adm.name AS reporting_admin_name,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN users m ON u.manager_id = m.id
  LEFT JOIN users adm ON u.reporting_admin_id = adm.id
  ```
- `createUser`: inserts `reporting_admin_id`.
- `updateUser`: supports updating `reporting_admin_id`.

### 4.4 Travel Workflow Engine (`server/src/features/travel/travel.service.ts`)
1. **Manager Trip Submission**:
   - Check `requester.role === 'MANAGER'`.
   - Set status to `PENDING_ADMIN_APPROVAL` (Option A).
   - If `requester.reporting_admin_id` exists, set `travel_requests.admin_id = requester.reporting_admin_id`.
   - Dispatch `MANAGER_OVERSIGHT` / `TRAVEL_SUBMITTED` notification directly to `requester.reporting_admin_id`. If none assigned, fallback to all active admins.
2. **Manager Approval Auto-Routing**:
   - In `managerReview()`:
     - Fetch the reviewing manager's record: `SELECT reporting_admin_id FROM users WHERE id = $1`.
     - When transitioning to `PENDING_ADMIN_APPROVAL`, if manager has `reporting_admin_id`:
       - Update request: `admin_id = manager.reporting_admin_id`.
       - Dispatch `PENDING_ADMIN_APPROVAL` notification to that specific Reporting Admin.

---

## 5. Frontend Architecture

### 5.1 Zod Schemas (`client/src/features/users/schemas/users.schema.ts`)
- `createUserSchema`:
  - `role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN'])`
  - `managerId: z.string().optional().nullable()`
  - `reportingAdminId: z.string().optional().nullable()`
- `updateUserSchema`:
  - `role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN'])`
  - `managerId: z.string().optional().nullable()`
  - `reportingAdminId: z.string().optional().nullable()`

### 5.2 Add Team Member Page (`client/src/features/users/pages/NewUserPage.tsx`)
- Account Role dropdown: options for `Employee`, `Manager`, and `Administrator`.
- Dynamic Supervisor Field:
  - If `role === 'EMPLOYEE'`: Displays **Reporting Manager** dropdown (options populated from active Managers).
  - If `role === 'MANAGER'`: Displays **Reporting Admin** dropdown (options populated from active Admins).
  - If `role === 'ADMIN'`: Hides supervisor field (shows explanatory helper: *"Administrators have global executive governance access"*).

### 5.3 Edit Member Modal (`client/src/features/users/components/UserFormModal.tsx`)
- Allow selecting `ADMIN` role.
- Dynamic supervisor selection based on role.

### 5.4 Directory & Governance Queue
- `AdminUsersPage.tsx`:
  - Supervisor column shows:
    - *"Manager: [Name]"* for Employees
    - *"Admin: [Name]"* for Managers
    - *"Executive"* for Admins
- `AdminGovernancePortal.tsx`:
  - Displays assigned executive reviewer badge on travel requests.

---

## 6. Security & Invariants
- **BOLA Protection**: Requesters cannot audit or approve their own travel requests, even if they hold an Admin role.
- **Hierarchy Validation**:
  - Employee `managerId` must be a user with `role === 'MANAGER'`.
  - Manager `reportingAdminId` must be a user with `role === 'ADMIN'`.
- **Session & Role Safety**: Existing active session invalidation guards apply when a user role is changed.
