import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Form Clean Inputs & Error-Only Display (No Helper Text)...');

  // 1. Check TravelLogisticsFields.tsx
  const logisticsPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/forms/TravelLogisticsFields.tsx'
  );
  const logisticsSource = fs.readFileSync(logisticsPath, 'utf8');

  // Assert NO helper text is rendered below fields
  assert.ok(
    !logisticsSource.includes('Minimum 5 characters. Use a descriptive'),
    'Trip Title must not have persistent helper text'
  );
  assert.ok(
    !logisticsSource.includes('Minimum 10 characters explaining business'),
    'Business Purpose must not have persistent helper text'
  );
  assert.ok(
    !logisticsSource.includes('Optional code for department budget'),
    'Project Code must not have persistent helper text'
  );

  // Assert error messages are present when validation fails
  assert.ok(
    logisticsSource.includes('{errors.title &&') || logisticsSource.includes('errors.title ?'),
    'Trip Title must render error on validation failure'
  );
  assert.ok(
    logisticsSource.includes('{errors.purpose &&') || logisticsSource.includes('errors.purpose ?'),
    'Business Purpose must render error on validation failure'
  );

  // 2. Check AuthField component
  const authFieldPath = path.resolve(import.meta.dirname, '../src/features/auth/components/AuthField.tsx');
  const authFieldSource = fs.readFileSync(authFieldPath, 'utf8');
  assert.ok(
    !authFieldSource.includes('helperText'),
    'AuthField must not require helperText'
  );

  // 3. Check shared Input component
  const inputPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/input.tsx');
  const inputSource = fs.readFileSync(inputPath, 'utf8');
  assert.ok(
    !inputSource.includes('helperText'),
    'Input component must not have helperText'
  );

  console.log('✅ ALL FORM CLEAN INPUT & ERROR-ONLY VALIDATION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
