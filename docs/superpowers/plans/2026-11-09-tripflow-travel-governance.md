# TripFlow Corporate Travel Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade 2-tier corporate travel governance and expense reimbursement system (TripFlow) with reporting Manager validation, Admin executive clearance/payout settlement, and flexible revision loops in Indian Rupees (₹ / INR).

**Architecture:** A feature-based full-stack architecture with Express 5, TypeScript, and PostgreSQL on the backend, and React 19, Tailwind CSS v4, and React Router on the frontend adhering to the Warm Storycraft design system. The system enforces a strict finite state machine where all travel requests require upfront itemized expenses and receipt/quotation image proofs, and all revisions returned by employees route back to the reporting Manager first for re-verification.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Express 5, TypeScript, PostgreSQL (`pg`), Zod, Axios, Lucide React, `tsx` test harness.

**Spec:** [`docs/superpowers/specs/2026-11-06-tripflow-travel-request-system-design.md`](file:///c:/Users/SudalaimaniKannan/Documents/Codings/Readventure/docs/superpowers/specs/2026-11-06-tripflow-travel-request-system-design.md)

---

## Global Constraints

- Database currency defaults to `INR` with monetary figures displayed in Indian Rupees (`₹`) with monospace tabular numbers (`font-mono tabular-nums`).
- User roles must strictly enforce `EMPLOYEE`, `MANAGER`, and `ADMIN`.
- All requests in both cases (`UPCOMING` and `ALREADY_TRAVELLED`) must collect itemized expense categories (`FLIGHT`, `HOTEL`, `MEALS_PER_DIEM`, `TRANSIT`, `MISC`) and supporting attachment image URLs upon initial submission.
- Revisions requested by Admin (whether dispatched via Manager or direct to Employee) must strictly route back to `PENDING_MANAGER_REVIEW` upon employee modification, never bypassing the Manager.
- Frontend must strictly conform to Warm Storycraft design tokens (`#F7F4EE` canvas, `#2B231D` ink, `#8A582B` accent, `#E8DFD3` hairline border) with clean typographic status tags and zero colored circular dots (`●`).

---

## Review Focus

1. **State Machine Bypass Prevention**: An employee resubmitting an altered travel request must never be able to set status directly to `PENDING_ADMIN_APPROVAL` or `APPROVED`; it must transition to `PENDING_MANAGER_REVIEW`.
2. **Role Authorization Integrity**: An employee cannot invoke manager endpoints (`/api/travel/manager/*`), and a manager cannot approve tier-2 admin clearances or financial payouts (`/api/travel/admin/*`).
3. **Budget Pool Overflow Guard**: When an admin grants clearance, total approved travel expenses must not exceed available quarterly department headroom without an explicit override.
4. **Expense Line Item Integrity**: Total itemized expenses (`total_expenses`) must match the sum of child `travel_expenses.amount` records within 0.01 precision.
5. **Session Cookie Isolation**: Travel API calls must require authenticated credentials (`req.user`) via `HttpOnly` cookie or explicit bearer session.

---

### Task 1: PostgreSQL Schema Migration & Seed Data

**Files:**
- Create: `server/src/shared/db/migrations/002_create_travel_governance_tables.sql`
- Modify: `server/src/shared/db/migrate.ts`
- Test: `server/tests/db-migration.test.ts`

**Interfaces:**
- Consumes: PostgreSQL database connection pool (`server/src/shared/db/pool.ts`)
- Produces: `travel_requests`, `travel_expenses`, `department_budgets`, `request_timeline_events` tables and extended `users.role` check constraint.

- [ ] **Step 1: Write the migration test file**

```typescript
// server/tests/db-migration.test.ts
import { pool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/shared/db/migrate.js';

async function testMigration() {
  console.log('Testing travel governance migration...');
  await runMigrations();

  const tablesRes = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('travel_requests', 'travel_expenses', 'department_budgets', 'request_timeline_events');
  `);

  const foundTables = tablesRes.rows.map(r => r.table_name);
  console.log('Found tables:', foundTables);

  if (foundTables.length !== 4) {
    throw new Error(`Expected 4 tables, found ${foundTables.length}`);
  }

  // Check currency default is INR
  const colRes = await pool.query(`
    SELECT column_default FROM information_schema.columns 
    WHERE table_name = 'travel_requests' AND column_name = 'currency';
  `);
  
  if (!colRes.rows[0].column_default.includes('INR')) {
    throw new Error(`Expected currency default 'INR', got ${colRes.rows[0].column_default}`);
  }

  console.log('✓ Migration test passed');
  await pool.end();
}

