import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getRoleNavItems } from '../src/features/travel/layout/DynamicRoleSidebar';

async function run() {
  console.log('🧪 Testing Notifications item in DynamicRoleSidebar...');

  const sidebarPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/layout/DynamicRoleSidebar.tsx'
  );
  const sidebarSource = fs.readFileSync(sidebarPath, 'utf8');

  // 1. Verify Bell icon import from lucide-react
  assert.ok(
    sidebarSource.includes('Bell') && sidebarSource.includes('lucide-react'),
    'DynamicRoleSidebar must import Bell from lucide-react'
  );

  // 2. Verify getRoleNavItems puts Notifications as item 0 for all roles
  for (const role of ['EMPLOYEE', 'MANAGER', 'ADMIN']) {
    const items = getRoleNavItems(role);
    assert.equal(items[0].id, 'notifications', `Role ${role} first item must be notifications`);
    assert.equal(items[0].label, 'Notifications', `Role ${role} first item label must be Notifications`);
  }

  // 3. Verify badge count wiring from badgeCounts['notifications']
  assert.ok(
    sidebarSource.includes("badgeCounts['notifications']"),
    'DynamicRoleSidebar must wire badge count from badgeCounts["notifications"]'
  );

  // 4. Verify countType (danger when urgent revisions, warning otherwise)
  assert.ok(
    sidebarSource.includes("'danger'") && sidebarSource.includes("'warning'"),
    'DynamicRoleSidebar must support danger and warning countTypes for notifications'
  );

  // 5. Verify no hardcoded duplicate bell outside nav
  const layoutPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/layout/DashboardLayout.tsx'
  );
  if (fs.existsSync(layoutPath)) {
    const layoutSource = fs.readFileSync(layoutPath, 'utf8');
    const headerRegex = /<header[\s\S]*?<\/header>/i;
    const headerMatch = layoutSource.match(headerRegex);
    if (headerMatch) {
      assert.ok(
        !headerMatch[0].includes('Bell'),
        'Top header must not have a duplicate Bell icon'
      );
    }
  }

  console.log('✅ ALL NOTIFICATIONS SIDEBAR TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
