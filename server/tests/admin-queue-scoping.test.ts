// server/tests/admin-queue-scoping.test.ts
import assert from 'node:assert/strict';
import { pool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/shared/db/migrate.js';
import { UsersService } from '../src/features/users/users.service.js';
import { usersRepository } from '../src/features/users/users.repository.js';
import { TravelService } from '../src/features/travel/travel.service.js';

async function run() {
  console.log('🧪 Testing Admin Queue Scoping ("Assigned to Me" vs "All Organization") (TDD)...');

  await runMigrations();
  const userService = new UsersService(usersRepository);
  const travelService = new TravelService();

  const timestamp = Date.now();
  const admin1Email = `old.admin.${timestamp}@readventure.com`;
  const admin2Email = `new.admin.${timestamp}@readventure.com`;
  const managerEmail = `scoping.mgr.${timestamp}@readventure.com`;
  const empEmail = `scoping.emp.${timestamp}@readventure.com`;

  let admin1: any;
  let admin2: any;
  let manager: any;
  let employee: any;

  try {
    // 1. Create two separate Admins
    admin1 = await userService.createUser({
      name: 'Primary Admin',
      email: admin1Email,
      password: 'Password123!',
      role: 'ADMIN',
      department: 'Finance',
    });

    admin2 = await userService.createUser({
      name: 'Sudhakar New Admin',
      email: admin2Email,
      password: 'Password123!',
      role: 'ADMIN',
      department: 'Finance',
    });

    // 2. Create Manager reporting to Admin 1
    manager = await userService.createUser({
      name: 'Eng Manager',
      email: managerEmail,
      password: 'Password123!',
      role: 'MANAGER',
      department: 'Engineering',
      reportingAdminId: admin1.id,
    });

    // 3. Create Employee reporting to Manager
    employee = await userService.createUser({
      name: 'Staff Engineer',
      email: empEmail,
      password: 'Password123!',
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: manager.id,
    });

  console.log('✓ Created users: Admin1, Admin2, Manager (reports to Admin1), Employee');

  // 4. Manager submits a personal trip (starts in PENDING_ADMIN_APPROVAL assigned to Admin1)
  const managerTrip = await travelService.createRequest(manager.id, {
    travel_type: 'UPCOMING',
    title: 'Manager Offsite 2026',
    purpose: 'Strategy & Roadmap',
    project_code: 'ENG-ROADMAP',
    origin: 'Bangalore',
    destination: 'Goa',
    departure_date: '2026-12-01',
    return_date: '2026-12-05',
    emergency_contact_name: 'Support Line',
    emergency_contact_phone: '+919876543210',
    currency: 'INR',
    expenses: [
      {
        category: 'HOTEL',
        merchant: 'Taj Resorts',
        amount: 25000,
        expense_date: '2026-12-01',
      },
    ],
  });
  assert.equal(managerTrip.status, 'PENDING_ADMIN_APPROVAL');
  assert.equal(managerTrip.adminId, admin1.id);

  // 5. Employee submits a trip (starts in PENDING_MANAGER_REVIEW under Manager)
  const employeeTrip = await travelService.createRequest(employee.id, {
    travel_type: 'UPCOMING',
    title: 'Staff Client Onboarding',
    purpose: 'Onsite deployment',
    project_code: 'DEPLOY-001',
    origin: 'Chennai',
    destination: 'Hyderabad',
    departure_date: '2026-12-10',
    return_date: '2026-12-12',
    emergency_contact_name: 'Emergency Line',
    emergency_contact_phone: '+919876543211',
    currency: 'INR',
    expenses: [
      {
        category: 'FLIGHT',
        merchant: 'IndiGo',
        amount: 8500,
        expense_date: '2026-12-10',
      },
    ],
  });
  assert.equal(employeeTrip.status, 'PENDING_MANAGER_REVIEW');

  // -------------------------------------------------------------
  // Test Assertion 1: Admin1 "assigned" queue must include both requests
  // (Manager trip has admin_id = admin1.id; Employee trip manager reports to admin1)
  // -------------------------------------------------------------
  const admin1AssignedQueue = await travelService.getAdminQueue(admin1.id, 'assigned');
  const admin1AssignedIds = admin1AssignedQueue.map((r) => r.id);
  assert.ok(
    admin1AssignedIds.includes(managerTrip.id),
    'Admin 1 assigned queue MUST include Manager trip where admin_id = Admin 1'
  );
  assert.ok(
    admin1AssignedIds.includes(employeeTrip.id),
    'Admin 1 assigned queue MUST include Employee trip where manager reports to Admin 1'
  );
  console.log('✓ Test 1 Passed: Admin1 assigned queue includes trips assigned directly or via reporting line');

  // -------------------------------------------------------------
  // Test Assertion 2: Admin2 (New Admin) "assigned" queue MUST NOT include Admin1's trips
  // -------------------------------------------------------------
  const admin2AssignedQueue = await travelService.getAdminQueue(admin2.id, 'assigned');
  const admin2AssignedIds = admin2AssignedQueue.map((r) => r.id);
  assert.ok(
    !admin2AssignedIds.includes(managerTrip.id),
    'Admin 2 assigned queue MUST NOT include Manager trip assigned to Admin 1'
  );
  assert.ok(
    !admin2AssignedIds.includes(employeeTrip.id),
    'Admin 2 assigned queue MUST NOT include Employee trip whose manager reports to Admin 1'
  );
  console.log('✓ Test 2 Passed: Admin2 (New Admin) assigned queue is cleanly isolated from Admin1 trips');

  // -------------------------------------------------------------
  // Test Assertion 3: Admin2 "all" queue returns company-wide requests
  // -------------------------------------------------------------
  const admin2AllQueue = await travelService.getAdminQueue(admin2.id, 'all');
  const admin2AllIds = admin2AllQueue.map((r) => r.id);
  assert.ok(
    admin2AllIds.includes(managerTrip.id),
    'Admin 2 "all" queue MUST include Manager trip across the organization'
  );
  assert.ok(
    admin2AllIds.includes(employeeTrip.id),
    'Admin 2 "all" queue MUST include Employee trip across the organization'
  );
  console.log('✓ Test 3 Passed: Admin2 "all" queue retains full organization-wide visibility');

  // -------------------------------------------------------------
  // Test Assertion 4: Query results include joined supervisor/admin fields
  // -------------------------------------------------------------
  const retrievedManagerTrip = admin2AllQueue.find((r) => r.id === managerTrip.id);
  assert.ok(retrievedManagerTrip);
  assert.equal(retrievedManagerTrip?.adminName, admin1.name);
  assert.equal(retrievedManagerTrip?.adminId, admin1.id);
  assert.equal(retrievedManagerTrip?.requesterReportingAdminId, admin1.id);
  console.log('✓ Test 4 Passed: Admin queue query populates admin_name and reporting_admin fields');

  console.log('🎉 ALL ADMIN QUEUE SCOPING TESTS PASSED!');
  } finally {
    const userIds = [admin1?.id, admin2?.id, manager?.id, employee?.id].filter(Boolean);
    if (userIds.length > 0) {
      await pool.query('UPDATE users SET reporting_admin_id = NULL WHERE reporting_admin_id = ANY($1)', [userIds]);
      await pool.query('UPDATE users SET manager_id = NULL WHERE manager_id = ANY($1)', [userIds]);
      await pool.query('UPDATE travel_requests SET admin_id = NULL WHERE admin_id = ANY($1)', [userIds]);
      await pool.query('UPDATE travel_requests SET manager_id = NULL WHERE manager_id = ANY($1)', [userIds]);
      await pool.query('DELETE FROM notifications WHERE user_id = ANY($1) OR actor_id = ANY($1)', [userIds]);
      await pool.query('DELETE FROM request_timeline_events WHERE actor_id = ANY($1)', [userIds]);
      await pool.query('DELETE FROM travel_requests WHERE user_id = ANY($1)', [userIds]);
      await pool.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
      console.log('🧹 Cleaned up test fixture users.');
    }
  }

  await pool.end();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
