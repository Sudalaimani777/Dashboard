import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Form Permanent Helper Text & Clean Placeholders...');

  // 1. Check shared Input component
  const inputPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/input.tsx');
  const inputSource = fs.readFileSync(inputPath, 'utf8');
  assert.ok(
    inputSource.includes('helperText?: React.ReactNode'),
    'InputProps in input.tsx must include helperText'
  );
  assert.ok(
    inputSource.includes('text-[#50617A]') || inputSource.includes('text-faint'),
    'Input component must style helperText with accessible high-contrast faint color'
  );

  // 2. Check AuthField component
  const authFieldPath = path.resolve(import.meta.dirname, '../src/features/auth/components/AuthField.tsx');
  const authFieldSource = fs.readFileSync(authFieldPath, 'utf8');
  assert.ok(
    authFieldSource.includes('helperText?: React.ReactNode'),
    'AuthFieldProps in AuthField.tsx must include helperText'
  );

  // 3. Check TravelLogisticsFields.tsx
  const logisticsPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/forms/TravelLogisticsFields.tsx'
  );
  const logisticsSource = fs.readFileSync(logisticsPath, 'utf8');

  // Title: clean placeholder + permanent helper text
  assert.ok(
    logisticsSource.includes('placeholder="Enter trip title"'),
    'Trip Title must use a clean action-oriented placeholder'
  );
  assert.ok(
    !logisticsSource.includes('placeholder="e.g. Tokyo Architecture Integration 2026"'),
    'Trip Title must not use confusing dummy text in placeholder'
  );
  assert.ok(
    logisticsSource.includes('Minimum 5 characters'),
    'Trip Title must have permanent helper text specifying minimum 5 characters'
  );

  // Purpose: clean placeholder + permanent helper text
  assert.ok(
    logisticsSource.includes('placeholder="Explain business necessity') ||
      logisticsSource.includes('placeholder="Explain why travel is required'),
    'Business Purpose must use clean action-oriented placeholder'
  );
  assert.ok(
    !logisticsSource.includes('placeholder="Detailed business necessity justifying corporate travel..."'),
    'Business Purpose must not use lengthy instructional placeholder'
  );
  assert.ok(
    logisticsSource.includes('Minimum 10 characters'),
    'Business Purpose must have permanent helper text specifying minimum 10 characters'
  );

  // Project code: clean placeholder + permanent helper text
  assert.ok(
    logisticsSource.includes('placeholder="Enter project code"'),
    'Project Code must use clean placeholder'
  );
  assert.ok(
    logisticsSource.includes('Optional code for department') ||
      logisticsSource.includes('Optional code for billing'),
    'Project Code must have permanent helper text'
  );

  // Origin & Destination
  assert.ok(
    logisticsSource.includes('placeholder="Enter origin city"'),
    'Origin City must use clean placeholder'
  );
  assert.ok(
    logisticsSource.includes('placeholder="Enter destination city"'),
    'Destination must use clean placeholder'
  );

  // Emergency Contact
  assert.ok(
    logisticsSource.includes('placeholder="Full name of emergency contact"'),
    'Emergency Contact Name must use clean placeholder'
  );

  // 4. Check ExpenseRowItem.tsx
  const expenseRowPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/forms/ExpenseRowItem.tsx'
  );
  const expenseRowSource = fs.readFileSync(expenseRowPath, 'utf8');

  assert.ok(
    expenseRowSource.includes('placeholder="Merchant or vendor name"'),
    'ExpenseRowItem merchant must use clean placeholder'
  );
  assert.ok(
    expenseRowSource.includes('placeholder="Expense details or invoice reference"'),
    'ExpenseRowItem notes must use clean placeholder'
  );

  console.log('✅ ALL FORM PERMANENT HELPER TEXT TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
