import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Resubmit Travel Alterations Field Improvements (TDD)...');

  const pagePath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/pages/ResubmitTravelRequestPage.tsx'
  );
  const pageSource = fs.readFileSync(pagePath, 'utf8');

  // Test 1: QUICK_ALTERATION_TAGS must be removed (no default templates per mentor)
  assert.ok(
    !pageSource.includes('QUICK_ALTERATION_TAGS'),
    'ResubmitTravelRequestPage must NOT contain QUICK_ALTERATION_TAGS'
  );
  assert.ok(
    !pageSource.includes('appendAlterationTag'),
    'ResubmitTravelRequestPage must NOT contain appendAlterationTag'
  );

  // Test 2: alterationsRef must be defined and attached
  assert.ok(
    pageSource.includes('alterationsRef'),
    'ResubmitTravelRequestPage must define alterationsRef'
  );

  // Test 3: Smooth scroll to alterationsRef on missing alterations remarks
  assert.ok(
    pageSource.includes('alterationsRef.current?.scrollIntoView') &&
      pageSource.includes("behavior: 'smooth'"),
    'ResubmitTravelRequestPage must smoothly scroll to alterationsRef on validation error'
  );

  // Test 4: Focus with preventScroll: true
  assert.ok(
    pageSource.includes('preventScroll: true'),
    'ResubmitTravelRequestPage must use { preventScroll: true } on focus'
  );

  console.log('✅ ALL RESUBMIT ALTERATIONS FIELD TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
