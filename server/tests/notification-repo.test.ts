// server/tests/notification-repo.test.ts
import { pool } from '../src/shared/db/pool.js';
import { NotificationRepository } from '../src/features/notifications/notification.repository.js';
import { CreateNotificationInput } from '../src/features/notifications/notification.types.js';

async function runRepoTests() {
  console.log('🧪 Starting NotificationRepository Test Suite (TDD RED Phase)...\n');

  const repo = new NotificationRepository();
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
  const user1Email = `user1_${timestamp}@readventure.test`;
  const user2Email = `user2_${timestamp}@readventure.test`;

  let user1Id = '';
  let user2Id = '';

  try {
    // 1. Create two test users
    const u1Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('User One', $1, 'hash1', 'EMPLOYEE', 'Engineering')
       RETURNING id;`,
      [user1Email]
    );
    user1Id = u1Res.rows[0].id;

    const u2Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('User Two', $1, 'hash2', 'MANAGER', 'Engineering')
       RETURNING id;`,
      [user2Email]
    );
    user2Id = u2Res.rows[0].id;

    // 2. Test create()
    const input1: CreateNotificationInput = {
      userId: user1Id,
      actorId: user2Id,
      type: 'TRAVEL_SUBMITTED',
      title: 'New Trip Request',
      message: 'User One has submitted a trip to Bangalore',
      linkUrl: '/dashboard?tab=notifications'
    };

    const notif1 = await repo.create(input1);
    assert(!!notif1.id, 'create() returns an id');
    assert(notif1.userId === user1Id, 'create() sets correct userId');
    assert(notif1.actorId === user2Id, 'create() sets correct actorId');
    assert(notif1.type === 'TRAVEL_SUBMITTED', 'create() sets correct type');
    assert(notif1.title === 'New Trip Request', 'create() sets correct title');
    assert(notif1.message === 'User One has submitted a trip to Bangalore', 'create() sets correct message');
    assert(notif1.isRead === false, 'create() sets isRead to false by default');
    assert(notif1.linkUrl === '/dashboard?tab=notifications', 'create() sets linkUrl');
    assert(!!notif1.createdAt, 'create() returns createdAt timestamp');

    // Test default linkUrl
    const notifDefaultLink = await repo.create({
      userId: user1Id,
      type: 'REVISION_REQUESTED',
      title: 'Revision Needed',
      message: 'Please update your flight receipts'
    });
    assert(
      notifDefaultLink.linkUrl === '/dashboard?tab=notifications',
      'create() uses default linkUrl when omitted'
    );

    // Create a notification for User 2
    const notifUser2 = await repo.create({
      userId: user2Id,
      actorId: user1Id,
      type: 'TRAVEL_APPROVED',
      title: 'Travel Approved',
      message: 'Your travel has been approved'
    });

    // 3. Test getByUserId() and unreadCount
    const user1List = await repo.getByUserId(user1Id);
    assert(user1List.notifications.length === 2, 'getByUserId() returns correct notification count for user1');
    assert(user1List.unreadCount === 2, 'getByUserId() returns correct unreadCount for user1');
    assert(user1List.notifications[0].id === notifDefaultLink.id, 'getByUserId() orders by createdAt DESC');

    const user2List = await repo.getByUserId(user2Id);
    assert(user2List.notifications.length === 1, 'getByUserId() returns user2 notifications only (tenant isolation)');
    assert(user2List.unreadCount === 1, 'getByUserId() returns correct unreadCount for user2');

    // Test pagination limit & offset
    const user1Page = await repo.getByUserId(user1Id, 1, 0);
    assert(user1Page.notifications.length === 1, 'getByUserId() respects limit parameter');
    assert(user1Page.unreadCount === 2, 'getByUserId() unreadCount reflects total unread regardless of pagination limit');

    // 4. Test markAsRead() with tenant isolation
    // User 2 tries to mark User 1's notification as read -> should fail (return false)
    const unauthorizedMark = await repo.markAsRead(notif1.id, user2Id);
    assert(unauthorizedMark === false, 'markAsRead() rejects cross-user mark (tenant isolation)');

    // Verify still unread
    const user1StillUnread = await repo.getByUserId(user1Id);
    assert(user1StillUnread.unreadCount === 2, 'Notification remains unread after unauthorized mark attempt');

    // Legitimate owner marks as read
    const authorizedMark = await repo.markAsRead(notif1.id, user1Id);
    assert(authorizedMark === true, 'markAsRead() returns true for legitimate owner');

    const user1AfterMark = await repo.getByUserId(user1Id);
    assert(user1AfterMark.unreadCount === 1, 'unreadCount decrements to 1 after marking one notification read');
    const readItem = user1AfterMark.notifications.find(n => n.id === notif1.id);
    assert(readItem?.isRead === true, 'Notification isRead is updated to true');

    // 5. Test markAllAsRead()
    // User 1 marks all as read
    const countMarked = await repo.markAllAsRead(user1Id);
    assert(countMarked === 1, 'markAllAsRead() returns number of rows updated (1 remaining unread)');

    const user1AllRead = await repo.getByUserId(user1Id);
    assert(user1AllRead.unreadCount === 0, 'unreadCount is 0 after markAllAsRead');

    // Verify User 2's notification is still unread!
    const user2Check = await repo.getByUserId(user2Id);
    assert(user2Check.unreadCount === 1, 'markAllAsRead(user1) does not touch user2 notifications');

    // 6. Test upsertByRequest() stateful card lifecycle & duplicate pruning
    console.log('\n--- Section 6: Test upsertByRequest() ---');
    // Create a dummy travel request to satisfy foreign key
    const tripRes = await pool.query(
      `INSERT INTO travel_requests (
         user_id, travel_type, title, purpose, project_code,
         origin, destination, departure_date, return_date, status, total_expenses,
         emergency_contact_name, emergency_contact_phone
       ) VALUES (
         $1, 'UPCOMING', 'Upsert Test Trip', 'Testing upsert behavior', 'TEST-001',
         'Bangalore', 'Mumbai', '2026-12-01', '2026-12-05', 'PENDING_MANAGER_REVIEW', 5000,
         'Emergency Person', '+919876543210'
       ) RETURNING id;`,
      [user1Id]
    );
    const testTripId = tripRes.rows[0].id;

    // 6.1 First upsert: creates a new notification
    const upsert1 = await repo.upsertByRequest({
      userId: user2Id,
      actorId: user1Id,
      requestId: testTripId,
      type: 'TRAVEL_SUBMITTED',
      title: 'New Travel Request Submitted',
      message: 'Pending Review for Test Trip',
      linkUrl: '/dashboard?tab=notifications'
    });
    assert(!!upsert1.id, 'upsertByRequest() creates notification when none exists');
    assert(upsert1.type === 'TRAVEL_SUBMITTED', 'upsertByRequest() sets initial type');
    assert(upsert1.isRead === false, 'upsertByRequest() is unread by default');

    // 6.2 Second upsert: updates the existing record in-place
    const upsert2 = await repo.upsertByRequest({
      userId: user2Id,
      actorId: user1Id,
      requestId: testTripId,
      type: 'TRAVEL_APPROVED',
      title: 'Travel Request Approved',
      message: 'Approved by executive review',
      linkUrl: '/dashboard?tab=notifications'
    });
    assert(upsert2.id === upsert1.id, 'upsertByRequest() updates the exact same record in-place (same ID)');
    assert(upsert2.type === 'TRAVEL_APPROVED', 'upsertByRequest() updates notification type to TRAVEL_APPROVED');
    assert(upsert2.title === 'Travel Request Approved', 'upsertByRequest() updates title');

    // Verify user2 only has 1 notification for this trip
    const user2AfterUpsert = await repo.getByUserId(user2Id);
    const tripNotifs = user2AfterUpsert.notifications.filter(n => n.requestId === testTripId);
    assert(tripNotifs.length === 1, 'upsertByRequest() ensures strictly 1 notification per trip (no duplicate rows)');

    // 6.3 Test legacy duplicate pruning: manually insert a duplicate row
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, request_id, type, title, message, link_url, is_read)
       VALUES ($1, $2, $3, 'LEGACY_DUP', 'Old Duplicate', 'Duplicated entry', '/dashboard?tab=notifications', true);`,
      [user2Id, user1Id, testTripId]
    );
    const checkDuplicates = await pool.query(
      'SELECT id FROM notifications WHERE user_id = $1 AND request_id = $2',
      [user2Id, testTripId]
    );
    assert(checkDuplicates.rows.length === 2, 'Manually injected duplicate confirmed (2 rows)');

    // Next upsert should prune the duplicate and leave exactly 1 row
    const upsertPruned = await repo.upsertByRequest({
      userId: user2Id,
      actorId: user1Id,
      requestId: testTripId,
      type: 'TRAVEL_SETTLED',
      title: 'Trip Settled',
      message: 'Settlement complete',
      linkUrl: '/dashboard?tab=notifications'
    });
    const checkPruned = await pool.query(
      'SELECT id FROM notifications WHERE user_id = $1 AND request_id = $2',
      [user2Id, testTripId]
    );
    assert(checkPruned.rows.length === 1, 'upsertByRequest() prunes legacy duplicates down to exactly 1 record');
    assert(upsertPruned.type === 'TRAVEL_SETTLED', 'upsertByRequest() sets latest type');

    // 7. Test delete() and cross-user security isolation
    const deleteTarget = await repo.create({
      userId: user1Id,
      type: 'TRAVEL_SUBMITTED',
      title: 'Delete Test',
      message: 'Will be deleted',
      linkUrl: '/dashboard?tab=notifications'
    });
    // Attempt deletion with wrong user (user2Id)
    const wrongUserDelete = await repo.delete(deleteTarget.id, user2Id);
    assert(wrongUserDelete === false, 'delete() fails when called by non-owner user');

    // Attempt deletion with correct user (user1Id)
    const ownerDelete = await repo.delete(deleteTarget.id, user1Id);
    assert(ownerDelete === true, 'delete() succeeds when called by owner user');

    const checkDeleted = await pool.query('SELECT id FROM notifications WHERE id = $1', [deleteTarget.id]);
    assert(checkDeleted.rows.length === 0, 'Deleted notification is removed from database');

    console.log(`\n🎉 All ${passed}/${total} NotificationRepository tests passed!`);
  } finally {
    // Cleanup test data
    if (user1Id || user2Id) {
      await pool.query('DELETE FROM notifications WHERE user_id IN ($1, $2)', [user1Id, user2Id]);
      await pool.query('DELETE FROM travel_requests WHERE user_id IN ($1, $2)', [user1Id, user2Id]);
      await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [user1Id, user2Id]);
    }
    await pool.end();
  }
}

runRepoTests().catch((err) => {
  console.error('\n❌ Repository Test Suite Failed:', err.message);
  process.exit(1);
});
