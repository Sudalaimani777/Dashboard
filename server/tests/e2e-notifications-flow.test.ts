// server/tests/e2e-notifications-flow.test.ts
import { pool } from '../src/shared/db/pool.js';
import { TravelService } from '../src/features/travel/travel.service.js';
import { notificationService } from '../src/features/notifications/notification.service.js';
import { sseRegistry } from '../src/features/notifications/notificationStream.js';
import { emailService } from '../src/shared/services/email.service.js';

async function runE2ENotificationsFlowTest() {
  console.log('🧪 Starting End-to-End Notifications Lifecycle Flow Test...\n');

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

  // Intercept outgoing emails
  const capturedEmails: any[] = [];
  emailService.setTransporter({
    sendMail: async (mailOptions: any) => {
      capturedEmails.push(mailOptions);
      return { messageId: `mock-${Date.now()}-${capturedEmails.length}` };
    }
  } as any);

  const timestamp = Date.now();
  const empEmail = `e2e_emp_${timestamp}@tripflow.test`;
  const mgrEmail = `e2e_mgr_${timestamp}@tripflow.test`;
  const adminEmail = `e2e_admin_${timestamp}@tripflow.test`;

  let empId = '';
  let mgrId = '';
  let adminId = '';
  let requestId = '';

  const ssePackets: { userId: string; packet: string }[] = [];
  const mockSseClient = (userId: string) => ({
    write: (data: string) => {
      ssePackets.push({ userId, packet: data });
    }
  });

  const travelService = new TravelService();

  try {
    // Setup users
    const mgrRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('Manager Mia', $1, 'hash123', 'MANAGER', 'Product')
       RETURNING id;`,
      [mgrEmail]
    );
    mgrId = mgrRes.rows[0].id;

    const empRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, manager_id)
       VALUES ('Engineer Evan', $1, 'hash123', 'EMPLOYEE', 'Product', $2)
       RETURNING id;`,
      [empEmail, mgrId]
    );
    empId = empRes.rows[0].id;

    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('Admin Aaron', $1, 'hash123', 'ADMIN', 'Executive')
       RETURNING id;`,
      [adminEmail]
    );
    adminId = adminRes.rows[0].id;

    // Register SSE clients for employee and manager
    const empStream = mockSseClient(empId);
    const mgrStream = mockSseClient(mgrId);
    sseRegistry.addClient(empId, empStream as any);
    sseRegistry.addClient(mgrId, mgrStream as any);

    // Step 1: Employee submits travel request
    console.log('--- Step 1: Employee Submits Travel Request ---');
    const trip = await travelService.createRequest(empId, {
      travelType: 'UPCOMING',
      title: 'Design Sprint in Berlin',
      purpose: 'Q4 Product Roadmap Alignment',
      projectCode: 'PROD-2026',
      origin: 'Mumbai',
      destination: 'Berlin',
      departureDate: '2026-12-01',
      returnDate: '2026-12-07',
      emergencyContactName: 'Jane Evan',
      emergencyContactPhone: '+919876543210',
      expenses: [
        { category: 'FLIGHT', merchant: 'Lufthansa', amount: 85000, expenseDate: '2026-12-01' }
      ]
    });
    requestId = trip.id;
    assert(Boolean(requestId), 'Trip created successfully');

    // Verify Manager received notification & email
    const mgrNotifs1 = await notificationService.getUserNotifications(mgrId);
    assert(mgrNotifs1.unreadCount === 1, 'Manager has 1 unread notification');
    assert(mgrNotifs1.notifications[0].type === 'TRAVEL_SUBMITTED', 'Notification type is TRAVEL_SUBMITTED');
    assert(mgrNotifs1.notifications[0].title === 'New Travel Request Submitted', 'Title is New Travel Request Submitted');
    assert(mgrNotifs1.notifications[0].message.includes('Engineer Evan'), 'Message body contains requester name');

    const mgrSse1 = ssePackets.filter((p) => p.userId === mgrId);
    assert(mgrSse1.length >= 1, 'Manager received real-time SSE stream packet');

    const mgrEmail1 = capturedEmails.find((e) => e.to === mgrEmail);
    assert(Boolean(mgrEmail1), 'Manager received transactional email for submission');
    assert(mgrEmail1.subject.includes('New Travel Request from Engineer Evan'), 'Email subject is accurate');

    // Step 2: Manager reviews and requests revisions
    console.log('\n--- Step 2: Manager Requests Revisions ---');
    await travelService.managerReview(mgrId, requestId, {
      action: 'REQUEST_REVISION',
      remarks: 'Please attach quotation for economy flight booking.'
    });

    // Verify Employee received revision notification & email
    const empNotifs1 = await notificationService.getUserNotifications(empId);
    assert(empNotifs1.unreadCount === 1, 'Employee has 1 unread notification');
    assert(empNotifs1.notifications[0].type === 'REVISION_REQUESTED', 'Employee notification type is REVISION_REQUESTED');
    assert(empNotifs1.notifications[0].message.includes('attach quotation'), 'Notification body contains manager remarks');

    const empSse1 = ssePackets.filter((p) => p.userId === empId);
    assert(empSse1.length >= 1, 'Employee received real-time SSE stream packet');

    const empEmail1 = capturedEmails.find((e) => e.to === empEmail && e.subject.includes('Revisions requested'));
    assert(Boolean(empEmail1), 'Employee received transactional revision email');

    // Step 3: Employee marks revision notification as read
    console.log('\n--- Step 3: Employee Marks Notification as Read ---');
    const readSuccess = await notificationService.markAsRead(empNotifs1.notifications[0].id, empId);
    assert(readSuccess === true, 'markAsRead returned true');

    const empNotifs2 = await notificationService.getUserNotifications(empId);
    assert(empNotifs2.unreadCount === 0, 'Employee unread count decreased to 0');
    assert(empNotifs2.notifications[0].isRead === true, 'Notification is marked read');

    // Step 4: Employee resubmits altered itinerary
    console.log('\n--- Step 4: Employee Resubmits Itinerary ---');
    await travelService.employeeResubmit(empId, requestId, {
      remarks: 'Quotation attached with Lufthansa Economy.',
      expenses: [
        { category: 'FLIGHT', merchant: 'Lufthansa', amount: 80000, expenseDate: '2026-12-01' }
      ]
    });

    const mgrNotifs2 = await notificationService.getUserNotifications(mgrId);
    assert(mgrNotifs2.notifications[0].type === 'RESUBMITTED', 'Manager received RESUBMITTED notification');

    // Step 5: Manager approves and forwards to Admin
    console.log('\n--- Step 5: Manager Approves & Forwards to Admin ---');
    await travelService.managerReview(mgrId, requestId, {
      action: 'APPROVE',
      remarks: 'Verified economy quote.'
    });

    // Verify Manager card transitioned to FORWARDED_TO_ADMIN and marked read
    const mgrNotifsAfterApprove = await notificationService.getUserNotifications(mgrId);
    assert(mgrNotifsAfterApprove.notifications.length === 1, 'Manager has strictly 1 notification card (no duplicates)');
    assert(mgrNotifsAfterApprove.notifications[0].type === 'FORWARDED_TO_ADMIN', 'Manager card is FORWARDED_TO_ADMIN');
    assert(mgrNotifsAfterApprove.notifications[0].isRead === true, 'Manager card is marked read after approval action');

    // Step 6: Admin clearance (Executive approval)
    console.log('\n--- Step 6: Admin Approves Travel (Upcoming Clearance) ---');
    await travelService.adminReview(adminId, requestId, {
      action: 'APPROVE',
      remarks: 'Budget cleared.'
    });

    const empNotifs3 = await notificationService.getUserNotifications(empId);
    assert(empNotifs3.notifications.length === 1, 'Employee has strictly 1 notification card (no duplicates)');
    assert(empNotifs3.notifications[0].type === 'TRAVEL_APPROVED', 'Employee received TRAVEL_APPROVED notification');
    assert(empNotifs3.unreadCount === 1, 'Employee unread count incremented on new approval');

    // Verify Manager's card transitioned to TRAVEL_APPROVED
    const mgrNotifsFinal = await notificationService.getUserNotifications(mgrId);
    assert(mgrNotifsFinal.notifications.length === 1, 'Manager maintains strictly 1 notification card after clearance');
    assert(mgrNotifsFinal.notifications[0].type === 'TRAVEL_APPROVED', 'Manager card updated to TRAVEL_APPROVED');

    // Verify Admin's card transitioned to TRAVEL_APPROVED and marked read
    const adminNotifsFinal = await notificationService.getUserNotifications(adminId);
    assert(adminNotifsFinal.notifications.length === 1, 'Admin has strictly 1 notification card');
    assert(adminNotifsFinal.notifications[0].type === 'TRAVEL_APPROVED', 'Admin card updated to TRAVEL_APPROVED');
    assert(adminNotifsFinal.notifications[0].isRead === true, 'Admin card marked read upon completing clearance action');

    const approvalEmail = capturedEmails.find((e) => e.to === empEmail && e.subject.includes('Approved'));
    assert(Boolean(approvalEmail), 'Employee received transactional approval email');

    // Step 7: Bulk mark all as read
    console.log('\n--- Step 7: Employee Marks All As Read ---');
    const countUpdated = await notificationService.markAllAsRead(empId);
    assert(countUpdated >= 1, `markAllAsRead updated ${countUpdated} notification(s)`);

    const empNotifs4 = await notificationService.getUserNotifications(empId);
    assert(empNotifs4.unreadCount === 0, 'All employee notifications are now marked read');

    // Cleanup SSE clients
    sseRegistry.removeClient(empId, empStream as any);
    sseRegistry.removeClient(mgrId, mgrStream as any);

    console.log('\n==========================================');
    console.log(`🎉 ALL ${passed}/${total} E2E NOTIFICATIONS LIFECYCLE TESTS PASSED!`);
    console.log('==========================================\n');
  } finally {
    // Cleanup database
    if (requestId) {
      await pool.query('DELETE FROM travel_requests WHERE id = $1', [requestId]);
    }
    if (empId) {
      await pool.query('DELETE FROM users WHERE id = $1', [empId]);
    }
    if (mgrId) {
      await pool.query('DELETE FROM users WHERE id = $1', [mgrId]);
    }
    if (adminId) {
      await pool.query('DELETE FROM users WHERE id = $1', [adminId]);
    }
  }
}

runE2ENotificationsFlowTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('E2E Notifications Test Failed:', err);
    process.exit(1);
  });
