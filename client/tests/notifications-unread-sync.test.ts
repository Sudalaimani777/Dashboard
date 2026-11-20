import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing unreadCount state synchronization & pure state updaters (TDD)...');

  const hookPath = path.resolve(
    import.meta.dirname,
    '../src/features/notifications/hooks/useNotifications.ts'
  );
  assert.ok(fs.existsSync(hookPath), 'useNotifications.ts must exist');
  const hookSource = fs.readFileSync(hookPath, 'utf8');

  // 1. Hook must derive unreadCount from notifications to ensure single source of truth
  assert.ok(
    hookSource.includes('notifications.filter((n) => !n.isRead).length') ||
      hookSource.includes('notifications.filter((n) => !n.isRead)'),
    'useNotifications must derive unreadCount from notifications array'
  );

  // 2. Hook must NOT call nested setUnreadCount inside setNotifications callback (violates pure updater rule)
  const hasNestedSetState = /setNotifications\s*\([^)]*=>[\s\S]*?setUnreadCount/.test(hookSource);
  assert.ok(
    !hasNestedSetState,
    'useNotifications must NOT call setUnreadCount inside setNotifications state updater (causes double increment in StrictMode)'
  );

  console.log('✅ ALL UNREAD COUNT SYNCHRONIZATION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
