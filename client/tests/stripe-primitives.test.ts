import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getStatusBadgeConfig } from '../src/features/travel/components/TravelStatusBadge';

async function run() {
  console.log('🧪 Testing Stripe UI Primitives...');

  // 1. Check Button component source
  const buttonPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/button.tsx');
  assert.ok(fs.existsSync(buttonPath), 'button.tsx must exist');
  const buttonSource = fs.readFileSync(buttonPath, 'utf8');

  assert.ok(buttonSource.includes('#533AFD'), 'Button must use primary #533AFD');
  assert.ok(buttonSource.includes('#4834DB'), 'Button must use hover #4834DB');
  assert.ok(buttonSource.includes('#E5EDF5'), 'Button must use secondary #E5EDF5');
  assert.ok(!buttonSource.includes('#8A582B'), 'Button must not contain brown #8A582B');
  assert.ok(!buttonSource.includes('#754820'), 'Button must not contain brown #754820');

  // 2. Check Card component source
  const cardPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/card.tsx');
  assert.ok(fs.existsSync(cardPath), 'card.tsx must exist');
  const cardSource = fs.readFileSync(cardPath, 'utf8');

  assert.ok(cardSource.includes('#E5EDF5'), 'Card must use modern border #E5EDF5');
  assert.ok(!cardSource.includes('#E8DFD3'), 'Card must not contain tan border #E8DFD3');
  assert.ok(cardSource.includes('#061B31'), 'CardTitle must use navy ink #061B31');
  assert.ok(cardSource.includes('#50617A'), 'CardDescription must use slate #50617A');

  // 3. Check Input component source
  const inputPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/input.tsx');
  assert.ok(fs.existsSync(inputPath), 'input.tsx must exist');
  const inputSource = fs.readFileSync(inputPath, 'utf8');

  assert.ok(inputSource.includes('#533AFD'), 'Input must use focus ring #533AFD');
  assert.ok(inputSource.includes('#CBD5E1') || inputSource.includes('#E5EDF5'), 'Input must use border #CBD5E1');
  assert.ok(!inputSource.includes('#8A582B'), 'Input must not contain brown #8A582B');
  assert.ok(!inputSource.includes('#FAF8F5'), 'Input must not contain warm beige #FAF8F5');

  // 4. Check TravelStatusBadge status colors
  const approvedBadge = getStatusBadgeConfig('APPROVED');
  assert.ok(approvedBadge.className.includes('emerald'), 'Approved badge should use emerald styling');
  assert.ok(approvedBadge.dotClassName.includes('#00D66F') || approvedBadge.dotClassName.includes('emerald'));

  const pendingBadge = getStatusBadgeConfig('PENDING_MANAGER_REVIEW');
  assert.ok(pendingBadge.className.includes('amber') || pendingBadge.className.includes('533AFD') || pendingBadge.className.includes('indigo') || pendingBadge.className.includes('sky'), 'Pending badge should have clear status styling');

  const revisionBadge = getStatusBadgeConfig('REVISION_REQUESTED_BY_MANAGER');
  assert.ok(revisionBadge.className.includes('orange') || revisionBadge.className.includes('rose'), 'Revision badge should have warning/alert styling');

  console.log('✅ ALL STRIPE PRIMITIVES TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Primitives test failed:', err);
  process.exit(1);
});
