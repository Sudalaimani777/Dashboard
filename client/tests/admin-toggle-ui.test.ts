import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Admin segmented toggle active pill consistency...');

  const travelDir = path.resolve(import.meta.dirname, '../src/features/travel');

  const adminPortal = fs.readFileSync(
    path.join(travelDir, 'components/AdminGovernancePortal.tsx'),
    'utf8'
  );
  assert.ok(
    adminPortal.includes("typeFilter === opt.id ? 'bg-primary text-white shadow-2xs' : 'text-muted hover:text-ink'"),
    'AdminGovernancePortal type filter active pill should use bg-primary text-white'
  );
  assert.ok(
    !adminPortal.includes("typeFilter === opt.id ? 'bg-surface text-ink shadow-xs'"),
    'AdminGovernancePortal type filter should not use bg-surface active pill'
  );

  const budgetsPage = fs.readFileSync(
    path.join(travelDir, 'pages/DepartmentBudgetsPage.tsx'),
    'utf8'
  );
  assert.ok(
    budgetsPage.includes("selectedQuarter === q ? 'bg-primary text-white shadow-2xs' : 'text-muted hover:text-ink'"),
    'DepartmentBudgetsPage quarter toggle active pill should use bg-primary text-white'
  );
  assert.ok(
    !budgetsPage.includes("selectedQuarter === q ? 'bg-surface text-ink shadow-xs'"),
    'DepartmentBudgetsPage quarter toggle should not use bg-surface active pill'
  );

  console.log('✅ ALL ADMIN TOGGLE UI TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
