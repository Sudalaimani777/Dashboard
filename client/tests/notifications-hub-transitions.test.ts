import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing NotificationsHubPage fluid transitions & layout animation (TDD)...');

  const hubPath = path.resolve(
    import.meta.dirname,
    '../src/features/notifications/pages/NotificationsHubPage.tsx'
  );
  assert.ok(fs.existsSync(hubPath), 'NotificationsHubPage.tsx must exist');
  const hubSource = fs.readFileSync(hubPath, 'utf8');

  // 1. Verify motion and AnimatePresence imports
  assert.ok(
    hubSource.includes('motion') && hubSource.includes('AnimatePresence') && hubSource.includes('motion/react'),
    'NotificationsHubPage must import motion and AnimatePresence from motion/react'
  );

  // 2. Verify shared layoutId for sliding tab indicator
  assert.ok(
    hubSource.includes('layoutId="activeFilterPill"'),
    'NotificationsHubPage must use layoutId="activeFilterPill" for sliding indicator'
  );

  // 3. Verify spring transition physics on the sliding indicator
  assert.ok(
    hubSource.includes("type: 'spring'") || hubSource.includes('type: "spring"'),
    'Filter tab indicator must use spring physics'
  );

  // 4. Verify AnimatePresence wrapping for notification cards
  assert.ok(
    hubSource.includes('<AnimatePresence'),
    'Notifications list must be wrapped in AnimatePresence for smooth crossfades'
  );

  // 5. Verify layout prop on individual cards for smooth repositioning
  assert.ok(
    hubSource.includes('<motion.div') && hubSource.includes('layout'),
    'Notification cards must be motion components with layout prop'
  );

  console.log('✅ ALL NOTIFICATIONS HUB TRANSITIONS TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
