import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing NotificationsHubPage filter tab badge logic (TDD)...');

  const hubPath = path.resolve(
    import.meta.dirname,
    '../src/features/notifications/pages/NotificationsHubPage.tsx'
  );
  assert.ok(fs.existsSync(hubPath), 'NotificationsHubPage.tsx must exist');
  const hubSource = fs.readFileSync(hubPath, 'utf8');

  // 1. Verify that 'ALL' filter does NOT display a count badge (to prevent double-counting confusion with 'UNREAD')
  assert.ok(
    hubSource.includes("tab.id !== 'ALL'") ||
      hubSource.includes("id !== 'ALL'") ||
      hubSource.includes("tab.id === 'ALL' ? undefined"),
    "Filter tabs must ensure 'ALL' tab badge is suppressed to prevent double-counting confusion with 'UNREAD'"
  );

  // 2. Verify that 'UNREAD' and 'ACTION_REQUIRED' tabs still have dynamic badges when counts > 0
  assert.ok(
    hubSource.includes('unreadItemsCount') && hubSource.includes('actionRequiredCount'),
    'Hub must compute unreadItemsCount and actionRequiredCount for action tabs'
  );

  console.log('✅ ALL NOTIFICATIONS TAB BADGES TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