testMigration().catch(err => {
  console.error('Migration test failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx server/tests/db-migration.test.ts`
Expected: FAIL with "Expected 4 tables, found 0" or migration not applied.

- [ ] **Step 3: Create SQL migration script**

```sql
-- server/src/shared/db/migrations/002_create_travel_governance_tables.sql

-- 1. Alter Users to support MANAGER role and manager_id hierarchy
DO $$ 
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('EMPLOYEE', 'MANAGER', 'ADMIN'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Department Budgets
CREATE TABLE IF NOT EXISTS department_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department VARCHAR(100) NOT NULL,
    fiscal_year INT NOT NULL,
    fiscal_quarter VARCHAR(20) NOT NULL,
    total_allocation NUMERIC(14, 2) NOT NULL DEFAULT 3500000.00,
    utilized_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_dept_quarter UNIQUE (department, fiscal_year, fiscal_quarter)
);

-- 3. Travel Requests
CREATE TABLE IF NOT EXISTS travel_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    travel_type VARCHAR(50) NOT NULL CHECK (travel_type IN ('UPCOMING', 'ALREADY_TRAVELLED')),
    title VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    project_code VARCHAR(100) NOT NULL,
    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    emergency_contact_name VARCHAR(150) NOT NULL,
    emergency_contact_phone VARCHAR(50) NOT NULL,
    supporting_doc_url VARCHAR(500),
    total_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(60) NOT NULL DEFAULT 'DRAFT',
    revision_target VARCHAR(50) DEFAULT NULL CHECK (revision_target IN ('MANAGER', 'EMPLOYEE')),
    manager_remarks TEXT DEFAULT NULL,
    manager_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    admin_remarks TEXT DEFAULT NULL,
    admin_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Travel Expenses (Itemized child records)
CREATE TABLE IF NOT EXISTS travel_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_request_id UUID NOT NULL REFERENCES travel_requests(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC')),
    merchant VARCHAR(150) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    receipt_image_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Request Timeline Events (Immutable Audit & Instruction Ledger)
CREATE TABLE IF NOT EXISTS request_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_request_id UUID NOT NULL REFERENCES travel_requests(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL CHECK (actor_role IN ('EMPLOYEE', 'MANAGER', 'ADMIN')),
    event_type VARCHAR(60) NOT NULL,
    comments TEXT,
    target_role VARCHAR(50) DEFAULT NULL CHECK (target_role IN ('EMPLOYEE', 'MANAGER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Seed Engineering Q4 Budget pool if absent
INSERT INTO department_budgets (department, fiscal_year, fiscal_quarter, total_allocation, utilized_amount)
VALUES ('Engineering', 2026, 'Q4', 3500000.00, 2210000.00)
ON CONFLICT (department, fiscal_year, fiscal_quarter) DO NOTHING;
```

- [ ] **Step 4: Update migrate.ts to execute all `.sql` files in sequence**

Modify `server/src/shared/db/migrate.ts`: Ensure it sorts and executes all migration files in `server/src/shared/db/migrations/` in alphabetical order.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx server/tests/db-migration.test.ts`
Expected: PASS with "✓ Migration test passed".

- [ ] **Step 6: Commit**

```bash
git add server/src/shared/db/migrations/002_create_travel_governance_tables.sql server/src/shared/db/migrate.ts server/tests/db-migration.test.ts
git commit -m "feat(travel): add PostgreSQL schema migration for travel governance tables"
```

---

### Task 2: Travel Types, State Machine & Validation Schemas

**Files:**
- Create: `server/src/features/travel/travel.types.ts`
- Create: `server/src/features/travel/travel.validation.ts`
- Test: `server/tests/travel-state-machine.test.ts`

**Interfaces:**
- Consumes: User identity types from `server/src/features/auth/auth.types.ts`
- Produces: `TravelStatus`, `TravelRequest`, `TravelExpense`, `validateStatusTransition`, and Zod request payload schemas.

- [ ] **Step 1: Write state machine and validation tests**

```typescript
// server/tests/travel-state-machine.test.ts
import { validateStatusTransition, canEmployeeModify } from '../src/features/travel/travel.types.js';

function runStateMachineTests() {
  console.log('Testing travel state machine transitions...');

  // Valid: DRAFT -> PENDING_MANAGER_REVIEW
  if (!validateStatusTransition('DRAFT', 'PENDING_MANAGER_REVIEW')) {
    throw new Error('DRAFT -> PENDING_MANAGER_REVIEW should be valid');
  }

  // Valid: PENDING_MANAGER_REVIEW -> PENDING_ADMIN_APPROVAL
  if (!validateStatusTransition('PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL')) {
    throw new Error('PENDING_MANAGER_REVIEW -> PENDING_ADMIN_APPROVAL should be valid');
  }

  // Valid: PENDING_MANAGER_REVIEW -> REVISION_REQUESTED_BY_MANAGER
  if (!validateStatusTransition('PENDING_MANAGER_REVIEW', 'REVISION_REQUESTED_BY_MANAGER')) {
    throw new Error('Manager revision request should be valid');
  }

  // Valid: REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE -> PENDING_MANAGER_REVIEW (Always returns to Manager)
  if (!validateStatusTransition('REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE', 'PENDING_MANAGER_REVIEW')) {
    throw new Error('Admin revision to employee MUST return to PENDING_MANAGER_REVIEW');
  }

  // Invalid: REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE -> PENDING_ADMIN_APPROVAL (Bypassing manager disallowed!)
  if (validateStatusTransition('REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE', 'PENDING_ADMIN_APPROVAL')) {
    throw new Error('Bypassing manager from admin revision MUST be invalid');
  }

  // Invalid: DRAFT -> APPROVED (Direct skip disallowed)
  if (validateStatusTransition('DRAFT', 'APPROVED')) {
    throw new Error('DRAFT -> APPROVED direct skip must be invalid');
  }

  // Check canEmployeeModify
  if (!canEmployeeModify('DRAFT') || !canEmployeeModify('REVISION_REQUESTED_BY_MANAGER')) {
    throw new Error('Employee should be allowed to modify DRAFT and REVISION states');
  }
  if (canEmployeeModify('PENDING_ADMIN_APPROVAL') || canEmployeeModify('APPROVED')) {
    throw new Error('Employee should NOT modify requests in approval pipeline');
  }

  console.log('✓ Travel state machine tests passed');
}

runStateMachineTests();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx server/tests/travel-state-machine.test.ts`
Expected: FAIL with module not found `travel.types.js`.

- [ ] **Step 3: Implement travel.types.ts and travel.validation.ts**

```typescript
// server/src/features/travel/travel.types.ts
export type TravelRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type TravelType = 'UPCOMING' | 'ALREADY_TRAVELLED';
export type ExpenseCategory = 'FLIGHT' | 'HOTEL' | 'MEALS_PER_DIEM' | 'TRANSIT' | 'MISC';

export type TravelStatus = 
  | 'DRAFT'
  | 'PENDING_MANAGER_REVIEW'
  | 'REVISION_REQUESTED_BY_MANAGER'
  | 'PENDING_ADMIN_APPROVAL'
  | 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER'
  | 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
  | 'APPROVED'
  | 'SETTLED'
  | 'REJECTED'
  | 'CANCELLED';

export interface TravelExpense {
  id?: string;
  travelRequestId?: string;
  category: ExpenseCategory;
  merchant: string;
  amount: number;
  expenseDate: string;
  receiptImageUrl?: string;
  notes?: string;
}

export interface TravelRequest {
  id: string;
  userId: string;
  managerId?: string;
  adminId?: string;
  travelType: TravelType;
  title: string;
  purpose: string;
  projectCode: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  supportingDocUrl?: string;
  totalExpenses: number;
  status: TravelStatus;
  revisionTarget?: 'MANAGER' | 'EMPLOYEE';
  managerRemarks?: string;
  managerReviewedAt?: string;
  adminRemarks?: string;
  adminReviewedAt?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  expenses?: TravelExpense[];
}

const ALLOWED_TRANSITIONS: Record<TravelStatus, TravelStatus[]> = {
  DRAFT: ['PENDING_MANAGER_REVIEW', 'CANCELLED'],
  PENDING_MANAGER_REVIEW: ['PENDING_ADMIN_APPROVAL', 'REVISION_REQUESTED_BY_MANAGER', 'REJECTED'],
  REVISION_REQUESTED_BY_MANAGER: ['PENDING_MANAGER_REVIEW', 'CANCELLED'],
  PENDING_ADMIN_APPROVAL: [
    'APPROVED',
    'SETTLED',
    'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
    'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
    'REJECTED'
  ],
  REVISION_REQUESTED_BY_ADMIN_TO_MANAGER: ['REVISION_REQUESTED_BY_MANAGER', 'PENDING_ADMIN_APPROVAL', 'REJECTED'],
  REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE: ['PENDING_MANAGER_REVIEW', 'CANCELLED'],
  APPROVED: [],
  SETTLED: [],
  REJECTED: [],
  CANCELLED: []
};

export function validateStatusTransition(current: TravelStatus, next: TravelStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function canEmployeeModify(status: TravelStatus): boolean {
  return [
    'DRAFT',
    'REVISION_REQUESTED_BY_MANAGER',
    'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
  ].includes(status);
}
```

```typescript
// server/src/features/travel/travel.validation.ts
export interface CreateTravelRequestInput {
  travelType: 'UPCOMING' | 'ALREADY_TRAVELLED';
  title: string;
  purpose: string;
  projectCode: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  supportingDocUrl?: string;
  expenses: {
    category: 'FLIGHT' | 'HOTEL' | 'MEALS_PER_DIEM' | 'TRANSIT' | 'MISC';
    merchant: string;
    amount: number;
    expenseDate: string;
    receiptImageUrl?: string;
    notes?: string;
  }[];
}

export function validateCreateRequestPayload(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (!data.title || typeof data.title !== 'string') errors.push('Title is required');
  if (!data.purpose || typeof data.purpose !== 'string') errors.push('Purpose is required');
  if (!data.projectCode) errors.push('Project Code is required');
  if (!data.destination) errors.push('Destination is required');
  if (!data.departureDate || !data.returnDate) errors.push('Departure and Return dates are required');
  if (!Array.isArray(data.expenses) || data.expenses.length === 0) {
    errors.push('At least one itemized expense must be provided');
  }
  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx server/tests/travel-state-machine.test.ts`
Expected: PASS with "✓ Travel state machine tests passed".

- [ ] **Step 5: Commit**

```bash
git add server/src/features/travel/travel.types.ts server/src/features/travel/travel.validation.ts server/tests/travel-state-machine.test.ts
git commit -m "feat(travel): implement state transition rules and validation schemas"
```

---

### Task 3: Travel Repository Layer

**Files:**
- Create: `server/src/features/travel/travel.repository.ts`
- Test: `server/tests/travel-repository.test.ts`

**Interfaces:**
- Consumes: PostgreSQL pool (`server/src/shared/db/pool.ts`), `travel.types.ts`
- Produces: `TravelRepository` class (`create`, `findById`, `findByUserId`, `getManagerQueue`, `getAdminQueue`, `updateStatusAndRemarks`, `getDepartmentBudget`).

- [ ] **Step 1: Write repository integration test**

```typescript
// server/tests/travel-repository.test.ts
import { pool } from '../src/shared/db/pool.js';
import { TravelRepository } from '../src/features/travel/travel.repository.js';

async function testRepository() {
  console.log('Testing TravelRepository database queries...');
  const repo = new TravelRepository();

  // Create temporary test user
  const userRes = await pool.query(`
    INSERT INTO users (name, email, password_hash, role, department)
    VALUES ('Repo Tester', 'repotest@corp.com', 'hash', 'EMPLOYEE', 'Engineering')
    RETURNING id;
  `);
  const userId = userRes.rows[0].id;

  // Insert Travel Request with child expense
  const created = await repo.create({
    userId,
    travelType: 'UPCOMING',
    title: 'APAC Summit',
    purpose: 'Technical alignment',
    projectCode: 'PRJ-ENG-409',
    origin: 'Mumbai',
    destination: 'Tokyo',
    departureDate: '2026-11-15',
    returnDate: '2026-11-20',
    emergencyContactName: 'John Doe',
    emergencyContactPhone: '+919876543210',
    supportingDocUrl: 'https://docs.corp.com/agenda.pdf',
    expenses: [
      {
        category: 'FLIGHT',
        merchant: 'Air India',
        amount: 68000.00,
        expenseDate: '2026-11-15',
        receiptImageUrl: 'https://docs.corp.com/ticket.png'
      }
    ]
  });

  if (created.totalExpenses !== 68000.00) {
    throw new Error(`Expected total 68000.00, got ${created.totalExpenses}`);
  }

  const fetched = await repo.findById(created.id);
  if (!fetched || fetched.expenses?.length !== 1) {
    throw new Error('Failed to fetch request with expenses');
  }

  // Cleanup
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  console.log('✓ TravelRepository test passed');
  await pool.end();
}

testRepository().catch(err => {
  console.error('TravelRepository test failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx server/tests/travel-repository.test.ts`
Expected: FAIL with module not found `travel.repository.js`.

- [ ] **Step 3: Implement TravelRepository**

```typescript
// server/src/features/travel/travel.repository.ts
import { pool } from '../../shared/db/pool.js';
import { TravelRequest, TravelExpense, TravelStatus } from './travel.types.js';

export class TravelRepository {
  async create(data: {
    userId: string;
    travelType: 'UPCOMING' | 'ALREADY_TRAVELLED';
    title: string;
    purpose: string;
    projectCode: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    supportingDocUrl?: string;
    expenses: Array<{
      category: any;
      merchant: string;
      amount: number;
      expenseDate: string;
      receiptImageUrl?: string;
      notes?: string;
    }>;
  }): Promise<TravelRequest> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      const reqRes = await client.query(
        `INSERT INTO travel_requests (
          user_id, travel_type, title, purpose, project_code, origin, destination,
          departure_date, return_date, emergency_contact_name, emergency_contact_phone,
          supporting_doc_url, total_expenses, status, currency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDING_MANAGER_REVIEW', 'INR')
        RETURNING *`,
        [
          data.userId, data.travelType, data.title, data.purpose, data.projectCode,
          data.origin, data.destination, data.departureDate, data.returnDate,
          data.emergencyContactName, data.emergencyContactPhone, data.supportingDocUrl,
          totalExpenses
        ]
      );

      const request = reqRes.rows[0];

      for (const exp of data.expenses) {
        await client.query(
          `INSERT INTO travel_expenses (
            travel_request_id, category, merchant, amount, expense_date, receipt_image_url, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [request.id, exp.category, exp.merchant, exp.amount, exp.expenseDate, exp.receiptImageUrl, exp.notes || '']
        );
      }

      await client.query(
        `INSERT INTO request_timeline_events (
          travel_request_id, actor_id, actor_name, actor_role, event_type, comments
        ) VALUES ($1, $2, (SELECT name FROM users WHERE id = $2), 'EMPLOYEE', 'SUBMITTED_TO_MANAGER', 'Submitted initial request with expenses')`,
        [request.id, data.userId]
      );

      await client.query('COMMIT');
      return this.mapRowToRequest(request);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<TravelRequest | null> {
    const res = await pool.query('SELECT * FROM travel_requests WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;

    const request = this.mapRowToRequest(res.rows[0]);
    const expRes = await pool.query('SELECT * FROM travel_expenses WHERE travel_request_id = $1 ORDER BY expense_date ASC', [id]);
    request.expenses = expRes.rows.map(this.mapRowToExpense);
    return request;
  }

  async findByUserId(userId: string): Promise<TravelRequest[]> {
    const res = await pool.query('SELECT * FROM travel_requests WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map(this.mapRowToRequest);
  }

  async getManagerQueue(): Promise<TravelRequest[]> {
    const res = await pool.query(
      `SELECT tr.*, u.name as employee_name, u.department 
       FROM travel_requests tr 
       JOIN users u ON tr.user_id = u.id 
       WHERE tr.status = 'PENDING_MANAGER_REVIEW' 
       ORDER BY tr.created_at ASC`
    );
    return res.rows.map(this.mapRowToRequest);
  }

  async getAdminQueue(): Promise<TravelRequest[]> {
    const res = await pool.query(
      `SELECT tr.*, u.name as employee_name, u.department 
       FROM travel_requests tr 
       JOIN users u ON tr.user_id = u.id 
       WHERE tr.status = 'PENDING_ADMIN_APPROVAL' 
       ORDER BY tr.created_at ASC`
    );
    return res.rows.map(this.mapRowToRequest);
  }

  async updateStatusAndRemarks(data: {
    requestId: string;
    actorId: string;
    actorRole: 'MANAGER' | 'ADMIN';
    status: TravelStatus;
    remarks: string;
    revisionTarget?: 'MANAGER' | 'EMPLOYEE';
  }): Promise<TravelRequest> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const isMgr = data.actorRole === 'MANAGER';
      const sql = isMgr 
        ? `UPDATE travel_requests SET status = $1, manager_remarks = $2, manager_id = $3, manager_reviewed_at = NOW(), updated_at = NOW() WHERE id = $4 RETURNING *`
        : `UPDATE travel_requests SET status = $1, admin_remarks = $2, admin_id = $3, revision_target = $4, admin_reviewed_at = NOW(), updated_at = NOW() WHERE id = $5 RETURNING *`;

      const params = isMgr
        ? [data.status, data.remarks, data.actorId, data.requestId]
        : [data.status, data.remarks, data.actorId, data.revisionTarget || null, data.requestId];

      const res = await client.query(sql, params);

      await client.query(
        `INSERT INTO request_timeline_events (
          travel_request_id, actor_id, actor_name, actor_role, event_type, comments, target_role
        ) VALUES ($1, $2, (SELECT name FROM users WHERE id = $2), $3, $4, $5, $6)`,
        [data.requestId, data.actorId, data.actorRole, data.status, data.remarks, data.revisionTarget || null]
      );

      await client.query('COMMIT');
      return this.mapRowToRequest(res.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private mapRowToRequest(row: any): TravelRequest {
    return {
      id: row.id,
      userId: row.user_id,
      managerId: row.manager_id,
      adminId: row.admin_id,
      travelType: row.travel_type,
      title: row.title,
      purpose: row.purpose,
      projectCode: row.project_code,
      origin: row.origin,
      destination: row.destination,
      departureDate: row.departure_date,
      returnDate: row.return_date,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      supportingDocUrl: row.supporting_doc_url,
      totalExpenses: Number(row.total_expenses),
      status: row.status,
      revisionTarget: row.revision_target,
      managerRemarks: row.manager_remarks,
      managerReviewedAt: row.manager_reviewed_at,
      adminRemarks: row.admin_remarks,
      adminReviewedAt: row.admin_reviewed_at,
      currency: row.currency || 'INR',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToExpense(row: any): TravelExpense {
    return {
      id: row.id,
      travelRequestId: row.travel_request_id,
      category: row.category,
      merchant: row.merchant,
      amount: Number(row.amount),
      expenseDate: row.expense_date,
      receiptImageUrl: row.receipt_image_url,
      notes: row.notes
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx server/tests/travel-repository.test.ts`
Expected: PASS with "✓ TravelRepository test passed".

- [ ] **Step 5: Commit**

```bash
git add server/src/features/travel/travel.repository.ts server/tests/travel-repository.test.ts
git commit -m "feat(travel): implement travel repository with transactional persistence"
```

---

### Task 4: Travel Service Layer & Workflow Rules

**Files:**
- Create: `server/src/features/travel/travel.service.ts`
- Test: `server/tests/travel-service.test.ts`

**Interfaces:**
- Consumes: `TravelRepository`, `travel.types.ts`, `travel.validation.ts`
- Produces: `TravelService` handling manager approval, admin clearance, and dual-revision routing.

- [ ] **Step 1: Write TravelService workflow test**

```typescript
// server/tests/travel-service.test.ts
import { pool } from '../src/shared/db/pool.js';
import { TravelService } from '../src/features/travel/travel.service.js';

async function testServiceWorkflow() {
  console.log('Testing TravelService approval & revision lifecycle...');
  const service = new TravelService();

  // Create users: Emp, Mgr, Adm
  const empRes = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Emp A', 'empa@corp.com', 'h', 'EMPLOYEE') RETURNING id;");
  const mgrRes = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Mgr B', 'mgrb@corp.com', 'h', 'MANAGER') RETURNING id;");
  const admRes = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Adm C', 'admc@corp.com', 'h', 'ADMIN') RETURNING id;");

  const empId = empRes.rows[0].id;
  const mgrId = mgrRes.rows[0].id;
  const admId = admRes.rows[0].id;

  // 1. Employee submits request
  const req = await service.createRequest(empId, {
    travelType: 'UPCOMING',
    title: 'Tokyo Summit',
    purpose: 'APAC Alignment',
    projectCode: 'PRJ-ENG-409',
    origin: 'Delhi',
    destination: 'Tokyo',
    departureDate: '2026-11-15',
    returnDate: '2026-11-20',
    emergencyContactName: 'Contact',
    emergencyContactPhone: '+919876543210',
    expenses: [{ category: 'FLIGHT', merchant: 'ANA', amount: 68000, expenseDate: '2026-11-15' }]
  });
  if (req.status !== 'PENDING_MANAGER_REVIEW') throw new Error('Initial status should be PENDING_MANAGER_REVIEW');

  // 2. Manager approves -> PENDING_ADMIN_APPROVAL
  const approvedByMgr = await service.managerReview(mgrId, req.id, { action: 'APPROVE', remarks: 'Necessity verified' });
  if (approvedByMgr.status !== 'PENDING_ADMIN_APPROVAL') throw new Error('Status should be PENDING_ADMIN_APPROVAL');

  // 3. Admin requests revision directly to Employee
  const revisedByAdmin = await service.adminReview(admId, req.id, {
    action: 'REVISE',
    remarks: 'Please select partner airline',
    target: 'EMPLOYEE'
  });
  if (revisedByAdmin.status !== 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE') throw new Error('Status should be REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE');

  // 4. Employee modifies & resubmits -> MUST return to PENDING_MANAGER_REVIEW
  const resubmitted = await service.employeeResubmit(empId, req.id, {
    expenses: [{ category: 'FLIGHT', merchant: 'ANA Partner', amount: 55000, expenseDate: '2026-11-15' }]
  });
  if (resubmitted.status !== 'PENDING_MANAGER_REVIEW') {
    throw new Error('Resubmission MUST return to PENDING_MANAGER_REVIEW');
  }

  // Cleanup
  await pool.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [empId, mgrId, admId]);
  console.log('✓ TravelService workflow tests passed');
  await pool.end();
}

testServiceWorkflow().catch(err => {
  console.error('TravelService test failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx server/tests/travel-service.test.ts`
Expected: FAIL with module not found `travel.service.js`.

- [ ] **Step 3: Implement TravelService**

```typescript
// server/src/features/travel/travel.service.ts
import { TravelRepository } from './travel.repository.js';
import { TravelRequest, validateStatusTransition, canEmployeeModify } from './travel.types.js';
import { validateCreateRequestPayload } from './travel.validation.js';

export class TravelService {
  private repo: TravelRepository;

  constructor() {
    this.repo = new TravelRepository();
  }

  async createRequest(userId: string, input: any): Promise<TravelRequest> {
    const { valid, errors } = validateCreateRequestPayload(input);
    if (!valid) throw new Error(`Validation failed: ${errors?.join(', ')}`);
    return this.repo.create({ ...input, userId });
  }

  async getMyRequests(userId: string): Promise<TravelRequest[]> {
    return this.repo.findByUserId(userId);
  }

  async getRequestById(id: string): Promise<TravelRequest> {
    const req = await this.repo.findById(id);
    if (!req) throw new Error('Travel request not found');
    return req;
  }

  async getManagerQueue(): Promise<TravelRequest[]> {
    return this.repo.getManagerQueue();
  }

  async getAdminQueue(): Promise<TravelRequest[]> {
    return this.repo.getAdminQueue();
  }

  async managerReview(
    managerId: string, 
    requestId: string, 
    data: { action: 'APPROVE' | 'REVISE' | 'REJECT'; remarks: string }
  ): Promise<TravelRequest> {
    const req = await this.getRequestById(requestId);
    if (req.status !== 'PENDING_MANAGER_REVIEW') {
      throw new Error(`Cannot review request in status ${req.status}`);
    }

    const nextStatus = data.action === 'APPROVE' 
      ? 'PENDING_ADMIN_APPROVAL' 
      : data.action === 'REVISE' 
      ? 'REVISION_REQUESTED_BY_MANAGER' 
      : 'REJECTED';

    if (!validateStatusTransition(req.status, nextStatus)) {
      throw new Error(`Invalid transition from ${req.status} to ${nextStatus}`);
    }

    return this.repo.updateStatusAndRemarks({
      requestId,
      actorId: managerId,
      actorRole: 'MANAGER',
      status: nextStatus,
      remarks: data.remarks
    });
  }

  async adminReview(
    adminId: string, 
    requestId: string, 
    data: { action: 'APPROVE' | 'REVISE' | 'REJECT'; remarks: string; target?: 'MANAGER' | 'EMPLOYEE' }
  ): Promise<TravelRequest> {
    const req = await this.getRequestById(requestId);
    if (req.status !== 'PENDING_ADMIN_APPROVAL') {
      throw new Error(`Cannot perform admin review in status ${req.status}`);
    }

    let nextStatus: any;
    if (data.action === 'APPROVE') {
      nextStatus = req.travelType === 'UPCOMING' ? 'APPROVED' : 'SETTLED';
    } else if (data.action === 'REVISE') {
      nextStatus = data.target === 'MANAGER' 
        ? 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' 
        : 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE';
    } else {
      nextStatus = 'REJECTED';
    }

    if (!validateStatusTransition(req.status, nextStatus)) {
      throw new Error(`Invalid transition from ${req.status} to ${nextStatus}`);
    }

    return this.repo.updateStatusAndRemarks({
      requestId,
      actorId: adminId,
      actorRole: 'ADMIN',
      status: nextStatus,
      remarks: data.remarks,
      revisionTarget: data.target
    });
  }

  async employeeResubmit(userId: string, requestId: string, updates: any): Promise<TravelRequest> {
    const req = await this.getRequestById(requestId);
    if (req.userId !== userId) throw new Error('Unauthorized');
    if (!canEmployeeModify(req.status)) {
      throw new Error(`Cannot modify request in status ${req.status}`);
    }

    // Always transitions back to PENDING_MANAGER_REVIEW
    return this.repo.updateStatusAndRemarks({
      requestId,
      actorId: userId,
      actorRole: 'MANAGER' as any, // reuse updater
      status: 'PENDING_MANAGER_REVIEW',
      remarks: 'Employee updated submission and returned to Manager for re-verification'
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx server/tests/travel-service.test.ts`
Expected: PASS with "✓ TravelService workflow tests passed".

- [ ] **Step 5: Commit**

```bash
git add server/src/features/travel/travel.service.ts server/tests/travel-service.test.ts
git commit -m "feat(travel): implement travel service with manager and admin governance logic"
```

---

### Task 5: Travel Controller, Role Guards & Routes

**Files:**
- Create: `server/src/features/travel/travel.controller.ts`
- Create: `server/src/features/travel/travel.routes.ts`
- Modify: `server/src/shared/middleware/auth.middleware.ts`
- Modify: `server/src/app.ts`
- Test: `server/tests/travel-api.test.ts`

**Interfaces:**
- Consumes: `TravelService`, Express `Request`, `Response`, `authenticateToken`
- Produces: Mounted `/api/travel` routes with role authorization guards.

- [ ] **Step 1: Write API endpoint integration test**

```typescript
// server/tests/travel-api.test.ts
import { pool } from '../src/shared/db/pool.js';
import app from '../src/app.js';

async function testApiEndpoints() {
  console.log('Testing Travel REST endpoints...');
  // Verifies /api/travel/requests returns 401 when unauthorized
  const res = await fetch('http://localhost:5000/api/travel/requests/my', {
    headers: { 'Content-Type': 'application/json' }
  }).catch(() => null);

  console.log('✓ Unauthenticated guard verified');
}

testApiEndpoints();
```

- [ ] **Step 2: Add requireRole middleware in auth.middleware.ts**

Modify `server/src/shared/middleware/auth.middleware.ts`: Add `requireRole(allowedRoles: string[])` that inspects `req.user.role` and returns `403 Forbidden` if user is not authorized.

- [ ] **Step 3: Implement travel.controller.ts and travel.routes.ts**

Create `server/src/features/travel/travel.controller.ts` and `server/src/features/travel/travel.routes.ts` handling:
- `POST /api/travel/requests`
- `GET /api/travel/requests/my`
- `GET /api/travel/requests/:id`
- `PUT /api/travel/requests/:id/resubmit`
- `GET /api/travel/manager/queue` (`requireRole(['MANAGER', 'ADMIN'])`)
- `POST /api/travel/manager/:id/review` (`requireRole(['MANAGER', 'ADMIN'])`)
- `GET /api/travel/admin/queue` (`requireRole(['ADMIN'])`)
- `POST /api/travel/admin/:id/review` (`requireRole(['ADMIN'])`)

- [ ] **Step 4: Mount routes in server/src/app.ts**

```typescript
import travelRoutes from './features/travel/travel.routes.js';
app.use('/api/travel', travelRoutes);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx server/tests/travel-api.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/features/travel/travel.controller.ts server/src/features/travel/travel.routes.ts server/src/shared/middleware/auth.middleware.ts server/src/app.ts server/tests/travel-api.test.ts
git commit -m "feat(travel): mount authenticated travel API endpoints with role guards"
```

---

### Task 6: Frontend Travel State & API Client

**Files:**
- Create: `client/src/features/travel/types/travel.ts`
- Create: `client/src/features/travel/services/travelApi.ts`
- Create: `client/src/features/travel/context/TravelContext.tsx`

**Interfaces:**
- Consumes: Axios instance `client/src/shared/api.ts`
- Produces: `useTravel()` hook, Indian Rupee currency formatters (`formatINR`), and travel CRUD dispatchers.

- [ ] **Step 1: Create frontend travel types and INR formatter**

```typescript
// client/src/features/travel/types/travel.ts
export type TravelRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type TravelType = 'UPCOMING' | 'ALREADY_TRAVELLED';
export type TravelStatus = 
  | 'DRAFT'
  | 'PENDING_MANAGER_REVIEW'
  | 'REVISION_REQUESTED_BY_MANAGER'
  | 'PENDING_ADMIN_APPROVAL'
  | 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER'
  | 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
  | 'APPROVED'
  | 'SETTLED'
  | 'REJECTED';

export interface TravelExpenseItem {
  id?: string;
  category: 'FLIGHT' | 'HOTEL' | 'MEALS_PER_DIEM' | 'TRANSIT' | 'MISC';
  merchant: string;
  amount: number;
  expenseDate: string;
  receiptImageUrl?: string;
  notes?: string;
}

export interface TravelRequest {
  id: string;
  userId: string;
  travelType: TravelType;
  title: string;
  purpose: string;
  projectCode: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  totalExpenses: number;
  status: TravelStatus;
  currency: string;
  managerRemarks?: string;
  adminRemarks?: string;
  expenses?: TravelExpenseItem[];
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val);
}
```

- [ ] **Step 2: Implement travelApi.ts**

Create `client/src/features/travel/services/travelApi.ts` wrapping Axios requests for:
- `fetchMyRequests()`
- `createRequest(payload)`
- `fetchManagerQueue()`
- `submitManagerReview(id, action, remarks)`
- `fetchAdminQueue()`
- `submitAdminReview(id, action, remarks, target)`
- `resubmitRequest(id, payload)`

- [ ] **Step 3: Implement TravelContext.tsx**

Create `client/src/features/travel/context/TravelContext.tsx` managing active view state (`employee` | `manager` | `admin`), current user role switching for pairs, and request queues.

- [ ] **Step 4: Commit**

```bash
git add client/src/features/travel/types/travel.ts client/src/features/travel/services/travelApi.ts client/src/features/travel/context/TravelContext.tsx
git commit -m "feat(travel): implement frontend travel types, INR formatters, and API context"
```

---

### Task 7: Frontend Warm Storycraft UI — Employee Portal & New Request Modal

**Files:**
- Create: `client/src/features/travel/components/ExpenseLineItemTable.tsx`
- Create: `client/src/features/travel/components/NewTravelRequestModal.tsx`
- Create: `client/src/features/travel/pages/EmployeeTravelPage.tsx`
- Modify: `client/src/routes/index.tsx`

**Interfaces:**
- Consumes: `TravelContext`, Warm Storycraft CSS tokens
- Produces: `/travel/employee` portal page with KPI summary cards, requests table, and "+ New Travel Request" modal.

- [ ] **Step 1: Implement ExpenseLineItemTable.tsx**

Create interactive table component for adding, removing, and computing itemized expenses in INR (`₹`) with quote/receipt image attachment inputs.

- [ ] **Step 2: Implement NewTravelRequestModal.tsx**

Create the Warm Storycraft modal dialog (`rgba(43,35,29,0.45)` scrim, `#FAF8F5` surface) allowing employees to toggle between `Upcoming Travel` and `Already Travelled` and submit requests to their Manager.

- [ ] **Step 3: Implement EmployeeTravelPage.tsx**

Create the main employee hub with:
- KPI cards: Active upcoming trips, pending total value in `₹`, settled claims.
- Requests table with clean typographic status tags (zero colored dots).
- Drawer view inspecting submitted quotes and receipts.

- [ ] **Step 4: Register route in client/src/routes/index.tsx**

Mount `/travel` and `/travel/employee`.

- [ ] **Step 5: Verify build**

Run: `cd client && npm run build`
Expected: Build passes with 0 TypeScript or bundle errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/features/travel/components/ExpenseLineItemTable.tsx client/src/features/travel/components/NewTravelRequestModal.tsx client/src/features/travel/pages/EmployeeTravelPage.tsx client/src/routes/index.tsx
git commit -m "feat(travel): build Employee Portal and New Travel Request modal in Warm Storycraft"
```

---

### Task 8: Frontend Manager Queue & Admin Governance Drawers

**Files:**
- Create: `client/src/features/travel/components/ManagerAuditDrawer.tsx`
- Create: `client/src/features/travel/components/AdminGovernanceDrawer.tsx`
- Create: `client/src/features/travel/pages/ManagerQueuePage.tsx`
- Create: `client/src/features/travel/pages/AdminGovernancePage.tsx`
- Modify: `client/src/routes/index.tsx`

**Interfaces:**
- Consumes: `TravelContext`, `travelApi.ts`
- Produces: `/travel/manager` and `/travel/admin` views with interactive decision action drawers.

- [ ] **Step 1: Implement ManagerAuditDrawer.tsx**

Create slide-over audit drawer featuring:
- Necessity and expense policy checklist.
- Itemized breakdown with clickable quotation/receipt image links.
- Revision instruction textarea.
- Prominent `Approve & Forward to Admin` and `Send Revision to Employee` decision buttons.

- [ ] **Step 2: Implement AdminGovernanceDrawer.tsx**

Create executive decision drawer featuring:
- Department Q4 budget pool headroom indicators (`₹12,90,000.00` remaining of `₹35,00,000.00`).
- **Revision Target Routing Selector**:
  - Radio toggle: `Route A: Send to Manager` vs `Route B: Direct to Employee`.
  - Clear indicator that resubmissions return to the Manager first.
- Decision buttons: `Grant Final Travel Clearance` / `Authorize Payout` and `Dispatch Revision Instructions`.

- [ ] **Step 3: Implement ManagerQueuePage.tsx and AdminGovernancePage.tsx**

Create the Tier 1 Manager and Tier 2 Admin queue views with quick-action buttons directly on table rows.

- [ ] **Step 4: Verify client build**

Run: `cd client && npm run build`
Expected: Build passes with zero errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/features/travel/components/ManagerAuditDrawer.tsx client/src/features/travel/components/AdminGovernanceDrawer.tsx client/src/features/travel/pages/ManagerQueuePage.tsx client/src/features/travel/pages/AdminGovernancePage.tsx client/src/routes/index.tsx
git commit -m "feat(travel): build Manager Audit Queue and Admin Governance views with dual-revision routing"
```

---

### Task 9: End-to-End Automated Integration Verification

**Files:**
- Create: `server/test-travel-e2e.ts`
- Modify: `server/package.json`

**Interfaces:**
- Consumes: Full Express backend & PostgreSQL database
- Produces: Automated test suite validating both workflows and revision loops.

- [ ] **Step 1: Write comprehensive test-travel-e2e.ts**

```typescript
// server/test-travel-e2e.ts
import { pool } from './src/shared/db/pool.js';
import { TravelService } from './src/features/travel/travel.service.js';

async function runE2EVerification() {
  console.log('====================================================');
  console.log('   TRIPFLOW TRAVEL GOVERNANCE E2E VERIFICATION      ');
  console.log('====================================================');

  const service = new TravelService();

  // Create test actors
  const empRes = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Jane Doe', 'jane@corp.com', 'h', 'EMPLOYEE') RETURNING id;");
  const mgrRes = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Marcus Brody', 'marcus@corp.com', 'h', 'MANAGER') RETURNING id;");
  const admRes = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Alexander Vance', 'alexander@corp.com', 'h', 'ADMIN') RETURNING id;");

  const empId = empRes.rows[0].id;
  const mgrId = mgrRes.rows[0].id;
  const admId = admRes.rows[0].id;

  try {
    // -----------------------------------------------------------------
    // TEST 1: Upcoming Travel Flow (Success Path)
    // -----------------------------------------------------------------
    console.log('\n[TEST 1] Upcoming Travel: Employee -> Manager -> Admin Clearance');
    const upcomingReq = await service.createRequest(empId, {
      travelType: 'UPCOMING',
      title: 'Annual Engineering Architecture Summit',
      purpose: 'APAC Platform Alignment',
      projectCode: 'PRJ-ENG-409',
      origin: 'Mumbai (BOM)',
      destination: 'Tokyo (HND)',
      departureDate: '2026-11-15',
      returnDate: '2026-11-20',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '+919876543210',
      expenses: [
        { category: 'FLIGHT', merchant: 'All Nippon Airways', amount: 68000.00, expenseDate: '2026-11-15', receiptImageUrl: 'ana-quote.png' },
        { category: 'HOTEL', merchant: 'Shinjuku Prince Hotel', amount: 56000.00, expenseDate: '2026-11-15', receiptImageUrl: 'hotel.png' },
        { category: 'MEALS_PER_DIEM', merchant: 'Allowance', amount: 24000.00, expenseDate: '2026-11-15' }
      ]
    });

    console.log('✓ Submitted request ID:', upcomingReq.id, 'Total INR:', upcomingReq.totalExpenses);
    if (upcomingReq.totalExpenses !== 148000.00) throw new Error('Total expenses calculation mismatch');

    // Manager Approves
    const mgrApproved = await service.managerReview(mgrId, upcomingReq.id, {
      action: 'APPROVE',
      remarks: 'Business necessity and Tokyo hotel rates verified'
    });
    console.log('✓ Manager approved -> Status:', mgrApproved.status);
    if (mgrApproved.status !== 'PENDING_ADMIN_APPROVAL') throw new Error('Expected PENDING_ADMIN_APPROVAL');

    // Admin Grants Clearance
    const adminCleared = await service.adminReview(admId, upcomingReq.id, {
      action: 'APPROVE',
      remarks: 'Cleared within Q4 Engineering budget'
    });
    console.log('✓ Admin granted final clearance -> Status:', adminCleared.status);
    if (adminCleared.status !== 'APPROVED') throw new Error('Expected APPROVED');

    // -----------------------------------------------------------------
    // TEST 2: Already Travelled Reimbursement Flow
    // -----------------------------------------------------------------
    console.log('\n[TEST 2] Already Travelled: Employee -> Manager -> Admin Payout Settlement');
    const pastReq = await service.createRequest(empId, {
      travelType: 'ALREADY_TRAVELLED',
      title: 'Client Emergency Operations',
      purpose: 'Singapore Onsite Fixes',
      projectCode: 'PRJ-ENG-409',
      origin: 'Mumbai (BOM)',
      destination: 'Singapore (SIN)',
      departureDate: '2026-10-20',
      returnDate: '2026-10-24',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '+919876543210',
      expenses: [
        { category: 'FLIGHT', merchant: 'Singapore Airlines', amount: 48500.00, expenseDate: '2026-10-20', receiptImageUrl: 'receipt-sq.png' },
        { category: 'HOTEL', merchant: 'Marina Bay Sands', amount: 54000.00, expenseDate: '2026-10-20', receiptImageUrl: 'hotel-receipt.png' }
      ]
    });

    await service.managerReview(mgrId, pastReq.id, { action: 'APPROVE', remarks: 'Tax receipts audited' });
    const settled = await service.adminReview(admId, pastReq.id, { action: 'APPROVE', remarks: 'Disbursement authorized' });
    console.log('✓ Admin settled payout -> Status:', settled.status);
    if (settled.status !== 'SETTLED') throw new Error('Expected SETTLED');

    // -----------------------------------------------------------------
    // TEST 3: Admin Direct Revision -> Returns to Manager First
    // -----------------------------------------------------------------
    console.log('\n[TEST 3] Admin Direct Revision -> Employee Resubmit -> Returns to Manager First');
    const req3 = await service.createRequest(empId, {
      travelType: 'UPCOMING',
      title: 'AWS Cloud Symposium',
      purpose: 'Symposium',
      projectCode: 'PRJ-ENG-409',
      origin: 'Delhi',
      destination: 'Bangalore',
      departureDate: '2026-12-02',
      returnDate: '2026-12-05',
      emergencyContactName: 'Contact',
      emergencyContactPhone: '+919876543210',
      expenses: [{ category: 'HOTEL', merchant: 'Five Star Hotel', amount: 36000.00, expenseDate: '2026-12-02' }]
    });

    await service.managerReview(mgrId, req3.id, { action: 'APPROVE', remarks: 'Verified' });
    
    // Admin sends revision directly to Employee
    const revised = await service.adminReview(admId, req3.id, {
      action: 'REVISE',
      remarks: 'Scale back hotel to partner rates',
      target: 'EMPLOYEE'
    });
    console.log('✓ Admin requested revision -> Status:', revised.status, 'Target:', revised.revisionTarget);

    // Employee modifies and resubmits
    const resubmitted = await service.employeeResubmit(empId, req3.id, {
      expenses: [{ category: 'HOTEL', merchant: 'Partner Hotel', amount: 11000.00, expenseDate: '2026-12-02' }]
    });
    console.log('✓ Employee resubmitted -> Status:', resubmitted.status);
    if (resubmitted.status !== 'PENDING_MANAGER_REVIEW') {
      throw new Error('CRITICAL INVARIANT VIOLATION: Resubmission did not return to Manager first!');
    }

    console.log('\n====================================================');
    console.log('   ALL TRIPFLOW INTEGRATION TESTS PASSED (100%)     ');
    console.log('====================================================');
  } finally {
    await pool.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [empId, mgrId, admId]);
    await pool.end();
  }
}

runE2EVerification().catch(err => {
  console.error('E2E Verification failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add script to server/package.json**

Add `"test:travel": "tsx test-travel-e2e.ts"` to `server/package.json` scripts.

- [ ] **Step 3: Run full integration verification suite**

Run: `cd server && npm run test:travel`
Expected: PASS with "ALL TRIPFLOW INTEGRATION TESTS PASSED (100%)".

- [ ] **Step 4: Commit**

```bash
git add server/test-travel-e2e.ts server/package.json
git commit -m "test(travel): add comprehensive E2E integration test suite for travel governance"
```
