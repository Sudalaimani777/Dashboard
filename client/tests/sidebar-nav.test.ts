import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getRoleNavItems,
  getRoleQuickAction,
  NavItemConfig,
} from '../src/features/travel/layout/DynamicRoleSidebar';

async function run() {
  console.log('🧪 Testing DynamicRoleSidebar navigation mapping & quick action...');

  // 1. Employee Navigation Items (My Travel + Spend Analytics)
  const empItems = getRoleNavItems('EMPLOYEE');
  assert.equal(empItems.length, 2, 'Employee should have 2 navigation items: trips & analytics');
  assert.deepEqual(
    empItems.map((i: NavItemConfig) => i.id),
    ['trips', 'analytics']
  );
  assert.equal(empItems[0].label, 'My Travel');
  assert.equal(empItems[1].label, 'Spend Analytics');

  // 2. Manager Navigation Items (Team Approvals, Team Analytics, My Travel)
  const mgrItems = getRoleNavItems('MANAGER');
  assert.equal(mgrItems.length, 3, 'Manager should have 3 navigation items: team, analytics, personal');
  assert.deepEqual(
    mgrItems.map((i: NavItemConfig) => i.id),
    ['team', 'analytics', 'personal']
  );
  assert.equal(mgrItems[0].label, 'Team Approvals');
  assert.equal(mgrItems[1].label, 'Team Analytics');
  assert.equal(mgrItems[2].label, 'My Travel');

  // 3. Admin Navigation Items (Consolidated to 3 streamlined items)
  const admItems = getRoleNavItems('ADMIN');
  assert.equal(admItems.length, 3, 'Admin should have 3 consolidated navigation items');
  assert.deepEqual(
    admItems.map((i: NavItemConfig) => i.id),
    ['governance', 'budgets', 'users']
  );
  assert.equal(admItems[0].label, 'Travel Governance');
  assert.equal(admItems[1].label, 'Department Budgets');
  assert.equal(admItems[2].label, 'Team & Access');

  // 4. Role Quick Actions
  const empAction = getRoleQuickAction('EMPLOYEE');
  assert.equal(empAction.label, 'New Request');
  assert.equal(empAction.path, '/travel/new');

  const mgrAction = getRoleQuickAction('MANAGER');
  assert.equal(mgrAction.label, 'New Request');
  assert.equal(mgrAction.path, '/travel/new');

  const admAction = getRoleQuickAction('ADMIN');
  assert.equal(admAction.label, 'Add Member');
  assert.equal(admAction.path, '/admin/users/new');

  // 5. Source code validation for DynamicRoleSidebar
  const sidebarSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/travel/layout/DynamicRoleSidebar.tsx'),
    'utf8'
  );
  assert.ok(
    sidebarSource.includes('/admin/users/new') && sidebarSource.includes('Add Member'),
    'DynamicRoleSidebar must include quick action for Admin to Add Member via /admin/users/new'
  );

  console.log('✅ ALL DYNAMIC ROLE SIDEBAR NAVIGATION & QUICK ACTION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
