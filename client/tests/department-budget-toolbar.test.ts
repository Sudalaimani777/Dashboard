import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Department Budget top toolbar UX cleanup (TDD)...');

  const budgetsPagePath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/pages/DepartmentBudgetsPage.tsx'
  );
  const budgetsPage = fs.readFileSync(budgetsPagePath, 'utf8');

  // Check 1: Top strip should not have redundant "My Managed:" label
  assert.ok(
    !budgetsPage.includes('My Managed:'),
    'DepartmentBudgetsPage should not render redundant "My Managed:" label in the top filter strip'
  );

  // Check 2: Top strip should not have redundant "None assigned" text
  assert.ok(
    !budgetsPage.includes('None assigned'),
    'DepartmentBudgetsPage should not render "None assigned" in the top strip'
  );

  // Check 3: Essential controls (department select, fiscal year select, quarter filter) remain
  assert.ok(
    budgetsPage.includes('aria-label="Filter by department"'),
    'DepartmentBudgetsPage must retain the department select dropdown'
  );
  assert.ok(
    budgetsPage.includes('aria-label="Filter by fiscal year"'),
    'DepartmentBudgetsPage must retain the fiscal year select dropdown'
  );
  assert.ok(
    budgetsPage.includes('aria-label="Filter by fiscal quarter"'),
    'DepartmentBudgetsPage must retain the fiscal quarter segment control'
  );

  // Check 4: The table section still retains the pool scope toggle for My Departments
  assert.ok(
    budgetsPage.includes("label: `My Departments (${myDepartments.length})`"),
    'Department Pools table must retain My Departments scoping'
  );

  // Check 5: Dropdown must include "All Departments" option
  assert.ok(
    budgetsPage.includes('value="ALL"') && budgetsPage.includes('All Departments'),
    'DepartmentBudgetsPage dropdown must offer "All Departments" (value="ALL") option'
  );

  // Check 6: Toolbar must provide a Reset filters button with RotateCcw icon
  assert.ok(
    budgetsPage.includes('aria-label="Reset all filters to defaults"') ||
      budgetsPage.includes('handleResetFilters'),
    'DepartmentBudgetsPage must provide a reset filters button or handler'
  );
  assert.ok(
    budgetsPage.includes('RotateCcw'),
    'DepartmentBudgetsPage must use RotateCcw icon for the Reset action'
  );

  // Check 7: Active budget handles "ALL" for corporate aggregate view
  assert.ok(
    budgetsPage.includes("selectedDepartment === 'ALL'") || budgetsPage.includes('activeBudget'),
    'DepartmentBudgetsPage must handle selectedDepartment === ALL for corporate aggregate view'
  );

  console.log('✅ ALL DEPARTMENT BUDGET TOOLBAR TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
