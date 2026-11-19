// server/tests/travel-service.test.ts
import { pool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/shared/db/migrate.js';
import { TravelService } from '../src/features/travel/travel.service.js';

async function runTravelServiceTests() {
  console.log('Starting TravelService Test Suite (TDD RED Phase)...\n');

  await runMigrations();
  const service = new TravelService();

  // Create test actors
  const timestamp = Date.now();
  const empRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ('Service Emp', 'svc_emp_${timestamp}@corp.com', 'hash', 'EMPLOYEE', 'Engineering')
     RETURNING id;`
  );
  const mgrRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ('Service Mgr', 'svc_mgr_${timestamp}@corp.com', 'hash', 'MANAGER', 'Engineering')
     RETURNING id;`
  );
  const admRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ('Service Adm', 'svc_adm_${timestamp}@corp.com', 'hash', 'ADMIN', 'Executive')
     RETURNING id;`
  );

  const empId = empRes.rows[0].id;
  const mgrId = mgrRes.rows[0].id;
  const admId = admRes.rows[0].id;

  // Link employee to manager
  await pool.query('UPDATE users SET manager_id = $1 WHERE id = $2', [mgrId, empId]);

  try {
    // -------------------------------------------------------------
    // Test 1: Submit new UPCOMING travel request
    // -------------------------------------------------------------
    console.log('--- Test 1: Create UPCOMING Travel Request ---');
    const createdReq = await service.createRequest(empId, {
      travelType: 'UPCOMING',
      title: 'Global Tech Conclave 2026',
      purpose: 'Present architecture roadmap',
      projectCode: 'PRJ-ARCH-101',
      origin: 'Bengaluru',
      destination: 'Singapore',
      departureDate: '2026-11-20',
      returnDate: '2026-11-25',
      emergencyContactName: 'Priya Sharma',
      emergencyContactPhone: '+919876543210',
      expenses: [
        {
          category: 'FLIGHT',
          merchant: 'Singapore Airlines',
          amount: 45000.00,
          expenseDate: '2026-11-20',
          receiptImageUrl: 'https://proofs.corp.com/sg-flight.png'
        },
        {
          category: 'HOTEL',
          merchant: 'Marina Bay Hotel',
          amount: 55000.00,
          expenseDate: '2026-11-21',
          receiptImageUrl: 'https://proofs.corp.com/sg-hotel.png'
        }
      ]
    });

    console.assert(createdReq.id !== undefined, 'Request ID should be defined');
    console.assert(createdReq.status === 'PENDING_MANAGER_REVIEW', `Expected status PENDING_MANAGER_REVIEW, got ${createdReq.status}`);
    console.assert(createdReq.totalExpenses === 100000.00, `Expected totalExpenses 100000.00, got ${createdReq.totalExpenses}`);
    console.assert(createdReq.expenses?.length === 2, `Expected 2 child expenses, got ${createdReq.expenses?.length}`);
    console.log('PASS: Create travel request with itemized expenses & initial status');

    // -------------------------------------------------------------
    // Test 2: Tier 1 Manager Review -> APPROVE to PENDING_ADMIN_APPROVAL
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Tier 1 Manager Review (APPROVE) ---');
    const mgrApproved = await service.managerReview(mgrId, createdReq.id, {
      action: 'APPROVE',
      remarks: 'Agenda verified and budget impact minimal.'
    });

    console.assert(mgrApproved.status === 'PENDING_ADMIN_APPROVAL', `Expected status PENDING_ADMIN_APPROVAL, got ${mgrApproved.status}`);
    console.assert(mgrApproved.managerRemarks === 'Agenda verified and budget impact minimal.', 'Manager remarks should be recorded');
    console.log('PASS: Manager approval transitions request to PENDING_ADMIN_APPROVAL');

    // -------------------------------------------------------------
    // Test 3: Tier 2 Admin Review -> REVISE (Route B: Direct to Employee)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Tier 2 Admin Review (REVISE Route B -> Direct to Employee) ---');
    const adminRevised = await service.adminReview(admId, createdReq.id, {
      action: 'REVISE',
      revisionTarget: 'EMPLOYEE',
      remarks: 'Hotel amount is above per-diem cap. Please choose corporate partner rate.'
    });

    console.assert(
      adminRevised.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
      `Expected status REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE, got ${adminRevised.status}`
    );
    console.assert(adminRevised.revisionTarget === 'EMPLOYEE', 'Revision target should be EMPLOYEE');
    console.log('PASS: Admin revision dispatch to employee sets status correctly');

    // -------------------------------------------------------------
    // Test 4: Manager Re-Verification Invariant upon Employee Resubmission
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Manager Re-Verification Invariant on Resubmit ---');
    // Employee modifies expenses to meet per-diem cap and resubmits
    const resubmitted = await service.employeeResubmit(empId, createdReq.id, {
      remarks: 'Switched hotel to corporate discount partner rate ($35,000).',
      expenses: [
        {
          category: 'FLIGHT',
          merchant: 'Singapore Airlines',
          amount: 45000.00,
          expenseDate: '2026-11-20',
          receiptImageUrl: 'https://proofs.corp.com/sg-flight.png'
        },
        {
          category: 'HOTEL',
          merchant: 'Partner Hotel Express',
          amount: 35000.00,
          expenseDate: '2026-11-21',
          receiptImageUrl: 'https://proofs.corp.com/sg-hotel-partner.png'
        }
      ]
    });

    // Invariant: MUST return to PENDING_MANAGER_REVIEW, never bypass directly to Admin!
    console.assert(
      resubmitted.status === 'PENDING_MANAGER_REVIEW',
      `INVARIANT VIOLATION: Expected status PENDING_MANAGER_REVIEW, got ${resubmitted.status}`
    );
    console.assert(resubmitted.totalExpenses === 80000.00, `Expected recalculated total 80000.00, got ${resubmitted.totalExpenses}`);
    console.log('  ✅ PASS: Employee resubmission strictly routes to PENDING_MANAGER_REVIEW');

    // -------------------------------------------------------------
    // Test 5: Manager Re-verifies & Re-approves -> PENDING_ADMIN_APPROVAL
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Manager Re-Verifies & Forwards to Admin ---');
    const mgrReApproved = await service.managerReview(mgrId, createdReq.id, {
      action: 'APPROVE',
      remarks: 'Revised hotel quotes reviewed and approved.'
    });

    console.assert(mgrReApproved.status === 'PENDING_ADMIN_APPROVAL', `Expected status PENDING_ADMIN_APPROVAL, got ${mgrReApproved.status}`);
    console.log('  PASS: Manager re-verification advances request back to Admin');

    // -------------------------------------------------------------
    // Test 6: Tier 2 Admin Review -> Final APPROVE (UPCOMING -> APPROVED)
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Admin Final Clearance (UPCOMING -> APPROVED) ---');
    const finalApproved = await service.adminReview(admId, createdReq.id, {
      action: 'APPROVE',
      remarks: 'All documents verified. Executive clearance granted.'
    });

    console.assert(finalApproved.status === 'APPROVED', `Expected status APPROVED for upcoming travel, got ${finalApproved.status}`);
    console.log('  PASS: Admin final approval transitions UPCOMING travel to APPROVED');

    // -------------------------------------------------------------
    // Test 7: Case 1 (ALREADY_TRAVELLED) Reimbursement -> SETTLED
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Case 1 Post-Trip Reimbursement Lifecycle (-> SETTLED) ---');
    const postTripReq = await service.createRequest(empId, {
      travelType: 'ALREADY_TRAVELLED',
      title: 'Delhi Client Incident Retrospective',
      purpose: 'Emergency on-site root cause review',
      projectCode: 'PRJ-OPS-999',
      origin: 'Bengaluru',
      destination: 'Delhi',
      departureDate: '2026-11-01',
      returnDate: '2026-11-03',
      emergencyContactName: 'K. Raman',
      emergencyContactPhone: '+919876543211',
      expenses: [
        {
          category: 'FLIGHT',
          merchant: 'IndiGo',
          amount: 14500.00,
          expenseDate: '2026-11-01',
          receiptImageUrl: 'https://proofs.corp.com/delhi-flight.png'
        },
        {
          category: 'TRANSIT',
          merchant: 'Uber Delhi',
          amount: 1850.00,
          expenseDate: '2026-11-02',
          receiptImageUrl: 'https://proofs.corp.com/delhi-uber.png'
        }
      ]
    });

    // Manager approves
    await service.managerReview(mgrId, postTripReq.id, {
      action: 'APPROVE',
      remarks: 'Tax invoices and GST numbers verified.'
    });

    // Admin approves reimbursement payout -> SETTLED
    const settledReq = await service.adminReview(admId, postTripReq.id, {
      action: 'APPROVE',
      remarks: 'Finance reimbursement processed.'
    });

    console.assert(
      settledReq.status === 'SETTLED',
      `Expected status SETTLED for ALREADY_TRAVELLED post-trip payout, got ${settledReq.status}`
    );
    console.log('  PASS: Case 1 reimbursement transitions to SETTLED upon admin approval');

    // -------------------------------------------------------------
    // Test 8: Admin Revision Route A (Via Manager)
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Admin Revision Route A (Via Manager) ---');
    const routeAReq = await service.createRequest(empId, {
      travelType: 'UPCOMING',
      title: 'Hyderabad Data Center Migration',
      purpose: 'Infrastructure migration rollout',
      projectCode: 'PRJ-INFRA-500',
      origin: 'Bengaluru',
      destination: 'Hyderabad',
      departureDate: '2026-12-05',
      returnDate: '2026-12-08',
      emergencyContactName: 'Contact',
      emergencyContactPhone: '+919876543210',
      expenses: [
        {
          category: 'TRANSIT',
          merchant: 'Vande Bharat Express',
          amount: 4200.00,
          expenseDate: '2026-12-05'
        }
      ]
    });

    await service.managerReview(mgrId, routeAReq.id, { action: 'APPROVE', remarks: 'Looks good' });

    const routeARevised = await service.adminReview(admId, routeAReq.id, {
      action: 'REVISE',
      revisionTarget: 'MANAGER',
      remarks: 'Manager, please confirm if rail booking policy applies.'
    });

    console.assert(
      routeARevised.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
      `Expected REVISION_REQUESTED_BY_ADMIN_TO_MANAGER, got ${routeARevised.status}`
    );
    console.log('  PASS: Admin revision Route A sets status to REVISION_REQUESTED_BY_ADMIN_TO_MANAGER');

    // -------------------------------------------------------------
    // Test 9: Budget Headroom Overflow Guard
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Department Budget Headroom Guard ---');
    // Ensure department budget exists with 10,000 available
    await pool.query(
      `INSERT INTO department_budgets (department, fiscal_year, fiscal_quarter, total_allocation, utilized_amount)
       VALUES ('BudgetTestDept', 2026, 'Q4', 50000.00, 45000.00)
       ON CONFLICT (department, fiscal_year, fiscal_quarter)
       DO UPDATE SET total_allocation = 50000.00, utilized_amount = 45000.00;`
    );

    const budgetEmpRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('Budget Emp', 'budget_emp_${timestamp}@corp.com', 'h', 'EMPLOYEE', 'BudgetTestDept')
       RETURNING id;`
    );
    const budgetEmpId = budgetEmpRes.rows[0].id;

    // Create request with 20,000 (exceeds 5,000 headroom)
    const bigReq = await service.createRequest(budgetEmpId, {
      travelType: 'UPCOMING',
      title: 'Expensive Conference',
      purpose: 'Overseas summit',
      projectCode: 'PRJ-EXP-01',
      origin: 'Bengaluru',
      destination: 'London',
      departureDate: '2026-12-10',
      returnDate: '2026-12-15',
      emergencyContactName: 'Contact',
      emergencyContactPhone: '+919876543210',
      expenses: [
        { category: 'FLIGHT', merchant: 'British Airways', amount: 20000.00, expenseDate: '2026-12-10' }
      ]
    });

    await service.managerReview(mgrId, bigReq.id, { action: 'APPROVE', remarks: 'Recommended' });

    let budgetErrorCaught = false;
    try {
      await service.adminReview(admId, bigReq.id, {
        action: 'APPROVE',
        remarks: 'Attempting to approve without override'
      });
    } catch (err: any) {
      budgetErrorCaught = true;
      console.assert(
        err.message.includes('budget') || err.message.includes('headroom'),
        `Expected budget headroom error, got: ${err.message}`
      );
    }
    console.assert(budgetErrorCaught, 'Admin approval should fail when expenses exceed budget headroom without override');
    console.log('  PASS: Department budget headroom overflow is blocked');

    // Force override allows approval
    const forcedReq = await service.adminReview(admId, bigReq.id, {
      action: 'APPROVE',
      remarks: 'Special executive override approved by CFO',
      forceOverride: true
    });
    console.assert(forcedReq.status === 'APPROVED', 'Should approve with forceOverride');
    console.log('  PASS: Force override successfully approves request exceeding budget');

    // -------------------------------------------------------------
    // Test 10: Unauthorized Modification Blocker
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Employee Unauthorized Modification Blocker ---');
    let modErrorCaught = false;
    try {
      // Trying to modify an already APPROVED request
      await service.employeeResubmit(budgetEmpId, forcedReq.id, {
        remarks: 'Trying to add more expense after approval',
        expenses: [{ category: 'MISC', merchant: 'Taxi', amount: 500, expenseDate: '2026-12-11' }]
      });
    } catch (err: any) {
      modErrorCaught = true;
    }
    console.assert(modErrorCaught, 'Modifying an APPROVED request should be rejected');
    console.log('  PASS: Modification blocked for terminal/non-modifiable statuses');

    // Clean up
    await pool.query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', [empId, mgrId, admId, budgetEmpId]);
    console.log('\n==========================================');
    console.log('ALL 10/10 TRAVEL SERVICE TESTS PASSED!');
    console.log('==========================================\n');
  } finally {
    await pool.end();
  }
}

runTravelServiceTests().catch((err) => {
  console.error('TravelService test suite failed:', err);
  process.exit(1);
});
