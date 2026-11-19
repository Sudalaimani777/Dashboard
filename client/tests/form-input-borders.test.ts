import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Form Input Border Contrast & Visibility...');

  // 1. Check index.css tokens
  const cssPath = path.resolve(import.meta.dirname, '../src/index.css');
  assert.ok(fs.existsSync(cssPath), 'index.css must exist');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.ok(
    cssContent.includes('--color-border-warm: #CBD5E1;'),
    '--color-border-warm must be calibrated to high-visibility slate #CBD5E1 (replaces washed-out #E2E8F0)'
  );
  assert.ok(
    cssContent.includes('--color-border: #CBD5E1;'),
    '--color-border must be calibrated to #CBD5E1 (replaces invisible #E5EDF5)'
  );
  assert.ok(
    cssContent.includes('--color-border-strong: #94A3B8;'),
    '--color-border-strong must be #94A3B8'
  );

  // 2. Check input.tsx border
  const inputPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/input.tsx');
  const inputSource = fs.readFileSync(inputPath, 'utf8');
  assert.ok(
    inputSource.includes('border-[#CBD5E1]'),
    'Input component must use high-visibility border #CBD5E1'
  );
  assert.ok(
    !inputSource.includes('border-[#E5EDF5]'),
    'Input component must not use invisible border #E5EDF5'
  );

  // 3. Check ExpenseRowItem.tsx
  const expenseRowPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/forms/ExpenseRowItem.tsx'
  );
  const expenseRowSource = fs.readFileSync(expenseRowPath, 'utf8');
  assert.ok(
    !expenseRowSource.includes('border-border-warm/80'),
    'ExpenseRowItem note input must use solid border instead of faded border-border-warm/80'
  );

  console.log('✅ ALL FORM INPUT BORDER VISIBILITY TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Form input border test failed:', err);
  process.exit(1);
});
