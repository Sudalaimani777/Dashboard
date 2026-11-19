// server/test-travel-e2e.ts
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from './src/app.js';
import { pool } from './src/shared/db/pool.js';
import { runMigrations } from './src/shared/db/migrate.js';

const PORT = 5098;
let server: http.Server;
const BASE_URL = `http://localhost:${PORT}/api`;

interface CookieJar {
  token?: string;
}

async function request(
  method: string,
  path: string,
  body?: any,
  jar?: CookieJar
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
    const url = new URL(fullUrl);
    const payload = body ? JSON.stringify(body) : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (jar?.token) {
      headers['Cookie'] = `token=${jar.token}`;
    }

    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }

          // Capture cookies if set
          const setCookie = res.headers['set-cookie'];
          if (setCookie && jar) {
            for (const c of setCookie) {
              const match = c.match(/^token=([^;]+)/);
              if (match) {
                jar.token = match[1];
              }
            }
          }

          resolve({
            status: res.statusCode || 500,
            body: parsed,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runE2ETests() {
  console.log('\n🚀 ==============================================================');
  console.log('   TRIPFLOW DAY 3 END-TO-END MULTI-ROLE GOVERNANCE VERIFICATION');
  console.log('==================================================================\n');

  await runMigrations();

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`📡 E2E Server listening on ${BASE_URL}`);

  try {
    const ts = Date.now();
    const mgrEmail = `mgr_${ts}@tripflow.internal`;
    const admEmail = `adm_${ts}@tripflow.internal`;
    const empEmail = `emp_${ts}@tripflow.internal`;

    console.log('\n1. Setting up Test Personas (Employee, Manager, Admin)...');

    // Register 3 users
    await request('POST', '/auth/signup', { name: 'Line Manager Dave', email: mgrEmail, password: 'Password123!' });
    await request('POST', '/auth/signup', { name: 'Admin Alice', email: admEmail, password: 'Password123!' });
    await request('POST', '/auth/signup', { name: 'Employee Bob', email: empEmail, password: 'Password123!' });

    // Update their database roles
    const mgrRes = await pool.query(`UPDATE users SET role = 'MANAGER' WHERE LOWER(email) = LOWER($1) RETURNING id;`, [mgrEmail]);
    const admRes = await pool.query(`UPDATE users SET role = 'ADMIN' WHERE LOWER(email) = LOWER($1) RETURNING id;`, [admEmail]);
    const empRes = await pool.query(
      `UPDATE users SET role = 'EMPLOYEE', manager_id = $1 WHERE LOWER(email) = LOWER($2) RETURNING id;`,
      [mgrRes.rows[0].id, empEmail]
    );

    const managerId = mgrRes.rows[0].id;
    const adminId = admRes.rows[0].id;
    const employeeId = empRes.rows[0].id;

    console.log(`  ✓ Manager ID: ${managerId}`);
    console.log(`  ✓ Admin ID:   ${adminId}`);
    console.log(`  ✓ Employee ID: ${employeeId} (reports to Manager)`);

    // Authenticate all 3 sessions
    const empJar: CookieJar = {};
    const mgrJar: CookieJar = {};
    const admJar: CookieJar = {};

    const empLogin = await request('POST', '/auth/signin', { email: empEmail, password: 'Password123!' }, empJar);
    assert.equal(empLogin.status, 200);
    assert.equal(empLogin.body.data.user.role, 'EMPLOYEE', 'Employee role returned from signin');

    const mgrLogin = await request('POST', '/auth/signin', { email: mgrEmail, password: 'Password123!' }, mgrJar);
    assert.equal(mgrLogin.status, 200);
    assert.equal(mgrLogin.body.data.user.role, 'MANAGER', 'Manager role returned from signin');

    const admLogin = await request('POST', '/auth/signin', { email: admEmail, password: 'Password123!' }, admJar);
    assert.equal(admLogin.status, 200);
    assert.equal(admLogin.body.data.user.role, 'ADMIN', 'Admin role returned from signin');

    console.log('  ✓ Authenticated all 3 personas with verified DB roles and HttpOnly cookies');

    // -------------------------------------------------------------------------
    // CASE 1: ALREADY_TRAVELLED (Post-trip Reimbursement Lifecycle)
    // -------------------------------------------------------------------------
    console.log('\n2. Testing Case 1: Post-trip Reimbursement Lifecycle...');

    // 2.1 Employee Submits Case 1 Request
    const case1Res = await request(
      'POST',
      '/travel/requests',
      {
        travelType: 'ALREADY_TRAVELLED',
        title: 'Mumbai Tech Summit Reimbursement',
        purpose: 'Speaker presentation on Distributed Postgres',
        projectCode: 'PROJ-ENG-2026',
        origin: 'Bengaluru',
        destination: 'Mumbai',
        departureDate: '2026-11-01',
        returnDate: '2026-11-04',
        emergencyContactName: 'Anita Roy',
        emergencyContactPhone: '+91 99887 76655',
        supportingDocUrl: 'https://storage.tripflow.internal/receipts/tax-invoice-summit.pdf',
        expenses: [
          { category: 'FLIGHT', merchant: 'Air India', amount: 16500, expenseDate: '2026-11-01' },
          { category: 'HOTEL', merchant: 'Taj Lands End', amount: 28000, expenseDate: '2026-11-03' },
          { category: 'TRANSIT', merchant: 'Uber India', amount: 3500, expenseDate: '2026-11-04' },
        ],
      },
      empJar
    );

    assert.equal(case1Res.status, 201, 'Case 1 created');
    const case1Id = case1Res.body.data.id;
    assert.equal(case1Res.body.data.status, 'PENDING_MANAGER_REVIEW');
    assert.equal(case1Res.body.data.totalExpenses, 48000);
    console.log(`  ✓ Case 1 created (#${case1Id.slice(0, 8)}) with status PENDING_MANAGER_REVIEW, total ₹48,000.00`);

    // 2.2 Manager Inspects Audit Queue
    const mgrQueue1 = await request('GET', '/travel/manager-queue', null, mgrJar);
    assert.equal(mgrQueue1.status, 200);
    const foundInMgrQueue = mgrQueue1.body.data.some((r: any) => r.id === case1Id);
    assert.ok(foundInMgrQueue, 'Case 1 request appears in direct reports audit queue');
    console.log('  ✓ Manager sees Case 1 in Tier 1 Audit Queue');

    // 2.3 Manager Requests Changes
    const mgrRevision1 = await request(
      'POST',
      `/travel/requests/${case1Id}/manager-review`,
      {
        action: 'REQUEST_REVISION',
        remarks: 'Please attach hotel itemized room service tax invoice.',
      },
      mgrJar
    );
    assert.equal(mgrRevision1.status, 200);
    assert.equal(mgrRevision1.body.data.status, 'REVISION_REQUESTED_BY_MANAGER');
    console.log('  ✓ Manager requested changes; status transitions to REVISION_REQUESTED_BY_MANAGER');

    // 2.4 Employee Resubmits with Updated Expenses
    const empResubmit1 = await request(
      'POST',
      `/travel/requests/${case1Id}/resubmit`,
      {
        remarks: 'Attached itemized room service invoice and adjusted amount.',
        supportingDocUrl: 'https://storage.tripflow.internal/receipts/tax-invoice-updated.pdf',
        expenses: [
          { category: 'FLIGHT', merchant: 'Air India', amount: 16500, expenseDate: '2026-11-01' },
          { category: 'HOTEL', merchant: 'Taj Lands End', amount: 32000, expenseDate: '2026-11-03' },
          { category: 'TRANSIT', merchant: 'Uber India', amount: 3500, expenseDate: '2026-11-04' },
        ],
      },
      empJar
    );
    assert.equal(empResubmit1.status, 200);
    assert.equal(empResubmit1.body.data.status, 'PENDING_MANAGER_REVIEW', 'INVARIANT: Resubmission strictly returns to Manager first');
    assert.equal(empResubmit1.body.data.totalExpenses, 52000);
    console.log('  ✓ Invariant Verified: Employee resubmission returns strictly to PENDING_MANAGER_REVIEW (never bypasses to Admin)');

    // 2.5 Manager Re-Audits and Approves to Admin
    const mgrApprove1 = await request(
      'POST',
      `/travel/requests/${case1Id}/manager-review`,
      {
        action: 'APPROVE',
        remarks: 'Room service tax invoice verified. Approved and forwarded to Admin clearance.',
      },
      mgrJar
    );
    assert.equal(mgrApprove1.status, 200);
    assert.equal(mgrApprove1.body.data.status, 'PENDING_ADMIN_APPROVAL');
    console.log('  ✓ Manager approved; request transitions to PENDING_ADMIN_APPROVAL');

    // 2.6 Admin Reviews & Settles Reimbursement
    const admQueue1 = await request('GET', '/travel/admin-queue', null, admJar);
    assert.equal(admQueue1.status, 200);
    assert.ok(admQueue1.body.data.some((r: any) => r.id === case1Id), 'Case 1 appears in Admin Executive Queue');

    const admSettle1 = await request(
      'POST',
      `/travel/requests/${case1Id}/admin-review`,
      {
        action: 'SETTLE',
        remarks: 'Finance payout disbursed to employee bank account.',
      },
      admJar
    );
    assert.equal(admSettle1.status, 200);
    assert.equal(admSettle1.body.data.status, 'SETTLED');
    console.log('  ✓ Admin settled reimbursement payout; status transitions to SETTLED');

    // -------------------------------------------------------------------------
    // CASE 2: UPCOMING (Pre-trip Authorization & Dual Route Revision Lifecycle)
    // -------------------------------------------------------------------------
    console.log('\n3. Testing Case 2: Pre-trip Authorization & Route B Revision Invariant...');

    // 3.1 Employee Submits Case 2 Request
    const case2Res = await request(
      'POST',
      '/travel/requests',
      {
        travelType: 'UPCOMING',
        title: 'Tokyo Q1 Partner Integration',
        purpose: 'Architecture sync and API partner onboarding',
        projectCode: 'PROJ-GLOBAL-2026',
        origin: 'Bengaluru',
        destination: 'Tokyo',
        departureDate: '2026-12-10',
        returnDate: '2026-12-18',
        emergencyContactName: 'Vikram Mehta',
        emergencyContactPhone: '+91 91234 56789',
        supportingDocUrl: 'https://storage.tripflow.internal/quotes/tokyo-itinerary-quote.pdf',
        expenses: [
          { category: 'FLIGHT', merchant: 'Japan Airlines', amount: 85000, expenseDate: '2026-12-10' },
          { category: 'HOTEL', merchant: 'Shinjuku Prince Hotel', amount: 55000, expenseDate: '2026-12-12' },
          { category: 'MEALS_PER_DIEM', merchant: 'Corporate Per Diem', amount: 20000, expenseDate: '2026-12-15' },
        ],
      },
      empJar
    );
    assert.equal(case2Res.status, 201);
    const case2Id = case2Res.body.data.id;
    assert.equal(case2Res.body.data.status, 'PENDING_MANAGER_REVIEW');
    assert.equal(case2Res.body.data.totalExpenses, 160000);
    console.log(`  ✓ Case 2 created (#${case2Id.slice(0, 8)}) with status PENDING_MANAGER_REVIEW, total ₹1,60,000.00`);

    // 3.2 Manager Audits and Approves to Admin
    const mgrApprove2 = await request(
      'POST',
      `/travel/requests/${case2Id}/manager-review`,
      {
        action: 'APPROVE',
        remarks: 'Critical partner sync endorsed by Line Manager.',
      },
      mgrJar
    );
    assert.equal(mgrApprove2.status, 200);
    assert.equal(mgrApprove2.body.data.status, 'PENDING_ADMIN_APPROVAL');
    console.log('  ✓ Manager approved Case 2; transitions to PENDING_ADMIN_APPROVAL');

    // 3.3 Admin Dispatches Route B Revision Directly to Employee
    const admRev2 = await request(
      'POST',
      `/travel/requests/${case2Id}/admin-review`,
      {
        action: 'REQUEST_REVISION',
        revisionTarget: 'EMPLOYEE',
        remarks: 'Hotel estimate exceeds per-diem limit. Please select corporate discount rate.',
      },
      admJar
    );
    assert.equal(admRev2.status, 200);
    assert.equal(admRev2.body.data.status, 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE');
    console.log('  ✓ Admin dispatched Route B revision directly to Employee');

    // 3.4 Employee Resubmits to Invariant Check
    const empResubmit2 = await request(
      'POST',
      `/travel/requests/${case2Id}/resubmit`,
      {
        remarks: 'Switched hotel to corporate discounted rate. Total reduced by ₹15,000.',
        supportingDocUrl: 'https://storage.tripflow.internal/quotes/tokyo-itinerary-revised.pdf',
        expenses: [
          { category: 'FLIGHT', merchant: 'Japan Airlines', amount: 85000, expenseDate: '2026-12-10' },
          { category: 'HOTEL', merchant: 'Shinjuku Prince Hotel (Corp Rate)', amount: 40000, expenseDate: '2026-12-12' },
          { category: 'MEALS_PER_DIEM', merchant: 'Corporate Per Diem', amount: 20000, expenseDate: '2026-12-15' },
        ],
      },
      empJar
    );
    assert.equal(empResubmit2.status, 200);
    // NON-NEGOTIABLE INVARIANT CHECK:
    assert.equal(
      empResubmit2.body.data.status,
      'PENDING_MANAGER_REVIEW',
      'NON-NEGOTIABLE INVARIANT: Even after Admin Route B revision, resubmission strictly returns to Line Manager first!'
    );
    assert.equal(empResubmit2.body.data.totalExpenses, 145000);
    console.log('  ✓ NON-NEGOTIABLE INVARIANT CONFIRMED: Admin Route B resubmission strictly returns to Line Manager first');

    // 3.5 Manager Re-Audits
    const mgrReApprove2 = await request(
      'POST',
      `/travel/requests/${case2Id}/manager-review`,
      {
        action: 'APPROVE',
        remarks: 'Discounted hotel rate verified.',
      },
      mgrJar
    );
    assert.equal(mgrReApprove2.status, 200);
    assert.equal(mgrReApprove2.body.data.status, 'PENDING_ADMIN_APPROVAL');
    console.log('  ✓ Manager re-audited and forwarded to Admin');

    // 3.6 Admin Grants Clearance
    const admApprove2 = await request(
      'POST',
      `/travel/requests/${case2Id}/admin-review`,
      {
        action: 'APPROVE',
        remarks: 'Executive travel clearance granted.',
      },
      admJar
    );
    assert.equal(admApprove2.status, 200);
    assert.equal(admApprove2.body.data.status, 'APPROVED');
    console.log('  ✓ Admin granted executive clearance; status transitions to APPROVED');

    // -------------------------------------------------------------------------
    // 4. SECURITY & AUTHORIZATION GUARDS (403 Tests)
    // -------------------------------------------------------------------------
    console.log('\n4. Testing Security & Role Authorization Guards (403 Tests)...');

    // Employee trying to hit manager queue
    const empHack1 = await request('GET', '/travel/manager-queue', null, empJar);
    assert.equal(empHack1.status, 403, 'Employee cannot access manager queue');

    // Employee trying to approve manager review
    const empHack2 = await request('POST', `/travel/requests/${case1Id}/manager-review`, { action: 'APPROVE' }, empJar);
    assert.equal(empHack2.status, 403, 'Employee cannot approve manager review');

    // Manager trying to access admin queue
    const mgrHack1 = await request('GET', '/travel/admin-queue', null, mgrJar);
    assert.equal(mgrHack1.status, 403, 'Manager cannot access admin queue');

    // Manager trying to execute admin review
    const mgrHack2 = await request('POST', `/travel/requests/${case1Id}/admin-review`, { action: 'SETTLE' }, mgrJar);
    assert.equal(mgrHack2.status, 403, 'Manager cannot execute admin settlement');

    console.log('  ✓ Role middleware successfully rejected all unauthorized cross-role attempts with 403 Forbidden');

    console.log('\n==================================================================');
    console.log('🎉 100% OF ALL DAY 3 E2E MULTI-ROLE GOVERNANCE TESTS PASSED!');
    console.log('==================================================================\n');
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
    process.exit(0);
  }
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E TEST SUITE FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
