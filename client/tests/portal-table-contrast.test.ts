import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Portal Table & Data Cell Contrast Hierarchy...');

  // 1. TravelTableRow.tsx checks
  const rowPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/tables/TravelTableRow.tsx'
  );
  assert.ok(fs.existsSync(rowPath), 'TravelTableRow.tsx must exist');
  const rowSource = fs.readFileSync(rowPath, 'utf8');

  // Must not have route wrapped solely in washed-out text-muted
  assert.ok(
    rowSource.includes('text-ink font-medium') || rowSource.includes('text-slate-800 font-medium'),
    'TravelTableRow route must be rendered with high-contrast text'
  );

  // Must not have dates in washed-out text-muted
  assert.ok(
    rowSource.includes('text-slate-800') || rowSource.includes('text-ink'),
    'TravelTableRow dates must be rendered in high-contrast text'
  );

  // Type badge must be high-contrast slate badge
  assert.ok(
    rowSource.includes('bg-slate-100') && rowSource.includes('text-slate-700'),
    'TravelTableRow type badge must use high-contrast slate pill styling'
  );

  // Remarks note must be high-contrast amber
  assert.ok(
    rowSource.includes('text-amber-900') || rowSource.includes('bg-amber-100'),
    'TravelTableRow remarks preview must use high-contrast amber styling'
  );

  // Requester email must not use text-[10px] text-faint
  assert.ok(
    !rowSource.includes('text-[10px] text-faint'),
    'TravelTableRow must not use 10px text-faint for requester metadata'
  );

  // 2. TravelRequestsTable.tsx checks
  const tablePath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/tables/TravelRequestsTable.tsx'
  );
  const tableSource = fs.readFileSync(tablePath, 'utf8');

  assert.ok(
    tableSource.includes('text-slate-700') && (tableSource.includes('font-bold') || tableSource.includes('font-semibold')),
    'TravelRequestsTable header must use crisp text-slate-700'
  );

  // 3. RouteLabel.tsx checks
  const routePath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/shared/RouteLabel.tsx'
  );
  const routeSource = fs.readFileSync(routePath, 'utf8');
  assert.ok(
    routeSource.includes('text-slate-400'),
    'RouteLabel connector arrow must use clear text-slate-400'
  );

  // 4. AdminUsersPage.tsx checks
  const adminUsersPath = path.resolve(
    import.meta.dirname,
    '../src/features/users/pages/AdminUsersPage.tsx'
  );
  const adminUsersSource = fs.readFileSync(adminUsersPath, 'utf8');
  assert.ok(
    adminUsersSource.includes('text-slate-700') && (adminUsersSource.includes('font-bold') || adminUsersSource.includes('font-semibold')),
    'AdminUsersPage table header must use high-contrast slate'
  );

  // 5. DepartmentBudgetsPage.tsx checks
  const deptBudgetsPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/pages/DepartmentBudgetsPage.tsx'
  );
  const deptBudgetsSource = fs.readFileSync(deptBudgetsPath, 'utf8');
  assert.ok(
    deptBudgetsSource.includes('text-slate-700') && (deptBudgetsSource.includes('font-bold') || deptBudgetsSource.includes('font-semibold')),
    'DepartmentBudgetsPage table header must use high-contrast slate'
  );

  console.log('✅ ALL PORTAL TABLE CONTRAST TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Portal table contrast test failed:', err);
  process.exit(1);
});
