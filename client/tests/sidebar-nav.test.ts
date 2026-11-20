import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getRoleNavItems,
  getRoleQuickAction,
  type NavItemConfig,
} from '../src/features/travel/layout/DynamicRoleSidebar';

async function run() {
  console.log('🧪 Testing DynamicRoleSidebar navigation ordering & quick action (TDD)...');

  // 1. Employee Navigation Items: 1) Notifications, 2) My Travel, 3) Spend Analytics
  const empItems = getRoleNavItems('EMPLOYEE');
  assert.equal(empItems.length, 3, 'Employee should have 3 navigation items: notifications, trips, analytics');
  assert.deepEqual(
    empItems.map((i: NavItemConfig) => i.id),
    ['notifications', 'trips', 'analytics'],
    'Employee navigation items must be strictly ordered: notifications -> trips -> analytics'
  );
  assert.equal(empItems[0].label, 'Notifications');
  assert.equal(empItems[1].label, 'My Travel');
  assert.equal(empItems[2].label, 'Spend Analytics');

  // 2. Manager Navigation Items: 1) Notifications, 2) Team Approvals, 3) My Travel, 4) Team Analytics, 5) Spend Analytics
  const mgrItems = getRoleNavItems('MANAGER');
  assert.equal(mgrItems.length, 5, 'Manager should have 5 navigation items: notifications, team, personal, team-analytics, spend-analytics');
  assert.deepEqual(
    mgrItems.map((i: NavItemConfig) => i.id),
    ['notifications', 'team', 'personal', 'team-analytics', 'spend-analytics'],
    'Manager navigation items must be strictly ordered: notifications -> team -> personal -> team-analytics -> spend-analytics'
  );
  assert.equal(mgrItems[0].label, 'Notifications');
  assert.equal(mgrItems[1].label, 'Team Approvals');
  assert.equal(mgrItems[2].label, 'My Travel');
  assert.equal(mgrItems[3].label, 'Team Analytics');
  assert.equal(mgrItems[4].label, 'Spend Analytics');

  // 3. Admin Navigation Items: 1) Notifications, 2) Travel Governance, 3) Team & Access, 4) Department Budgets
  const admItems = getRoleNavItems('ADMIN');
  assert.equal(admItems.length, 4, 'Admin should have 4 navigation items: notifications, governance, users, budgets');
  assert.deepEqual(
    admItems.map((i: NavItemConfig) => i.id),
    ['notifications', 'governance', 'users', 'budgets'],
    'Admin navigation items must be strictly ordered: notifications -> governance -> users -> budgets'
  );
  assert.equal(admItems[0].label, 'Notifications');
  assert.equal(admItems[1].label, 'Travel Governance');
  assert.equal(admItems[2].label, 'Team & Access');
  assert.equal(admItems[3].label, 'Department Budgets');

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

  // 5. Source code validation for DynamicRoleSidebar: No duplicate standalone notifications item outside navItems.map
  const sidebarSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/travel/layout/DynamicRoleSidebar.tsx'),
    'utf8'
  );
  assert.ok(
    sidebarSource.includes('/admin/users/new') && sidebarSource.includes('Add Member'),
    'DynamicRoleSidebar must include quick action for Admin to Add Member via /admin/users/new'
  );
  assert.ok(
    !sidebarSource.includes('/* Permanent Notifications Navigation Item */'),
    'DynamicRoleSidebar must not have redundant standalone notifications item outside navItems'
  );

  console.log('✅ ALL DYNAMIC ROLE SIDEBAR NAVIGATION & QUICK ACTION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
