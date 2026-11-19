import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { notificationsApi } from '../src/features/notifications/services/notifications.api';

async function run() {
  console.log('🧪 Testing Notifications types, API service, and useNotifications hook...');

  // 1. Verify notification types exist and are defined
  const typesSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/notifications/types/notification.types.ts'),
    'utf8'
  );
  assert.ok(typesSource.includes('NotificationType'), 'Must define NotificationType');
  assert.ok(typesSource.includes('TRAVEL_SUBMITTED'), 'Must include TRAVEL_SUBMITTED');
  assert.ok(typesSource.includes('REVISION_REQUESTED'), 'Must include REVISION_REQUESTED');
  assert.ok(typesSource.includes('TRAVEL_APPROVED'), 'Must include TRAVEL_APPROVED');
  assert.ok(typesSource.includes('TRAVEL_SETTLED'), 'Must include TRAVEL_SETTLED');
  assert.ok(typesSource.includes('TRAVEL_REJECTED'), 'Must include TRAVEL_REJECTED');
  assert.ok(typesSource.includes('MANAGER_OVERSIGHT'), 'Must include MANAGER_OVERSIGHT');
  assert.ok(typesSource.includes('interface Notification'), 'Must define Notification interface');
  assert.ok(typesSource.includes('interface NotificationListResponse'), 'Must define NotificationListResponse');

  // 2. Verify notifications.api.ts methods
  assert.equal(typeof notificationsApi.fetchNotifications, 'function', 'fetchNotifications must be a function');
  assert.equal(typeof notificationsApi.markAsRead, 'function', 'markAsRead must be a function');
  assert.equal(typeof notificationsApi.markAllAsRead, 'function', 'markAllAsRead must be a function');
  assert.equal(typeof notificationsApi.deleteNotification, 'function', 'deleteNotification must be a function');

  const apiSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/notifications/services/notifications.api.ts'),
    'utf8'
  );
  assert.ok(apiSource.includes("withCredentials: true"), 'Must include credentials in API client');
  assert.ok(apiSource.includes('/notifications'), 'Must call /notifications');
  assert.ok(apiSource.includes('/read-all'), 'Must call /read-all');
  assert.ok(apiSource.includes('deleteNotification'), 'Must provide deleteNotification method');

  // 3. Verify useNotifications hook source contract
  const hookSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/notifications/hooks/useNotifications.ts'),
    'utf8'
  );
  assert.ok(hookSource.includes('EventSource'), 'Hook must connect via EventSource');
  assert.ok(hookSource.includes('/notifications/stream'), 'Hook must connect to /notifications/stream');
  assert.ok(hookSource.includes('withCredentials: true'), 'SSE must pass withCredentials: true');
  assert.ok(hookSource.includes('playNotificationChime()'), 'Hook must play chime on incoming notification');
  assert.ok(hookSource.includes('showToast('), 'Hook must spawn SwipeToast via showToast');
  assert.ok(hookSource.includes('eventSource.close()'), 'Hook must clean up EventSource on unmount');
  assert.ok(hookSource.includes('markAsRead'), 'Hook must provide markAsRead helper');
  assert.ok(hookSource.includes('markAllAsRead'), 'Hook must provide markAllAsRead helper');
  assert.ok(hookSource.includes('deleteNotification'), 'Hook must provide deleteNotification helper');
  assert.ok(hookSource.includes('refresh'), 'Hook must provide refresh helper');

  console.log('✅ ALL NOTIFICATIONS API & HOOK TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
