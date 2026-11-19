import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing TravelMetricsGrid vertical alignment...');

  const gridPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/shared/TravelMetricsGrid.tsx'
  );
  const source = fs.readFileSync(gridPath, 'utf8');

  assert.ok(
    !source.includes('flex flex-col justify-between gap-2.5'),
    'TravelMetricsGrid card must not use justify-between (which pushes footerless card values to the bottom)'
  );
  assert.ok(
    source.includes('my-auto'),
    'TravelMetricsGrid value container must use my-auto so metric values stay vertically centered with or without a footer'
  );

  console.log('✅ ALL TRAVEL METRICS GRID ALIGNMENT TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
