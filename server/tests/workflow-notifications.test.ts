// server/tests/workflow-notifications.test.ts
import { pool } from '../src/shared/db/pool.js';
import { TravelService } from '../src/features/travel/travel.service.js';
import { sseRegistry } from '../src/features/notifications/notificationStream.js';
import { emailService } from '../src/shared/services/email.service.js';
import { notificationRepo } from '../src/features/notifications/notification.repository.js';

async function runWorkflowNotificationTests() {
  console.log('🧪 Starting Workflow Notifications Integration Test Suite...\n');

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

  // Intercept emails
  const sentEmails: any[] = [];
  emailService.setTransporter({
    sendMail: async (options: any) => {
      sentEmails.push(options);
      return { messageId: `msg-${Date.now()}-${sentEmails.length}` };
    }
  } as any);

  const timestamp = Date.now();
  const empEmail = `emp_${timestamp}@flow.test`;
  const mgrEmail = `mgr_${timestamp}@flow.test`;
  const adminEmail = `admin_${timestamp}@flow.test`;

  let empId = '';
  let mgrId = '';
  let adminId = '';
  const createdRequestIds: string[] = [];

  let mockEmpRes: any;
  let mockMgrRes: any;
  let mockAdminRes: any;

  const travelService = new TravelService();

  try {
    // 1. Create Manager
    const mgrRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('Manager Mark', $1, 'hash', 'MANAGER', 'Engineering')
       RETURNING id;`,
      [mgrEmail]
    );
    mgrId = mgrRes.rows[0].id;

    // 2. Create Employee assigned to Manager
    const empRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, manager_id)
       VALUES ('Employee Emma', $1, 'hash', 'EMPLOYEE', 'Engineering', $2)
       RETURNING id;`,
      [empEmail, mgrId]
    );
    empId = empRes.rows[0].id;

    // 3. Create Admin
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('Admin Alice', $1, 'hash', 'ADMIN', 'Executive')
       RETURNING id;`,
      [adminEmail]
    );
    adminId = adminRes.rows[0].id;

    // Register mock SSE clients for all three users
    const empSseMessages: string[] = [];
    const mgrSseMessages: string[] = [];
    const adminSseMessages: string[] = [];

    mockEmpRes = { write: (data: string) => empSseMessages.push(data) };
    mockMgrRes = { write: (data: string) => mgrSseMessages.push(data) };
    mockAdminRes = { write: (data: string) => adminSseMessages.push(data) };

    sseRegistry.addClient(empId, mockEmpRes);
    sseRegistry.addClient(mgrId, mockMgrRes);
    sseRegistry.addClient(adminId, mockAdminRes);

    // ========================================================
    // TEST 1: Employee submits UPCOMING travel request
    // ========================================================
    console.log('\n--- Scenario 1: Employee Submits Travel Request ---');
    const tripPayload1 = {
      travel_type: 'UPCOMING',
      title: 'Tech Conference 2026',
      purpose: 'Presenting research paper',
      project_code: 'ENG-2026',
      origin: 'Delhi',
      destination: 'Hyderabad',
      departure_date: '2026-12-10',
      return_date: '2026-12-14',
      emergency_contact_name: 'John Doe',
      emergency_contact_phone: '+919876543210',
      expenses: [
        { category: 'FLIGHT', merchant: 'Air India', amount: 15000, expense_date: '2026-12-10' }
      ]
    };

    const trip1 = await travelService.createRequest(empId, tripPayload1);
    createdRequestIds.push(trip1.id);

    // Verify Manager received persistent notification
    const mgrNotifs1 = await notificationRepo.getByUserId(mgrId);
    assert(mgrNotifs1.notifications.length === 1, 'Manager received 1 notification row in DB');
    const notif1 = mgrNotifs1.notifications[0];
    assert(notif1.type === 'TRAVEL_SUBMITTED', 'Notification type is TRAVEL_SUBMITTED');
    assert(notif1.requestId === trip1.id, 'Notification references created trip');
    assert(notif1.actorId === empId, 'Notification actor is employee');
    assert(notif1.title.includes('Submitted'), 'Notification title indicates submission');

    // Verify Manager received SSE event
    assert(mgrSseMessages.length >= 1, 'Manager received SSE broadcast message');
    const ssePayload1 = JSON.parse(mgrSseMessages[0].replace('data: ', ''));
    assert(ssePayload1.type === 'TRAVEL_SUBMITTED', 'SSE payload type is TRAVEL_SUBMITTED');

    // ========================================================
    // TEST 2: Manager reviews and requests revision
    // ========================================================
    console.log('\n--- Scenario 2: Manager Requests Revision ---');
    await travelService.managerReview(mgrId, trip1.id, {
      action: 'REQUEST_REVISION',
      remarks: 'Please find cheaper flights'
    });

    // Verify Employee received notification
    const empNotifs1 = await notificationRepo.getByUserId(empId);
    assert(empNotifs1.notifications.length === 1, 'Employee received revision notification in DB');
    const notif2 = empNotifs1.notifications[0];
    assert(notif2.type === 'REVISION_REQUESTED', 'Notification type is REVISION_REQUESTED');
    assert(notif2.message.includes('cheaper flights'), 'Notification contains reviewer remarks');

    // Verify Employee received SSE
    assert(empSseMessages.length >= 1, 'Employee received SSE broadcast message');
    const empSsePayload = JSON.parse(empSseMessages[0].replace('data: ', ''));
    assert(empSsePayload.type === 'REVISION_REQUESTED', 'Employee SSE type is REVISION_REQUESTED');

    // ========================================================
    // TEST 3: Employee resubmits travel request
    // ========================================================
    console.log('\n--- Scenario 3: Employee Resubmits Request ---');
    await travelService.employeeResubmit(empId, trip1.id, {
      remarks: 'Updated flight with Indigo',
      expenses: [
        { category: 'FLIGHT', merchant: 'Indigo', amount: 9500, expense_date: '2026-12-10' }
      ]
    });

    // Verify Manager received RESUBMITTED notification
    const mgrNotifs2 = await notificationRepo.getByUserId(mgrId);
    assert(mgrNotifs2.notifications.length === 1, 'Manager retains strictly 1 updated notification for trip1');
    const notif3 = mgrNotifs2.notifications[0]; // latest first
    assert(notif3.type === 'RESUBMITTED', 'Latest notification type is RESUBMITTED');

    // ========================================================
    // TEST 4: Manager approves and forwards to Admin
    // ========================================================
    console.log('\n--- Scenario 4: Manager Approves & Forwards to Admin ---');
    await travelService.managerReview(mgrId, trip1.id, {
      action: 'APPROVE_AND_FORWARD',
      remarks: 'Budget looks optimal now'
    });

    // Verify Manager card transitioned to FORWARDED_TO_ADMIN (marked read)
    const mgrNotifsAfterForward = await notificationRepo.getByUserId(mgrId);
    assert(mgrNotifsAfterForward.notifications.length === 1, 'Manager retains strictly 1 notification after forwarding');
    assert(mgrNotifsAfterForward.notifications[0].type === 'FORWARDED_TO_ADMIN', 'Manager notification transitioned to FORWARDED_TO_ADMIN');
    assert(mgrNotifsAfterForward.notifications[0].isRead === true, 'Manager notification marked read after forward');

    // Verify Admin received notification awaiting review
    const adminNotifs1 = await notificationRepo.getByUserId(adminId);
    assert(adminNotifs1.notifications.length === 1, 'Admin received notification row in DB');
    assert(adminNotifs1.notifications[0].type === 'TRAVEL_SUBMITTED', 'Admin notification type is TRAVEL_SUBMITTED');

    // ========================================================
    // TEST 5: Admin approves UPCOMING trip
    // ========================================================
    console.log('\n--- Scenario 5: Admin Approves Upcoming Trip ---');
    await travelService.adminReview(adminId, trip1.id, {
      action: 'APPROVE',
      remarks: 'Approved by Executive Finance'
    });

    // Requester Emma must receive TRAVEL_APPROVED
    const empNotifsAfterApprove = await notificationRepo.getByUserId(empId);
    const approvedEmpNotif = empNotifsAfterApprove.notifications.find(n => n.type === 'TRAVEL_APPROVED');
    assert(!!approvedEmpNotif, 'Employee received TRAVEL_APPROVED notification');
    assert(empNotifsAfterApprove.notifications.length === 1, 'Employee has strictly 1 notification for trip1');

    // Manager must also receive TRAVEL_APPROVED notification
    const mgrNotifsAfterApprove = await notificationRepo.getByUserId(mgrId);
    assert(mgrNotifsAfterApprove.notifications.length === 1, 'Manager has strictly 1 notification for trip1 (updated from FORWARDED_TO_ADMIN)');
    const approvedMgrNotif = mgrNotifsAfterApprove.notifications.find(n => n.type === 'TRAVEL_APPROVED');
    assert(!!approvedMgrNotif, 'Line manager received TRAVEL_APPROVED notification');

    // ========================================================
    // TEST 6: Admin settles ALREADY_TRAVELLED reimbursement
    // ========================================================
    console.log('\n--- Scenario 6: Admin Settles Reimbursement ---');
    const pastTripPayload = {
      travel_type: 'ALREADY_TRAVELLED',
      title: 'Client Meeting Pune',
      purpose: 'Emergency client architecture fix',
      project_code: 'ENG-2026',
      origin: 'Mumbai',
      destination: 'Pune',
      departure_date: '2026-11-01',
      return_date: '2026-11-03',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+919876543211',
      expenses: [
        { category: 'TRANSIT', merchant: 'Ola', amount: 3200, expense_date: '2026-11-01' }
      ]
    };

    const trip2 = await travelService.createRequest(empId, pastTripPayload);
    createdRequestIds.push(trip2.id);

    // Manager approves and forwards
    await travelService.managerReview(mgrId, trip2.id, { action: 'APPROVE_AND_FORWARD' });

    // Admin approves (settles reimbursement)
    await travelService.adminReview(adminId, trip2.id, { action: 'APPROVE' });

    const empNotifsAfterSettle = await notificationRepo.getByUserId(empId);
    const settledEmpNotif = empNotifsAfterSettle.notifications.find(n => n.type === 'TRAVEL_SETTLED');
    assert(!!settledEmpNotif, 'Employee received TRAVEL_SETTLED notification for reimbursement');

    // ========================================================
    // TEST 7: Manager personal travel triggers MANAGER_OVERSIGHT
    // ========================================================
    console.log('\n--- Scenario 7: Manager Personal Travel Oversight ---');
    const managerPersonalTrip = {
      travel_type: 'UPCOMING',
      title: 'Leadership Offsite Singapore',
      purpose: 'Global strategic planning offsite',
      project_code: 'EXEC-2026',
      origin: 'Bangalore',
      destination: 'Singapore',
      departure_date: '2026-12-20',
      return_date: '2026-12-24',
      emergency_contact_name: 'Alex Mark',
      emergency_contact_phone: '+919876543299',
      expenses: [
        { category: 'HOTEL', merchant: 'Marina Bay Sands', amount: 75000, expense_date: '2026-12-20' }
      ]
    };

    const trip3 = await travelService.createRequest(mgrId, managerPersonalTrip);
    createdRequestIds.push(trip3.id);

    const adminNotifsAfterMgrTrip = await notificationRepo.getByUserId(adminId);
    const oversightNotif = adminNotifsAfterMgrTrip.notifications.find(n => n.type === 'MANAGER_OVERSIGHT');
    assert(!!oversightNotif, 'Admin received MANAGER_OVERSIGHT notification');
    assert(oversightNotif?.actorId === mgrId, 'Oversight notification actor is the manager');
    assert(oversightNotif?.title.includes('Oversight'), 'Oversight notification title indicates oversight');

    console.log(`\n🎉 All ${passed}/${total} Workflow Notifications Integration tests passed!`);
  } finally {
    // Clean up mock SSE clients
    sseRegistry.removeClient(empId, mockEmpRes);
    sseRegistry.removeClient(mgrId, mockMgrRes);
    sseRegistry.removeClient(adminId, mockAdminRes);

    // Clean up database test records
    for (const reqId of createdRequestIds) {
      await pool.query('DELETE FROM travel_requests WHERE id = $1', [reqId]);
    }
    if (empId || mgrId || adminId) {
      await pool.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [empId, mgrId, adminId]);
    }
    await pool.end();
  }
}

runWorkflowNotificationTests().catch((err) => {
  console.error('\n❌ Workflow Notifications Test Failed:', err.message, err.stack);
  process.exit(1);
});
