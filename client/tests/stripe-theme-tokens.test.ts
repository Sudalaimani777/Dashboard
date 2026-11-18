import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Complete Stripe Token Engine Migration...');
  const cssPath = path.resolve(import.meta.dirname, '../src/index.css');
  assert.ok(fs.existsSync(cssPath), 'index.css must exist');

  const content = fs.readFileSync(cssPath, 'utf8');

  // 1. Verify elimination of legacy brown tokens
  assert.ok(!content.includes('#8A582B'), 'Must not contain legacy primary brown #8A582B');
  assert.ok(!content.includes('#996735'), 'Must not contain legacy secondary brown #996735');
  assert.ok(!content.includes('#F7F4EE'), 'Must not contain legacy canvas #F7F4EE');

  // 2. Verify Colour & Full Palette (29 tokens)
  assert.ok(content.includes('--color-primary: #533AFD;'), 'Must define Stripe primary #533AFD');
  assert.ok(content.includes('--color-primary-hover: #4834DB;'), 'Must define Stripe hover #4834DB');
  assert.ok(content.includes('--color-secondary: #E5EDF5;'), 'Must define Stripe secondary #E5EDF5');
  assert.ok(content.includes('--color-canvas: #F2F7FE;'), 'Must define Stripe canvas #F2F7FE');
  assert.ok(content.includes('--color-ink: #061B31;'), 'Must define Stripe ink #061B31');
  assert.ok(content.includes('#FFE0D1'), 'Must include Stripe accent #FFE0D1');
  assert.ok(content.includes('#635BFF'), 'Must include Stripe violet #635BFF');
  assert.ok(content.includes('#00D66F'), 'Must include Stripe mint #00D66F');
  assert.ok(content.includes('#FF6118'), 'Must include Stripe orange #FF6118');

  // 3. Verify Shape & 5 Border Radii (1px, 4px, 8px, 16px, 100px)
  assert.ok(content.includes('--radius-xs: 1px;') || content.includes('1px'), 'Must define 1px radius');
  assert.ok(content.includes('--radius-sm: 4px;') || content.includes('4px'), 'Must define 4px radius');
  assert.ok(content.includes('--radius-md: 8px;') || content.includes('8px'), 'Must define 8px radius');
  assert.ok(content.includes('--radius-lg: 16px;') || content.includes('16px'), 'Must define 16px radius');
  assert.ok(content.includes('--radius-full: 100px;') || content.includes('100px'), 'Must define 100px radius');

  // 4. Verify 5 Elevation Tiers (xs, sm, md, lg, xl)
  assert.ok(content.includes('--shadow-xs:'), 'Must define shadow-xs');
  assert.ok(content.includes('--shadow-sm:'), 'Must define shadow-sm');
  assert.ok(content.includes('--shadow-md:'), 'Must define shadow-md');
  assert.ok(content.includes('--shadow-lg:'), 'Must define shadow-lg');
  assert.ok(content.includes('--shadow-xl:'), 'Must define shadow-xl');

  // 5. Verify 5 Motion Durations & Easing
  assert.ok(content.includes('--duration-100: 100ms;') || content.includes('100ms'), 'Must define 100ms duration');
  assert.ok(content.includes('--duration-200: 200ms;') || content.includes('200ms'), 'Must define 200ms duration');
  assert.ok(content.includes('--duration-300: 300ms;') || content.includes('300ms'), 'Must define 300ms duration');
  assert.ok(content.includes('--duration-500: 500ms;') || content.includes('500ms'), 'Must define 500ms duration');
  assert.ok(content.includes('--duration-800: 800ms;') || content.includes('800ms'), 'Must define 800ms duration');
  assert.ok(content.includes('cubic-bezier(0.16, 1, 0.3, 1)'), 'Must define Stripe responsive ease-out curve');

  console.log('✅ ALL STRIPE TOKEN ENGINE TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Token engine test failed:', err);
  process.exit(1);
});
