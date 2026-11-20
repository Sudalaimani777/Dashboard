import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Analytics Cards Height Stability (TDD - 300px Contract)...');

  const clientDir = path.resolve(import.meta.dirname, '../src/features/travel/components');

  const targetCards = [
    {
      name: 'DepartmentCategoryBreakdownCard',
      file: path.join(clientDir, 'DepartmentCategoryBreakdownCard.tsx'),
      hasListScroll: true,
    },
    {
      name: 'DepartmentSpendersVelocityCard',
      file: path.join(clientDir, 'DepartmentSpendersVelocityCard.tsx'),
      hasListScroll: true,
    },
    {
      name: 'ManagerApprovalMeterCard',
      file: path.join(clientDir, 'manager/ManagerApprovalMeterCard.tsx'),
      hasListScroll: false,
    },
    {
      name: 'ManagerSpendersVelocityCard',
      file: path.join(clientDir, 'manager/ManagerSpendersVelocityCard.tsx'),
      hasListScroll: true,
    },
    {
      name: 'EmployeeReimbursementMeterCard',
      file: path.join(clientDir, 'employee/EmployeeReimbursementMeterCard.tsx'),
      hasListScroll: false,
    },
    {
      name: 'EmployeeProjectVelocityCard',
      file: path.join(clientDir, 'employee/EmployeeProjectVelocityCard.tsx'),
      hasListScroll: true,
    },
  ];

  // 1. Verify existence and h-[300px] height contract on all 6 target cards
  for (const card of targetCards) {
    assert.ok(fs.existsSync(card.file), `${card.name}.tsx must exist at ${card.file}`);
    const source = fs.readFileSync(card.file, 'utf-8');

    assert.ok(
      source.includes('h-[300px]'),
      `${card.name}.tsx root container MUST contain 'h-[300px]' to lock card height at 300px`
    );

    if (card.hasListScroll) {
      assert.ok(
        source.includes('overflow-y-auto') && source.includes('min-h-0'),
        `${card.name}.tsx body list container MUST contain 'overflow-y-auto' and 'min-h-0' to support scrollable content when data grows`
      );
    }
  }

  console.log('✅ ALL 6 TARGET CARDS SATISFY THE 300px HEIGHT STABILITY CONTRACT!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
