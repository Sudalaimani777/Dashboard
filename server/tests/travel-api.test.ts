// server/tests/travel-api.test.ts
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/shared/db/pool.js';
import { config } from '../src/config/env.js';
import { runMigrations } from '../src/shared/db/migrate.js';

const PORT = 5098;
let server: http.Server;
const baseUrl = `http://localhost:${PORT}/api/travel`;

async function runTravelApiTests() {
  console.log('\n🧪 ==========================================');
  console.log('   TASK 5: TRAVEL REST API TEST SUITE');
  console.log('==========================================\n');

  await runMigrations();

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const timestamp = Date.now();

  // Create actors
  const empRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ('API Emp', 'api_emp_${timestamp}@corp.com', 'h', 'EMPLOYEE', 'Engineering')
     RETURNING id, name, email, role, department;`
  );
  const mgrRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ('API Mgr', 'api_mgr_${timestamp}@corp.com', 'h', 'MANAGER', 'Engineering')
     RETURNING id, name, email, role, department;`
  );
  const admRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ('API Adm', 'api_adm_${timestamp}@corp.com', 'h', 'ADMIN', 'Executive')
     RETURNING id, name, email, role, department;`
  );

  const empUser = empRes.rows[0];
  const mgrUser = mgrRes.rows[0];
  const admUser = admRes.rows[0];

  // Link employee to manager
  await pool.query('UPDATE users SET manager_id = $1 WHERE id = $2', [mgrUser.id, empUser.id]);

  // Seed department budget
  await pool.query(
    `INSERT INTO department_budgets (department, fiscal_year, fiscal_quarter, total_allocation, utilized_amount)
     VALUES ('Engineering', 2026, 'Q4', 3500000.00, 500000.00)
     ON CONFLICT (department, fiscal_year, fiscal_quarter) DO NOTHING;`
  );

  // Helper to generate auth tokens
  function createAuthHeader(user: { id: string; email: string; role: string; department?: string }) {
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, department: user.department },
      config.jwt.secret as jwt.Secret,
      { expiresIn: '1h' }
    );
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  const empHeaders = createAuthHeader(empUser);
  const mgrHeaders = createAuthHeader(mgrUser);
  const admHeaders = createAuthHeader(admUser);

  let passed = 0;
  let total = 0;

  async function assertApiTest(name: string, fn: () => Promise<boolean>) {
    total++;
    try {
      const ok = await fn();
      if (ok) {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } else {
        console.log(`  ❌ FAIL: ${name}`);
      }
    } catch (err: any) {
      console.log(`  ❌ FAIL: ${name} -> ${err.message}`);
    }
  }

  let testRequestId = '';

  try {
    // 1. Unauthenticated request rejected with 401
    await assertApiTest('POST /api/travel/requests (No Auth) -> 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Unauthenticated attempt' })
      });
      return res.status === 401;
    });

    // 2. Submit new travel request with itemized expenses & proof
    await assertApiTest('POST /api/travel/requests (Employee) -> 201 Created', async () => {
      const payload = {
        travelType: 'UPCOMING',
        title: 'Q4 Product Roadmap Offsite',
        purpose: 'Quarterly planning and sprint alignment',
        projectCode: 'PRJ-ENG-2026',
        origin: 'Bengaluru',
        destination: 'Goa',
        departureDate: '2026-11-25',
        returnDate: '2026-11-28',
        emergencyContactName: 'Ananya Roy',
        emergencyContactPhone: '+919876543299',
        expenses: [
          {
            category: 'FLIGHT',
            merchant: 'Air India Express',
            amount: 8500.00,
            expenseDate: '2026-11-25',
            receiptImageUrl: 'https://proofs.corp.com/ticket.pdf'
          },
          {
            category: 'HOTEL',
            merchant: 'Goa Marriott Resort',
            amount: 24000.00,
            expenseDate: '2026-11-25',
            receiptImageUrl: 'https://proofs.corp.com/hotel-quote.pdf'
          }
        ]
      };

      const res = await fetch(`${baseUrl}/requests`, {
        method: 'POST',
        headers: empHeaders,
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      if (res.status === 201 && body.data?.id && body.data?.status === 'PENDING_MANAGER_REVIEW') {
        testRequestId = body.data.id;
        return true;
      }
      return false;
    });

    // 3. GET /api/travel/requests (Role-scoped list)
    await assertApiTest('GET /api/travel/requests (Employee) -> 200 Returns scoped list', async () => {
      const res = await fetch(`${baseUrl}/requests`, {
        headers: empHeaders
      });
      const body = await res.json();
      return res.status === 200 && Array.isArray(body.data) && body.data.some((r: any) => r.id === testRequestId);
    });

    // 4. GET /api/travel/requests/:id (Details with expenses & timeline)
    await assertApiTest('GET /api/travel/requests/:id -> 200 Returns details with expenses', async () => {
      const res = await fetch(`${baseUrl}/requests/${testRequestId}`, {
        headers: empHeaders
      });
      const body = await res.json();
      return (
        res.status === 200 &&
        body.data?.id === testRequestId &&
        Array.isArray(body.data?.expenses) &&
        body.data.expenses.length === 2 &&
        Array.isArray(body.data?.timeline)
      );
    });

    // 5. Role Guard: Employee cannot call manager-review endpoint
    await assertApiTest('POST /requests/:id/manager-review (Employee forbidden) -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/requests/${testRequestId}/manager-review`, {
        method: 'POST',
        headers: empHeaders,
        body: JSON.stringify({ action: 'APPROVE', remarks: 'Trying to self approve' })
      });
      return res.status === 403;
    });

    // 6. Manager Review: APPROVE -> transitions to PENDING_ADMIN_APPROVAL
    await assertApiTest('POST /requests/:id/manager-review (Manager APPROVE) -> 200', async () => {
      const res = await fetch(`${baseUrl}/requests/${testRequestId}/manager-review`, {
        method: 'POST',
        headers: mgrHeaders,
        body: JSON.stringify({
          action: 'APPROVE',
          remarks: 'Roadmap offsite approved by Line Manager.'
        })
      });
      const body = await res.json();
      return res.status === 200 && body.data?.status === 'PENDING_ADMIN_APPROVAL';
    });

    // 7. Role Guard: Manager cannot call admin-review endpoint
    await assertApiTest('POST /requests/:id/admin-review (Manager forbidden) -> 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/requests/${testRequestId}/admin-review`, {
        method: 'POST',
        headers: mgrHeaders,
        body: JSON.stringify({ action: 'APPROVE', remarks: 'Trying to execute admin clearance' })
      });
      return res.status === 403;
    });

    // 8. Admin Review: REVISE Route B (Direct to Employee)
    await assertApiTest('POST /requests/:id/admin-review (Admin REVISE Route B) -> 200', async () => {
      const res = await fetch(`${baseUrl}/requests/${testRequestId}/admin-review`, {
        method: 'POST',
        headers: admHeaders,
        body: JSON.stringify({
          action: 'REVISE',
          revisionTarget: 'EMPLOYEE',
          remarks: 'Please obtain discount rate on resort booking.'
        })
      });
      const body = await res.json();
      return res.status === 200 && body.data?.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE';
    });

    // 9. Employee Resubmit: Invariant strictly returns to PENDING_MANAGER_REVIEW
    await assertApiTest('POST /requests/:id/resubmit (Employee Resubmit) -> 200 returns to Manager', async () => {
      const res = await fetch(`${baseUrl}/requests/${testRequestId}/resubmit`, {
        method: 'POST',
        headers: empHeaders,
        body: JSON.stringify({
          remarks: 'Applied corporate discount code: resort now ₹18,000.',
          expenses: [
            {
              category: 'FLIGHT',
              merchant: 'Air India Express',
              amount: 8500.00,
              expenseDate: '2026-11-25',
              receiptImageUrl: 'https://proofs.corp.com/ticket.pdf'
            },
            {
              category: 'HOTEL',
              merchant: 'Goa Marriott Resort',
              amount: 18000.00,
              expenseDate: '2026-11-25',
              receiptImageUrl: 'https://proofs.corp.com/discounted-hotel-quote.pdf'
            }
          ]
        })
      });
      const body = await res.json();
      return (
        res.status === 200 &&
        body.data?.status === 'PENDING_MANAGER_REVIEW' &&
        body.data?.totalExpenses === 26500.00
      );
    });

    // 10. Manager Re-approval & Admin Final Clearance
    await assertApiTest('Complete Full Cycle: Manager Re-Approve -> Admin Clearance', async () => {
      // Manager re-approves
      const mgrRes = await fetch(`${baseUrl}/requests/${testRequestId}/manager-review`, {
        method: 'POST',
        headers: mgrHeaders,
        body: JSON.stringify({ action: 'APPROVE', remarks: 'Revised quote verified.' })
      });
      const mgrBody = await mgrRes.json();
      if (mgrBody.data?.status !== 'PENDING_ADMIN_APPROVAL') return false;

      // Admin grants clearance
      const admRes = await fetch(`${baseUrl}/requests/${testRequestId}/admin-review`, {
        method: 'POST',
        headers: admHeaders,
        body: JSON.stringify({ action: 'APPROVE', remarks: 'Approved.' })
      });
      const admBody = await admRes.json();
      return admBody.data?.status === 'APPROVED';
    });

    // 11. GET /api/travel/budgets -> 200
    await assertApiTest('GET /api/travel/budgets -> 200 Returns department budget', async () => {
      const res = await fetch(`${baseUrl}/budgets?department=Engineering&year=2026&quarter=Q4`, {
        headers: admHeaders
      });
      const body = await res.json();
      return res.status === 200 && body.data?.department === 'Engineering' && body.data?.total_allocation > 0;
    });

    console.log('\n==========================================');
    console.log(`📊 Summary: ${passed}/${total} API Tests Passed`);
    console.log('==========================================\n');

    // Clean up test actors
    await pool.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [empUser.id, mgrUser.id, admUser.id]);
  } finally {
    server.close();
    await pool.end();
  }

  if (passed !== total) {
    process.exit(1);
  }
}

runTravelApiTests().catch((err) => {
  console.error('API test suite encountered error:', err);
  process.exit(1);
});
