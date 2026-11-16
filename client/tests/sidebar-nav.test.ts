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
  assert.equal(admItems.length, 5, 'Admin should have 5 navigation items');
  assert.deepEqual(
    admItems.map((i: NavItemConfig) => i.id),
    ['present', 'revisions', 'past', 'budgets', 'users']
  );
  assert.equal(admItems[0].label, 'Clearance Queue');
  assert.equal(admItems[3].label, 'Department Budgets');
  assert.equal(admItems[4].label, 'Team & Access');

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
