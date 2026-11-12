import assert from 'node:assert/strict';
import { getRoleNavItems, NavItemConfig } from '../src/features/travel/layout/DynamicRoleSidebar';

async function run() {
  console.log('🧪 Testing DynamicRoleSidebar navigation mapping...');

  // 1. Employee Navigation Items
  const empItems = getRoleNavItems('EMPLOYEE');
  assert.equal(empItems.length, 4, 'Employee should have 4 navigation items');
  assert.deepEqual(
    empItems.map((i: NavItemConfig) => i.id),
    ['present', 'revisions', 'drafts', 'past']
  );
  assert.equal(empItems[0].label, 'Present Requests');
  assert.equal(empItems[1].label, 'Revised Requests');
  assert.equal(empItems[2].label, 'Travel Drafts');
  assert.equal(empItems[3].label, 'Past Requests');

  // 2. Manager Navigation Items
  const mgrItems = getRoleNavItems('MANAGER');
  assert.equal(mgrItems.length, 5, 'Manager should have 5 navigation items');
  assert.deepEqual(
    mgrItems.map((i: NavItemConfig) => i.id),
    ['present', 'revisions', 'past', 'personal', 'drafts']
  );
  assert.equal(mgrItems[0].label, 'Team Audit Queue');
  assert.equal(mgrItems[1].label, 'Revised Requests');
  assert.equal(mgrItems[2].label, 'Past Team History');
  assert.equal(mgrItems[3].label, 'My Personal Travel');
  assert.equal(mgrItems[4].label, 'Travel Drafts');

  // 3. Admin Navigation Items
  const admItems = getRoleNavItems('ADMIN');
  assert.equal(admItems.length, 4, 'Admin should have 4 navigation items');
  assert.deepEqual(
    admItems.map((i: NavItemConfig) => i.id),
    ['present', 'revisions', 'past', 'budgets']
  );
  assert.equal(admItems[0].label, 'Clearance Queue');
  assert.equal(admItems[3].label, 'Department Budgets');

  console.log('✅ ALL DYNAMIC ROLE SIDEBAR NAVIGATION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
