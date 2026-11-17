import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Admin Single Route Revision (Employee Only)...');

  const cardPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/audit/AdminClearanceCard.tsx'
  );
  const cardSource = fs.readFileSync(cardPath, 'utf8');

  // Test 1: DualRouteSelector must NOT be imported or used in AdminClearanceCard
  assert.ok(
    !cardSource.includes('DualRouteSelector'),
    'AdminClearanceCard must NOT use DualRouteSelector (Route A removed)'
  );

  // Test 2: onRevision must dispatch with EMPLOYEE target
  assert.ok(
    cardSource.includes("'EMPLOYEE'"),
    'AdminClearanceCard must always specify EMPLOYEE as revision target'
  );

  // Test 3: AdminGovernancePortal text cleanup
  const portalPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/AdminGovernancePortal.tsx'
  );
  const portalSource = fs.readFileSync(portalPath, 'utf8');
  assert.ok(
    !portalSource.includes('Route A') && !portalSource.includes('Route B'),
    'AdminGovernancePortal must NOT reference Route A or Route B'
  );

  console.log('✅ ALL CLIENT SINGLE ROUTE REVISION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
