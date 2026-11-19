// client/tests/clean-queue-banners.test.ts
import fs from 'node:fs';
import path from 'node:path';

function runCleanQueueBannersTest() {
  console.log('🧪 Starting Clean Queue Banners TDD Test Suite...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (!condition) {
      throw new Error(`❌ Assertion failed: ${message}`);
    }
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  }

  // 1. Check AdminGovernancePortal.tsx
  const adminContent = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/travel/components/AdminGovernancePortal.tsx'),
    'utf-8'
  );
  assert(
    !adminContent.includes('awaiting Tier 1 clearance (Managers cannot self-approve their own travel)'),
    'AdminGovernancePortal: Redundant manager oversight amber banner is cleanly removed'
  );

  // 2. Check EmployeeTravelPortal.tsx
  const employeeContent = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/travel/components/EmployeeTravelPortal.tsx'),
    'utf-8'
  );
  assert(
    !employeeContent.includes('require your revision. Resubmissions strictly return to your Line Manager'),
    'EmployeeTravelPortal: Redundant pinned revision amber banner is cleanly removed'
  );

  // 3. Check ManagerQueuePortal.tsx
  const managerContent = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/travel/components/ManagerQueuePortal.tsx'),
    'utf-8'
  );
  assert(
    !managerContent.includes('requiring revision & resubmission'),
    'ManagerQueuePortal: Redundant personal trip revision amber banner is cleanly removed'
  );

  console.log('\n==========================================');
  console.log(`🎉 ALL ${passed}/${total} CLEAN QUEUE BANNER TESTS PASSED!`);
  console.log('==========================================\n');
}

runCleanQueueBannersTest();
