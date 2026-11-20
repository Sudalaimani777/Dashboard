import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Responsive Data Tables (TDD RED)...');

  const adminUsersPath = path.resolve('client/src/features/users/pages/AdminUsersPage.tsx');
  const deptBudgetsPath = path.resolve('client/src/features/travel/pages/DepartmentBudgetsPage.tsx');

  const adminUsersCode = fs.readFileSync(adminUsersPath, 'utf8');
  const deptBudgetsCode = fs.readFileSync(deptBudgetsPath, 'utf8');

  // 1. AdminUsersPage must have dual view (md:hidden card stack + hidden md:block table)
  assert.ok(
    adminUsersCode.includes('md:hidden') && adminUsersCode.includes('hidden md:block'),
    'AdminUsersPage must render an md:hidden mobile card view alongside hidden md:block table'
  );

  // 2. AdminUsersPage mobile card must display user info and accessible action buttons
  assert.ok(
    adminUsersCode.includes('member.department') && adminUsersCode.includes('Edit') && adminUsersCode.includes('aria-label'),
    'AdminUsersPage mobile card stack must render member details and accessible action buttons'
  );

  // 3. DepartmentBudgetsPage must not have the hardcoded w-87.5 fixed width search input
  assert.ok(
    !deptBudgetsCode.includes('w-87.5'),
    'DepartmentBudgetsPage must eliminate the hardcoded w-87.5 fixed width search class'
  );

  // 4. DepartmentBudgetsPage must render dual view for corporate pools ledger
  assert.ok(
    deptBudgetsCode.includes('md:hidden') && deptBudgetsCode.includes('hidden md:block'),
    'DepartmentBudgetsPage must render an md:hidden mobile card stack for corporate department pools'
  );

  console.log('✅ Responsive tables structural tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
