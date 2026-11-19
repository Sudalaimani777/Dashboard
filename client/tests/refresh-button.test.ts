import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const TRAVEL_UI_FILES = [
  'components/AdminGovernancePortal.tsx',
  'components/EmployeeTravelPortal.tsx',
  'components/ManagerQueuePortal.tsx',
  'pages/AdminClearancePage.tsx',
  'pages/DepartmentBudgetsPage.tsx',
  'pages/ManagerAuditPage.tsx',
  'pages/TravelDetailPage.tsx',
];

async function run() {
  console.log('🧪 Testing Option A: RefreshButton removal & auto-revalidation...');

  const travelDir = path.resolve(import.meta.dirname, '../src/features/travel');

  const refreshBtnPath = path.join(travelDir, 'components/shared/RefreshButton.tsx');
  assert.ok(
    !fs.existsSync(refreshBtnPath),
    'RefreshButton.tsx should be removed when manual refresh UI is retired'
  );

  for (const rel of TRAVEL_UI_FILES) {
    const content = fs.readFileSync(path.join(travelDir, rel), 'utf8');
    assert.ok(
      !content.includes('RefreshButton'),
      `${rel} must not import or render RefreshButton`
    );
  }

  const contextSource = fs.readFileSync(
    path.join(travelDir, 'context/TravelContext.tsx'),
    'utf8'
  );
  assert.ok(
    contextSource.includes("'visibilitychange'") && contextSource.includes("'focus'"),
    'TravelContext.tsx must auto-revalidate on visibilitychange and window focus'
  );

  console.log('✅ ALL REFRESH REMOVAL & AUTO-SYNC TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
