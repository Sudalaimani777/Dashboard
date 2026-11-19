// server/tests/notifications-api.test.ts
import 'dotenv/config';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/shared/db/pool.js';
import { config } from '../src/config/env.js';
import { notificationRepo } from '../src/features/notifications/notification.repository.js';
import { sseRegistry } from '../src/features/notifications/notificationStream.js';

const PORT = 5198;
const API_BASE = `http://localhost:${PORT}/api/notifications`;

async function runNotificationsApiTests() {
  console.log('🧪 Starting Notifications API Endpoint & Stream Test Suite...\n');

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

  let server: http.Server | null = null;
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const ts = Date.now();
  const user1Email = `api_user1_${ts}@readventure.test`;
  const user2Email = `api_user2_${ts}@readventure.test`;

  let user1Id = '';
  let user2Id = '';
  let token1 = '';
  let token2 = '';

  try {
    // 1. Seed test users
    const u1Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('API User One', $1, 'hash', 'EMPLOYEE', 'Engineering')
       RETURNING id;`,
      [user1Email]
    );
    user1Id = u1Res.rows[0].id;

    const u2Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ('API User Two', $1, 'hash', 'MANAGER', 'Engineering')
       RETURNING id;`,
      [user2Email]
    );
    user2Id = u2Res.rows[0].id;

    token1 = jwt.sign(
      { userId: user1Id, email: user1Email, role: 'EMPLOYEE' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    token2 = jwt.sign(
      { userId: user2Id, email: user2Email, role: 'MANAGER' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // ========================================================
    // 1. AUTHENTICATION GUARDS (401 Unauthorized without token)
    // ========================================================
    console.log('\n--- 1. Auth Protection Checks ---');
    const unauthList = await fetch(`${API_BASE}`);
    assert(unauthList.status === 401, 'GET /api/notifications returns 401 without auth');

    const unauthStream = await fetch(`${API_BASE}/stream`);
    assert(unauthStream.status === 401, 'GET /api/notifications/stream returns 401 without auth');

    const unauthReadAll = await fetch(`${API_BASE}/read-all`, { method: 'PATCH' });
    assert(unauthReadAll.status === 401, 'PATCH /api/notifications/read-all returns 401 without auth');

    const unauthMark = await fetch(`${API_BASE}/fake-id/read`, { method: 'PATCH' });
    assert(unauthMark.status === 401, 'PATCH /api/notifications/:id/read returns 401 without auth');

    // ========================================================
    // 2. LIST ENDPOINT & TENANT ISOLATION
    // ========================================================
    console.log('\n--- 2. List Notifications & Tenant Isolation ---');
    // Create notifications for User 1
    const n1 = await notificationRepo.create({
      userId: user1Id,
      type: 'TRAVEL_SUBMITTED',
      title: 'Trip to Tokyo',
      message: 'Your trip to Tokyo is under review',
      linkUrl: '/dashboard?tab=notifications'
    });

    const n2 = await notificationRepo.create({
      userId: user1Id,
      type: 'TRAVEL_APPROVED',
      title: 'Trip to London',
      message: 'Your trip to London has been approved',
      linkUrl: '/dashboard?tab=notifications'
    });

    // Mark n2 as read directly in DB
    await notificationRepo.markAsRead(n2.id, user1Id);

    // Create notification for User 2
    const n3 = await notificationRepo.create({
      userId: user2Id,
      type: 'TRAVEL_SUBMITTED',
      title: 'Manager Review Needed',
      message: 'New request awaiting your review',
      linkUrl: '/dashboard?tab=notifications'
    });

    // Fetch User 1 list
    const resList1 = await fetch(`${API_BASE}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert(resList1.status === 200, 'GET /api/notifications returns 200 with auth');
    const dataList1 = await resList1.json();
    assert(dataList1.success === true, 'Response contains success: true');
    assert(dataList1.notifications.length === 2, 'User 1 receives exactly 2 notifications');
    assert(dataList1.unreadCount === 1, 'User 1 unreadCount is 1 (1 unread, 1 read)');
    const hasUser2Notif = dataList1.notifications.some((n: any) => n.id === n3.id);
    assert(!hasUser2Notif, 'User 1 cannot see User 2 notification (tenant isolation)');

    // Fetch User 2 list
    const resList2 = await fetch(`${API_BASE}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const dataList2 = await resList2.json();
    assert(dataList2.notifications.length === 1, 'User 2 receives exactly 1 notification');
    assert(dataList2.notifications[0].id === n3.id, 'User 2 receives only their own notification');

    // ========================================================
    // 3. SSE STREAM HEADERS & HANDSHAKE
    // ========================================================
    console.log('\n--- 3. SSE Stream Handshake & Real-Time Broadcast ---');
    const controller = new AbortController();
    const streamRes = await fetch(`${API_BASE}/stream`, {
      headers: { Authorization: `Bearer ${token1}` },
      signal: controller.signal
    });

    assert(streamRes.status === 200, 'GET /api/notifications/stream returns 200 OK');
    const contentType = streamRes.headers.get('content-type') || '';
    assert(contentType.includes('text/event-stream'), 'Content-Type header is text/event-stream');
    const cacheControl = streamRes.headers.get('cache-control') || '';
    assert(cacheControl.includes('no-cache'), 'Cache-Control header is no-cache');

    const reader = streamRes.body?.getReader();
    assert(!!reader, 'Stream body readable');

    if (reader) {
      // Read initial handshake chunk
      const { value: chunk1 } = await reader.read();
      const text1 = new TextDecoder().decode(chunk1);
      assert(text1.includes('{"connected":true}'), 'Initial chunk sends connected handshake event');

      // Test real-time broadcast to this connected client
      sseRegistry.broadcastToUser(user1Id, { liveAlert: 'Real-time test ping' });

      const { value: chunk2 } = await reader.read();
      const text2 = new TextDecoder().decode(chunk2);
      assert(text2.includes('Real-time test ping'), 'SSE client received live broadcast payload');

      // Abort connection
      controller.abort();
    }

    // ========================================================
    // 4. MARK SINGLE AS READ
    // ========================================================
    console.log('\n--- 4. Mark Single Notification As Read ---');
    // User 2 tries to mark User 1's notification (must fail tenant check)
    const unauthorizedMarkRes = await fetch(`${API_BASE}/${n1.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token2}` }
    });
    const unauthorizedMarkData = await unauthorizedMarkRes.json();
    assert(unauthorizedMarkData.marked === false, 'Cross-user mark returns marked: false');

    // User 1 marks their own notification
    const markRes = await fetch(`${API_BASE}/${n1.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert(markRes.status === 200, 'PATCH /api/notifications/:id/read returns 200');
    const markData = await markRes.json();
    assert(markData.marked === true, 'Legitimate owner mark returns marked: true');

    // Verify unreadCount is now 0 for User 1
    const verifyList1 = await fetch(`${API_BASE}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const verifyData1 = await verifyList1.json();
    assert(verifyData1.unreadCount === 0, 'User 1 unreadCount is now 0 after marking read');

    // ========================================================
    // 5. MARK ALL AS READ
    // ========================================================
    console.log('\n--- 5. Mark All Notifications As Read ---');
    // Seed 2 more unread notifications for User 1
    await notificationRepo.create({
      userId: user1Id,
      type: 'REVISION_REQUESTED',
      title: 'Revision 1',
      message: 'Please update flight'
    });
    await notificationRepo.create({
      userId: user1Id,
      type: 'REVISION_REQUESTED',
      title: 'Revision 2',
      message: 'Please update hotel'
    });

    const checkBeforeReadAll = await (
      await fetch(`${API_BASE}`, { headers: { Authorization: `Bearer ${token1}` } })
    ).json();
    assert(checkBeforeReadAll.unreadCount === 2, 'User 1 has 2 unread notifications');

    const readAllRes = await fetch(`${API_BASE}/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert(readAllRes.status === 200, 'PATCH /api/notifications/read-all returns 200');
    const readAllData = await readAllRes.json();
    assert(readAllData.count === 2, 'readAll marks exactly 2 rows');

    const checkAfterReadAll = await (
      await fetch(`${API_BASE}`, { headers: { Authorization: `Bearer ${token1}` } })
    ).json();
    assert(checkAfterReadAll.unreadCount === 0, 'User 1 unreadCount is 0 after mark-all');

    // Verify User 2's notification is still unread!
    const checkUser2 = await (
      await fetch(`${API_BASE}`, { headers: { Authorization: `Bearer ${token2}` } })
    ).json();
    assert(checkUser2.unreadCount === 1, 'User 2 unreadCount untouched by User 1 mark-all');

    console.log(`\n🎉 All ${passed}/${total} Notifications API tests passed!`);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => (server as http.Server).close(() => resolve()));
    }
    if (user1Id || user2Id) {
      await pool.query('DELETE FROM notifications WHERE user_id IN ($1, $2)', [user1Id, user2Id]);
      await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [user1Id, user2Id]);
    }
    await pool.end();
  }
}

runNotificationsApiTests().catch((err) => {
  console.error('\n❌ Notifications API Test Suite Failed:', err.message, err.stack);
  process.exit(1);
});
