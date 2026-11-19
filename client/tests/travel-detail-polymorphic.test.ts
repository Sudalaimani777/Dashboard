import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Polymorphic Travel Request Workstation & Route Aliasing...');

  const clientSrc = path.resolve(import.meta.dirname, '../src');

  // 1. AppRoutes Route Aliasing / Redirection Checks
  const appRoutesSource = fs.readFileSync(path.join(clientSrc, 'routes/AppRoutes.tsx'), 'utf8');

  assert.ok(
    appRoutesSource.includes('/travel/requests/:id'),
    'AppRoutes must define canonical route for /travel/requests/:id'
  );
  assert.ok(
    !appRoutesSource.includes('element={<AdminClearancePage />}') &&
      !appRoutesSource.includes('element={<ManagerAuditPage />}'),
    'AppRoutes must not route to separate full-page AdminClearancePage or ManagerAuditPage'
  );
  assert.ok(
    appRoutesSource.includes('/travel/audit/:id') &&
      appRoutesSource.includes('/travel/clearance/:id'),
    'AppRoutes must maintain legacy route entries for /travel/audit/:id and /travel/clearance/:id'
  );

  // 2. TravelDetailPage Polymorphic Mounting Checks
  const detailPageSource = fs.readFileSync(
    path.join(clientSrc, 'features/travel/pages/TravelDetailPage.tsx'),
    'utf8'
  );

  assert.ok(
    detailPageSource.includes('AdminClearanceCard') &&
      detailPageSource.includes('ManagerDecisionCard'),
    'TravelDetailPage must import and conditionally mount AdminClearanceCard and ManagerDecisionCard'
  );

  assert.ok(
    detailPageSource.includes('useAuditDecision'),
    'TravelDetailPage must integrate useAuditDecision for in-situ approval actions'
  );

  assert.ok(
    detailPageSource.includes('BudgetImpactGauge'),
    'TravelDetailPage must mount BudgetImpactGauge when an Admin reviews a request'
  );

  assert.ok(
    detailPageSource.includes('loadBudget'),
    'TravelDetailPage must load department budget for executive clearance context'
  );

  // 3. Self-review guard check in TravelDetailPage
  assert.ok(
    detailPageSource.includes('request.userId === user') ||
      detailPageSource.includes('user?.id === request.userId') ||
      detailPageSource.includes('request.userId !== user?.id') ||
      detailPageSource.includes('request.userId !== currentUserId'),
    'TravelDetailPage must guard against self-review by managers/admins on their own requests'
  );

  console.log('✅ ALL POLYMORPHIC WORKSTATION & ROUTE ALIASING TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
