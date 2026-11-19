import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Contrast and Text Readability Calibration...');

  // 1. Check index.css token contrast calibrations
  const cssPath = path.resolve(import.meta.dirname, '../src/index.css');
  assert.ok(fs.existsSync(cssPath), 'index.css must exist');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.ok(
    cssContent.includes('--color-muted: #334155;'),
    '--color-muted must be calibrated to high-contrast slate #334155 (contrast ratio > 9:1)'
  );
  assert.ok(
    cssContent.includes('--color-faint: #50617A;'),
    '--color-faint must be calibrated to #50617A (contrast ratio > 5.8:1)'
  );

  // 2. Check input.tsx placeholder contrast
  const inputPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/input.tsx');
  const inputSource = fs.readFileSync(inputPath, 'utf8');
  assert.ok(
    inputSource.includes('placeholder:text-[#50617A]'),
    'Input placeholder must use calibrated #50617A instead of low-contrast #7D8BA4'
  );
  assert.ok(
    !inputSource.includes('placeholder:text-[#7D8BA4]'),
    'Input must not contain washed-out #7D8BA4'
  );

  // 3. Check NewTravelRequestPage.tsx checklist readability
  const newTravelPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/pages/NewTravelRequestPage.tsx'
  );
  const newTravelSource = fs.readFileSync(newTravelPath, 'utf8');
  assert.ok(
    !newTravelSource.includes('text-faint/60'),
    'NewTravelRequestPage readiness checklist must not use washed-out text-faint/60'
  );
  assert.ok(
    newTravelSource.includes('text-slate-800') || newTravelSource.includes('text-[#1A2C44]'),
    'NewTravelRequestPage readiness checklist unfulfilled items must use high-contrast readable text'
  );

  // 4. Check ResubmitTravelRequestPage.tsx checklist readability
  const resubmitPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/pages/ResubmitTravelRequestPage.tsx'
  );
  const resubmitSource = fs.readFileSync(resubmitPath, 'utf8');
  assert.ok(
    !resubmitSource.includes('text-faint/60'),
    'ResubmitTravelRequestPage readiness checklist must not use washed-out text-faint/60'
  );

  // 5. Check PasswordStrengthMeter.tsx rule readability
  const pwdMeterPath = path.resolve(
    import.meta.dirname,
    '../src/features/auth/components/PasswordStrengthMeter.tsx'
  );
  const pwdMeterSource = fs.readFileSync(pwdMeterPath, 'utf8');
  assert.ok(
    !pwdMeterSource.includes("'text-faint'"),
    'Password rules should not render unfulfilled rules with low-contrast text-faint'
  );

  // 6. Check NewUserPage.tsx provisioning checklist readability
  const newUserPath = path.resolve(
    import.meta.dirname,
    '../src/features/users/pages/NewUserPage.tsx'
  );
  const newUserSource = fs.readFileSync(newUserPath, 'utf8');
  assert.ok(
    newUserSource.includes('text-slate-800') || newUserSource.includes('text-[#1A2C44]'),
    'NewUserPage provisioning checklist unfulfilled items must use high-contrast readable text'
  );

  console.log('✅ ALL CONTRAST AND TEXT READABILITY TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Contrast test failed:', err);
  process.exit(1);
});
