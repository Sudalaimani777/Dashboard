// server/tests/travel-reporting-admin-routing.test.ts
import assert from 'node:assert/strict';
import { pool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/shared/db/migrate.js';
import { UsersService } from '../src/features/users/users.service.js';
import { usersRepository } from '../src/features/users/users.repository.js';
import { TravelService } from '../src/features/travel/travel.service.js';

async function run() {
  console.log('🧪 Testing Travel Routing & Notification Engine with Reporting Admin (TDD)...');

  await runMigrations();
  const userService = new UsersService(usersRepository);
  const travelService = new TravelService();

  const timestamp = Date.now();
  const adminEmail = `route.admin.${timestamp}@readventure.com`;
  const managerEmail = `route.mgr.${timestamp}@readventure.com`;
  const empEmail = `route.emp.${timestamp}@readventure.com`;

  let admin: any;
  let manager: any;
  let employee: any;
  let managerTrip: any;
  let empTrip: any;

  try {
    // 1. Create hierarchy: Admin -> Manager (reporting to Admin) -> Employee (reporting to Manager)
    admin = await userService.createUser({
      name: 'Executive Director',
      email: adminEmail,
      password: 'Password123!',
      role: 'ADMIN',
      department: 'Engineering',
    });

    manager = await userService.createUser({
      name: 'Team Lead Manager',
      email: managerEmail,
      password: 'Password123!',
      role: 'MANAGER',
      department: 'Engineering',
      reportingAdminId: admin.id,
    });

    employee = await userService.createUser({
      name: 'Senior Developer',
      email: empEmail,
      password: 'Password123!',
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: manager.id,
    });

  console.log('✓ Created test hierarchy: Admin -> Manager -> Employee');

  // -------------------------------------------------------------
  // Test 1: Manager Personal Travel Request (Option A)
  // When a Manager submits a travel request, it must go directly to
  // PENDING_ADMIN_APPROVAL and pre-assign admin_id = manager.reporting_admin_id
  // -------------------------------------------------------------
  const managerTrip = await travelService.createRequest(manager.id, {
    travel_type: 'UPCOMING',
    title: 'Executive Architecture Summit',
    purpose: 'Quarterly architecture alignment with executive partners',
    project_code: 'ENG-2026',
    origin: 'Bangalore',
    destination: 'Mumbai',
    departure_date: '2026-12-01',
    return_date: '2026-12-05',
    emergency_contact_name: 'Contact Name',
    emergency_contact_phone: '+919876543210',
    expenses: [
      {
        category: 'FLIGHT',
        merchant: 'Air India',
        amount: 15000,
        currency: 'INR',
        expense_date: '2026-12-01',
      },
    ],
  });

  assert.equal(
    managerTrip.status,
    'PENDING_ADMIN_APPROVAL',
    'Manager travel request must start directly in PENDING_ADMIN_APPROVAL (Option A)'
  );
  assert.equal(
    managerTrip.adminId || (managerTrip as any).admin_id,
    admin.id,
    'Manager travel request must be assigned to the Manager reporting_admin_id'
  );

  // Verify targeted notification sent to reporting admin
  const adminNotifRes = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 AND request_id = $2`,
    [admin.id, managerTrip.id]
  );
  assert.ok(
    adminNotifRes.rows.length > 0,
    'Reporting admin must receive targeted notification for Manager personal trip'
  );
  console.log('✓ Test 1 Passed: Manager trip starts in PENDING_ADMIN_APPROVAL with admin_id assigned');

  // -------------------------------------------------------------
  // Test 2: Employee Travel Request Auto-Routing
  // When Employee submits: starts in PENDING_MANAGER_REVIEW
  // When Manager approves: transitions to PENDING_ADMIN_APPROVAL,
  // automatically routed to Manager reporting_admin_id!
  // -------------------------------------------------------------
  const empTrip = await travelService.createRequest(employee.id, {
    travel_type: 'UPCOMING',
    title: 'Client Integration Workshop',
    purpose: 'Onsite deployment with customer engineering team',
    project_code: 'ENG-2026',
    origin: 'Bangalore',
    destination: 'Delhi',
    departure_date: '2026-12-10',
    return_date: '2026-12-12',
    emergency_contact_name: 'Family Contact',
    emergency_contact_phone: '+919876543210',
    expenses: [
      {
        category: 'HOTEL',
        merchant: 'Taj Hotels',
        amount: 8000,
        currency: 'INR',
        expense_date: '2026-12-10',
      },
    ],
  });

  assert.equal(
    empTrip.status,
    'PENDING_MANAGER_REVIEW',
    'Employee travel request must start in PENDING_MANAGER_REVIEW'
  );

  // Manager approves and forwards
  const approvedByMgr = await travelService.managerReview(manager.id, empTrip.id, {
    action: 'APPROVE_AND_FORWARD',
    remarks: 'Approved. Forwarding to executive sponsor.',
  });

  assert.equal(
    approvedByMgr.status,
    'PENDING_ADMIN_APPROVAL',
    'Manager approval must transition request to PENDING_ADMIN_APPROVAL'
  );
  assert.equal(
    approvedByMgr.adminId || (approvedByMgr as any).admin_id,
    admin.id,
    'Forwarded employee request must be automatically routed to Manager reporting_admin_id'
  );

  // Verify notification sent to Manager's reporting admin
  const forwardedNotifRes = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 AND request_id = $2 AND actor_id = $3`,
    [admin.id, empTrip.id, manager.id]
  );
  assert.ok(
    forwardedNotifRes.rows.length > 0,
    "Manager's Reporting Admin must receive targeted notification for forwarded trip"
  );
  console.log('✓ Test 2 Passed: Manager approval auto-routes employee trip to Manager reporting_admin_id');

  console.log('🎉 ALL TRAVEL REPORTING ADMIN ROUTING TESTS PASSED!');
  } finally {
    // Cleanup
    const reqIds = [managerTrip?.id, empTrip?.id].filter(Boolean);
    if (reqIds.length > 0) {
      await pool.query('DELETE FROM travel_expenses WHERE travel_request_id = ANY($1)', [reqIds]);
      await pool.query('DELETE FROM request_timeline_events WHERE travel_request_id = ANY($1)', [reqIds]);
      await pool.query('DELETE FROM notifications WHERE request_id = ANY($1)', [reqIds]);
      await pool.query('DELETE FROM travel_requests WHERE id = ANY($1)', [reqIds]);
    }
    const userIds = [employee?.id, manager?.id, admin?.id].filter(Boolean);
    if (userIds.length > 0) {
      await pool.query('UPDATE users SET reporting_admin_id = NULL WHERE reporting_admin_id = ANY($1)', [userIds]);
      await pool.query('UPDATE users SET manager_id = NULL WHERE manager_id = ANY($1)', [userIds]);
      await pool.query('DELETE FROM notifications WHERE user_id = ANY($1) OR actor_id = ANY($1)', [userIds]);
      await pool.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
      console.log('🧹 Cleaned up routing test fixture users.');
    }
  }

  await pool.end();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('❌ Test failed:', err);
  await pool.end();
  process.exit(1);
});
