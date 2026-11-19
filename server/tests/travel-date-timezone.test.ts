// server/tests/travel-date-timezone.test.ts
import { pool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/shared/db/migrate.js';
import { TravelRepository } from '../src/features/travel/travel.repository.js';
import { TravelType, ExpenseCategory } from '../src/features/travel/travel.types.js';

async function runDateRangeTests() {
  console.log('🧪 Starting Travel Date Range Timezone Test (TDD RED Phase)...\n');
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

  const timestamp = Date.now();
  const empEmail = `date_emp_${timestamp}@readventure.test`;
  const mgrEmail = `date_mgr_${timestamp}@readventure.test`;

  let empId = '';
  let mgrId = '';
  let createdReqId = '';

  try {
    const mgrRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ('Manager Dave', $1, 'hash', 'MANAGER', 'Engineering')
      RETURNING id;
    `, [mgrEmail]);
    mgrId = mgrRes.rows[0].id;

    const empRes = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, department, manager_id)
      VALUES ('Employee Tharik', $1, 'hash', 'EMPLOYEE', 'Engineering', $2)
      RETURNING id;
    `, [empEmail, mgrId]);
    empId = empRes.rows[0].id;

    // Create request with exact dates: 14-11-2026 to 20-11-2026
    const inputDeparture = '2026-11-14';
    const inputReturn = '2026-11-20';
    const inputExpenseDate = '2026-11-14';

    const createdReq = await repo.createRequestWithExpenses({
      userId: empId,
      managerId: mgrId,
      travelType: 'UPCOMING' as TravelType,
      title: 'Tokyo Architecture Integration 2026',
      purpose: 'Meet client and discuss Tokyo roadmap',
      projectCode: 'ENG-2026',
      origin: 'Bengaluru',
      destination: 'Tokyo, Japan',
      departureDate: inputDeparture,
      returnDate: inputReturn,
      emergencyContactName: 'sudalaimani',
      emergencyContactPhone: '+91 9876543210',
      expenses: [
        {
          category: 'FLIGHT' as ExpenseCategory,
          merchant: 'AirIndia',
          amount: 20000.00,
          expenseDate: inputExpenseDate,
          notes: 'Economy round-trip'
        }
      ]
    });
    createdReqId = createdReq.id;

    console.log('--- Test 1: createRequestWithExpenses returns exact dates without shift ---');
    assert(
      createdReq.departureDate === inputDeparture,
      `Created departureDate should be "${inputDeparture}", got "${createdReq.departureDate}"`
    );
    assert(
      createdReq.returnDate === inputReturn,
      `Created returnDate should be "${inputReturn}", got "${createdReq.returnDate}"`
    );
    assert(
      createdReq.expenses?.[0]?.expenseDate === inputExpenseDate,
      `Created expenseDate should be "${inputExpenseDate}", got "${createdReq.expenses?.[0]?.expenseDate}"`
    );

    console.log('\n--- Test 2: findById preserves exact dates without shift ---');
    const fetchedReq = await repo.findById(createdReqId);
    assert(!!fetchedReq, 'Fetched request should exist');
    assert(
      fetchedReq?.departureDate === inputDeparture,
      `Fetched departureDate should be "${inputDeparture}", got "${fetchedReq?.departureDate}"`
    );
    assert(
      fetchedReq?.returnDate === inputReturn,
      `Fetched returnDate should be "${inputReturn}", got "${fetchedReq?.returnDate}"`
    );
    assert(
      fetchedReq?.expenses?.[0]?.expenseDate === inputExpenseDate,
      `Fetched expenseDate should be "${inputExpenseDate}", got "${fetchedReq?.expenses?.[0]?.expenseDate}"`
    );

    console.log('\n--- Test 3: findScopedRequests preserves exact dates for manager/admin queue ---');
    const mgrQueue = await repo.findScopedRequests(mgrId, 'MANAGER');
    const foundInQueue = mgrQueue.find((r) => r.id === createdReqId);
    assert(!!foundInQueue, 'Request should appear in manager queue');
    assert(
      foundInQueue?.departureDate === inputDeparture,
      `Scoped departureDate should be "${inputDeparture}", got "${foundInQueue?.departureDate}"`
    );
    assert(
      foundInQueue?.returnDate === inputReturn,
      `Scoped returnDate should be "${inputReturn}", got "${foundInQueue?.returnDate}"`
    );

    console.log('\n==========================================');
    console.log(`🎉 ALL ${passed}/${total} DATE RANGE TESTS PASSED!`);
    console.log('==========================================\n');
  } finally {
    if (createdReqId) {
      await pool.query('DELETE FROM travel_requests WHERE id = $1', [createdReqId]);
    }
    if (empId) await pool.query('DELETE FROM users WHERE id = $1', [empId]);
    if (mgrId) await pool.query('DELETE FROM users WHERE id = $1', [mgrId]);
    await pool.end();
  }
}

runDateRangeTests().catch((err) => {
  console.error('\n❌ Test failure:', err.message);
  process.exit(1);
});
