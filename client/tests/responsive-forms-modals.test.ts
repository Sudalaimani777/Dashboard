import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Responsive Forms & Modals (TDD RED)...');

  const modalPath = path.resolve('client/src/features/travel/components/ResubmitRequestModal.tsx');
  const togglePath = path.resolve('client/src/features/travel/components/forms/TravelTypeToggle.tsx');
  const phonePath = path.resolve('client/src/features/travel/components/forms/PhoneInputWithCountry.tsx');
  const managerQueuePath = path.resolve('client/src/features/travel/components/ManagerQueuePortal.tsx');

  const modalCode = fs.readFileSync(modalPath, 'utf8');
  const toggleCode = fs.readFileSync(togglePath, 'utf8');
  const phoneCode = fs.readFileSync(phonePath, 'utf8');
  const managerQueueCode = fs.readFileSync(managerQueuePath, 'utf8');

  // 1. ResubmitRequestModal must use responsive grid for expense rows
  assert.ok(
    modalCode.includes('grid-cols-1 sm:grid-cols-12') || (modalCode.includes('sm:grid-cols-12') && modalCode.includes('grid-cols-1')),
    'ResubmitRequestModal must use responsive grid-cols-1 sm:grid-cols-12 for expense row items'
  );

  // 2. TravelTypeToggle must stack vertically on mobile
  assert.ok(
    toggleCode.includes('flex-col sm:flex-row'),
    'TravelTypeToggle must use flex-col sm:flex-row for mobile readability'
  );

  // 3. PhoneInputWithCountry must clamp popover width to viewport
  assert.ok(
    phoneCode.includes('max-w-[calc(100vw'),
    'PhoneInputWithCountry must clamp country selection dropdown popover to viewport bounds'
  );

  // 4. ManagerQueuePortal must use fluid responsive search input width
  assert.ok(
    !managerQueueCode.includes('w-64 sm:w-72'),
    'ManagerQueuePortal must replace rigid w-64 with fluid w-full sm:w-72'
  );

  console.log('✅ Responsive forms and modals structural tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
