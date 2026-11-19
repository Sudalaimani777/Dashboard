// server/tests/travel-repo.test.ts
import { pool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/shared/db/migrate.js';
import { TravelRepository } from '../src/features/travel/travel.repository.js';
import { TravelType, ExpenseCategory } from '../src/features/travel/travel.types.js';

async function runRepoTests() {
  console.log('🧪 Starting TravelRepository Test Suite (TDD RED Phase)...\n');
  await runMigrations();

  const repo = new TravelRepository();
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (!condition) {
      throw new Error(`❌ Assertion failed: ${message}`);
    }
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  }

  // Generate unique test emails to avoid conflicts
  const timestamp = Date.now();
  const mgrEmail = `mgr_${timestamp}@readventure.test`;
  const empEmail = `emp_${timestamp}@readventure.test`;
  const empOtherEmail = `emp_other_${timestamp}@readventure.test`;
  const adminEmail = `admin_${timestamp}@readventure.test`;

  let mgrId = '';
  let empId = '';
  let empOtherId = '';
  let adminId = '';
  let createdReqId = '';

  try {
    // Setup test users: Line Manager, Employee (reporting to Manager), Unrelated Employee, and Admin
    const mgrRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ('Test Manager', $1, 'hashed_pw', 'MANAGER', 'Engineering')
      RETURNING id;
    `, [mgrEmail]);
    mgrId = mgrRes.rows[0].id;

    const empRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, department, manager_id)
      VALUES ('Test Employee', $1, 'hashed_pw', 'EMPLOYEE', 'Engineering', $2)
      RETURNING id;
    `, [empEmail, mgrId]);
    empId = empRes.rows[0].id;

    const empOtherRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ('Other Employee', $1, 'hashed_pw', 'EMPLOYEE', 'Design')
      RETURNING id;
    `, [empOtherEmail]);
    empOtherId = empOtherRes.rows[0].id;

    const adminRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ('Test Admin', $1, 'hashed_pw', 'ADMIN', 'Finance')
      RETURNING id;
    `, [adminEmail]);
    adminId = adminRes.rows[0].id;

    // Seed test department budget
    await pool.query(`
      INSERT INTO department_budgets (department, fiscal_year, fiscal_quarter, total_allocation, utilized_amount)
      VALUES ('Engineering', 2026, 'Q4', 3500000.00, 500000.00)
      ON CONFLICT (department, fiscal_year, fiscal_quarter) DO UPDATE
      SET total_allocation = 3500000.00, utilized_amount = 500000.00;
    `);

    // -------------------------------------------------------------
    // Test 1: createRequestWithExpenses (Atomic Transaction)
    // -------------------------------------------------------------
    console.log('--- Test 1: createRequestWithExpenses (Atomic Transaction) ---');
    const newReq = await repo.createRequestWithExpenses({
      userId: empId,
      managerId: mgrId,
      travelType: 'UPCOMING' as TravelType,
      title: 'Bangalore Tech Conference 2026',
      purpose: 'Keynote presentation and client meetings',
      projectCode: 'PRJ-ENG-2026',
      origin: 'Chennai',
      destination: 'Bangalore',
      departureDate: '2026-11-20',
      returnDate: '2026-11-23',
      emergencyContactName: 'Priya Kannan',
      emergencyContactPhone: '+919876543210',
      supportingDocUrl: 'https://docs.readventure.test/invite.pdf',
      expenses: [
        {
          category: 'FLIGHT' as ExpenseCategory,
          merchant: 'IndiGo Airlines',
          amount: 8500.00,
          expenseDate: '2026-11-20',
          receiptImageUrl: 'https://docs.readventure.test/ticket.png',
          notes: 'Round-trip flight ticket'
        },
        {
          category: 'HOTEL' as ExpenseCategory,
          merchant: 'The Oberoi Bengaluru',
          amount: 24000.00,
          expenseDate: '2026-11-20',
          receiptImageUrl: 'https://docs.readventure.test/hotel-quote.pdf',
          notes: '3 nights stay'
        }
      ]
    });

    createdReqId = newReq.id;
    assert(!!newReq.id, 'Request should have generated UUID');
    assert(Number(newReq.totalExpenses) === 32500.00, `Total expenses should sum up to 32500.00, got ${newReq.totalExpenses}`);
    assert(newReq.status === 'PENDING_MANAGER_REVIEW', `Initial status should be PENDING_MANAGER_REVIEW, got ${newReq.status}`);
    assert(newReq.currency === 'INR', `Currency should default to INR, got ${newReq.currency}`);

    // -------------------------------------------------------------
    // Test 2: findById with populated child expenses and timeline
    // -------------------------------------------------------------
    console.log('\n--- Test 2: findById with Child Expenses & Timeline ---');
    const fetchedReq = await repo.findById(createdReqId);
    assert(!!fetchedReq, 'Fetched request should not be null');
    assert(fetchedReq?.title === 'Bangalore Tech Conference 2026', 'Fetched title should match');
    assert(fetchedReq?.expenses?.length === 2, `Fetched expenses length should be 2, got ${fetchedReq?.expenses?.length}`);
    assert(fetchedReq?.timeline?.length === 1, `Fetched timeline length should be 1 (initial submission), got ${fetchedReq?.timeline?.length}`);
    assert(fetchedReq?.timeline?.[0].to_status === 'PENDING_MANAGER_REVIEW', 'Timeline entry to_status should be PENDING_MANAGER_REVIEW');

    // -------------------------------------------------------------
    // Test 3: findScopedRequests (Role-based access boundaries)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: findScopedRequests Role-based Scope ---');
    // Employee sees only their own
    const empRequests = await repo.findScopedRequests(empId, 'EMPLOYEE');
    assert(empRequests.some(r => r.id === createdReqId), 'Employee should see their own request');
    
    const otherEmpRequests = await repo.findScopedRequests(empOtherId, 'EMPLOYEE');
    assert(!otherEmpRequests.some(r => r.id === createdReqId), 'Other employee should NOT see this request');

    // Manager sees requests of their direct reports
    const mgrRequests = await repo.findScopedRequests(mgrId, 'MANAGER');
    assert(mgrRequests.some(r => r.id === createdReqId), 'Manager should see requests from their direct reports');

    // Admin sees all requests in the organization
    const adminRequests = await repo.findScopedRequests(adminId, 'ADMIN');
    assert(adminRequests.some(r => r.id === createdReqId), 'Admin should see all organization requests');

    // -------------------------------------------------------------
    // Test 4: updateStatusWithTimeline (Atomic state transition & audit)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: updateStatusWithTimeline ---');
    const updatedByMgr = await repo.updateStatusWithTimeline({
      requestId: createdReqId,
      actorId: mgrId,
      actorRole: 'MANAGER',
      fromStatus: 'PENDING_MANAGER_REVIEW',
      toStatus: 'PENDING_ADMIN_APPROVAL',
      remarks: 'Verified itinerary and quotes. Recommended for executive clearance.'
    });

    assert(updatedByMgr.status === 'PENDING_ADMIN_APPROVAL', 'Status should transition to PENDING_ADMIN_APPROVAL');
    assert(updatedByMgr.managerRemarks?.includes('Verified itinerary'), 'Manager remarks should be recorded on request');

    const updatedWithTimeline = await repo.findById(createdReqId);
    assert(updatedWithTimeline?.timeline?.length === 2, `Timeline should now contain 2 events, got ${updatedWithTimeline?.timeline?.length}`);
    const latestEvent = updatedWithTimeline?.timeline?.[1];
    assert(latestEvent?.from_status === 'PENDING_MANAGER_REVIEW', 'Timeline from_status should match');
    assert(latestEvent?.to_status === 'PENDING_ADMIN_APPROVAL', 'Timeline to_status should match');
    assert(latestEvent?.actor_role === 'MANAGER', 'Timeline actor_role should be MANAGER');

    // -------------------------------------------------------------
    // Test 5: updateExpenses (Revision Modification by Employee)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: updateExpenses & total recalculation ---');
    const updatedExpensesResult = await repo.updateExpenses(createdReqId, [
      {
        category: 'FLIGHT',
        merchant: 'Air India',
        amount: 7200.00,
        expenseDate: '2026-11-20',
        receiptImageUrl: 'https://docs.readventure.test/airindia.png',
        notes: 'Cheaper morning flight found'
      },
      {
        category: 'HOTEL',
        merchant: 'Taj West End',
        amount: 21000.00,
        expenseDate: '2026-11-20',
        receiptImageUrl: 'https://docs.readventure.test/taj.pdf',
        notes: 'Negotiated corporate tariff'
      },
      {
        category: 'TRANSIT',
        merchant: 'Airport Cab Service',
        amount: 1800.00,
        expenseDate: '2026-11-20',
        notes: 'Airport transfer'
      }
    ]);

    assert(Number(updatedExpensesResult.totalExpenses) === 30000.00, `Updated totalExpenses should be 30000.00, got ${updatedExpensesResult.totalExpenses}`);
    const checkAfterUpdate = await repo.findById(createdReqId);
    assert(checkAfterUpdate?.expenses?.length === 3, `Should have 3 child expenses now, got ${checkAfterUpdate?.expenses?.length}`);

    // -------------------------------------------------------------
    // Test 6: Department Budget Headroom & Utilization
    // -------------------------------------------------------------
    console.log('\n--- Test 6: getDepartmentBudget & updateBudgetUtilization ---');
    const budgetBefore = await repo.getDepartmentBudget('Engineering', 2026, 'Q4');
    assert(!!budgetBefore, 'Department budget should exist');
    assert(Number(budgetBefore?.total_allocation) === 3500000.00, 'Total allocation should be ₹35,00,000.00');
    assert(Number(budgetBefore?.utilized_amount) === 500000.00, 'Initial utilized amount should be ₹5,00,000.00');
    assert(Number(budgetBefore?.available_headroom) === 3000000.00, 'Initial available headroom should be ₹30,00,000.00');

    // Increment utilization by approved expense 30,000.00
    const updatedBudget = await repo.updateBudgetUtilization('Engineering', 2026, 'Q4', 30000.00);
    assert(Number(updatedBudget.utilized_amount) === 530000.00, `Utilized amount should now be 530000.00, got ${updatedBudget.utilized_amount}`);
    assert(Number(updatedBudget.available_headroom) === 2970000.00, `Available headroom should now be 2970000.00, got ${updatedBudget.available_headroom}`);

    // -------------------------------------------------------------
    // Test 7: Atomic Transaction Rollback on Failure
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Atomic Transaction Rollback on Error ---');
    let rollbackThrew = false;
    try {
      await repo.createRequestWithExpenses({
        userId: empId,
        travelType: 'UPCOMING' as TravelType,
        title: 'Failing Transaction Test',
        purpose: 'Testing rollback',
        projectCode: 'TEST-ROLLBACK',
        origin: 'A',
        destination: 'B',
        departureDate: '2026-11-20',
        returnDate: '2026-11-23',
        emergencyContactName: 'Person',
        emergencyContactPhone: '1234',
        expenses: [
          {
            category: 'INVALID_CATEGORY' as any, // Violates check constraint
            merchant: 'Test Merchant',
            amount: 1000,
            expenseDate: '2026-11-20'
          }
        ]
      });
    } catch (err) {
      rollbackThrew = true;
    }
    assert(rollbackThrew, 'Transaction should have rolled back and thrown error');
    const orphanedReq = await pool.query("SELECT * FROM travel_requests WHERE project_code = 'TEST-ROLLBACK'");
    assert(orphanedReq.rows.length === 0, 'No orphaned travel_requests record should exist after rollback');

    console.log('\n==========================================');
    console.log(`🎉 ALL ${passed}/${total} REPOSITORY TESTS PASSED!`);
    console.log('==========================================\n');

  } finally {
    // Cleanup seeded data
    if (createdReqId) {
      await pool.query('DELETE FROM travel_requests WHERE id = $1', [createdReqId]);
    }
    if (empId) await pool.query('DELETE FROM users WHERE id = $1', [empId]);
    if (empOtherId) await pool.query('DELETE FROM users WHERE id = $1', [empOtherId]);
    if (mgrId) await pool.query('DELETE FROM users WHERE id = $1', [mgrId]);
    if (adminId) await pool.query('DELETE FROM users WHERE id = $1', [adminId]);
    await pool.end();
  }
}

runRepoTests().catch((err) => {
  console.error('Fatal repository test error:', err);
  process.exit(1);
});
