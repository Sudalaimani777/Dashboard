import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing KPI Card Compact Height & Uniform Styling...');

  // 1. Check TravelMetricsGrid.tsx
  const gridPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/shared/TravelMetricsGrid.tsx'
  );
  assert.ok(fs.existsSync(gridPath), 'TravelMetricsGrid.tsx must exist');
  const gridSource = fs.readFileSync(gridPath, 'utf8');

  // Must not have bulky separate footer with pt-2 border-t that causes card bloating
  assert.ok(
    !gridSource.includes('pt-2 border-t border-border-warm/60'),
    'TravelMetricsGrid must not use bulky separate footer that inflates card height'
  );

  // Must maintain my-auto for vertical centering
  assert.ok(
    gridSource.includes('my-auto'),
    'TravelMetricsGrid must maintain my-auto'
  );

  // 2. Check EmployeeTravelPortal.tsx KPI grid definition
  const empPortalPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/EmployeeTravelPortal.tsx'
  );
  const empSource = fs.readFileSync(empPortalPath, 'utf8');
  assert.ok(
    !empSource.includes('progressSegments: categoryBreakdown'),
    'EmployeeTravelPortal must not bloat KPI card with bulky category progress bars'
  );

  console.log('✅ ALL KPI CARD COMPACT HEIGHT TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ KPI card height test failed:', err);
  process.exit(1);
});
