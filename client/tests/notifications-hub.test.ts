import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing NotificationsHubPage and DashboardLayout mounting...');

  // 1. Verify NotificationsHubPage.tsx source code
  const hubPath = path.resolve(
    import.meta.dirname,
    '../src/features/notifications/pages/NotificationsHubPage.tsx'
  );
  assert.ok(fs.existsSync(hubPath), 'NotificationsHubPage.tsx must exist');
  const hubSource = fs.readFileSync(hubPath, 'utf8');

  // Verify header and subtitle
  assert.ok(hubSource.includes('Notifications Hub'), 'Hub must have "Notifications Hub" header');
  assert.ok(
    hubSource.includes('Track governance decisions, revision requests, and clearance milestones in real-time'),
    'Hub must have governance subtitle'
  );

  // Verify "Mark all as read" action
  assert.ok(
    hubSource.includes('Mark all as read') && hubSource.includes('markAllAsRead()'),
    'Hub must include "Mark all as read" action button calling markAllAsRead()'
  );
  assert.ok(
    !hubSource.includes('title="Refresh notifications"'),
    'Hub must NOT include manual Refresh notifications button'
  );

  // Verify filters
  assert.ok(hubSource.includes("'ALL'"), 'Hub must support ALL filter');
  assert.ok(hubSource.includes("'UNREAD'"), 'Hub must support UNREAD filter');
  assert.ok(hubSource.includes("'ACTION_REQUIRED'"), 'Hub must support ACTION_REQUIRED filter');

  // Verify card actions
  assert.ok(
    hubSource.includes('Open Travel Request') || hubSource.includes('handleOpenRequest'),
    'Hub cards must support opening travel request'
  );
  assert.ok(
    hubSource.includes('Mark as read') && hubSource.includes('markAsRead(n.id)'),
    'Hub cards must support single mark as read action'
  );
  assert.ok(
    hubSource.includes('Delete notification') && hubSource.includes('deleteNotification(n.id)'),
    'Hub cards must support delete notification action'
  );

  // Verify empty state
  assert.ok(hubSource.includes('All caught up'), 'Hub must provide "All caught up" empty state');

  // Verify FORWARDED_TO_ADMIN badge & state
  assert.ok(
    hubSource.includes('FORWARDED_TO_ADMIN') && hubSource.includes('In Executive Review'),
    'Hub must support FORWARDED_TO_ADMIN with "In Executive Review" badge'
  );

  // 2. Verify DashboardLayout.tsx mounting
  const layoutPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/layout/DashboardLayout.tsx'
  );
  const layoutSource = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(
    layoutSource.includes('ToastProvider'),
    'DashboardLayout must wrap tree with ToastProvider'
  );
  assert.ok(
    layoutSource.includes('NotificationProvider'),
    'DashboardLayout must wrap tree with NotificationProvider'
  );
  assert.ok(
    layoutSource.includes('useNotifications'),
    'DashboardLayout must call useNotifications'
  );
  assert.ok(
    layoutSource.includes('notifications: unreadCount'),
    'DashboardLayout must wire unreadCount to badgeCounts.notifications'
  );
  assert.ok(
    layoutSource.includes("activeTab === 'notifications'") &&
      layoutSource.includes('NotificationsHubPage'),
    'DashboardLayout must render NotificationsHubPage when activeTab is notifications'
  );

  console.log('✅ ALL NOTIFICATIONS HUB & DASHBOARD LAYOUT TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
