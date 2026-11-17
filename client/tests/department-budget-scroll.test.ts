import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Department Budget Smooth Scroll Interactions (TDD)...');

  const pagePath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/pages/DepartmentBudgetsPage.tsx'
  );
  const pageSource = fs.readFileSync(pagePath, 'utf8');

  // Test 1: editorRef attached to Allocation Editor Form with smooth scrolling
  assert.ok(
    pageSource.includes('editorRef') && pageSource.includes('scrollIntoView'),
    'DepartmentBudgetsPage must define and use editorRef to scroll to the allocation editor'
  );

  assert.ok(
    pageSource.includes("behavior: 'smooth'"),
    'DepartmentBudgetsPage must use smooth scroll behavior'
  );

  // Test 2: preventScroll: true must be used on focus() to prevent browser from snapping instantly
  assert.ok(
    pageSource.includes('preventScroll: true'),
    'DepartmentBudgetsPage must use { preventScroll: true } when focusing inputs during smooth scroll'
  );

  // Test 3: openEditor must ensure scrolling triggers even if editor is already open (not just on isEditorOpen transition)
  assert.ok(
    pageSource.includes('scrollToEditor') ||
      pageSource.includes('editorScrollTrigger') ||
      (pageSource.includes('openEditor') && pageSource.includes('editorRef.current?.scrollIntoView')),
    'DepartmentBudgetsPage must scroll to editor on every openEditor invocation, including when already open'
  );

  // Test 4: heroRef attached to Container 2
  assert.ok(
    pageSource.includes('heroRef') || pageSource.includes('inspectionWorkspaceRef'),
    'DepartmentBudgetsPage must define a ref on the inspection hero workspace'
  );

  // Test 5: Inspect button invokes smooth scroll to heroRef
  assert.ok(
    pageSource.includes('handleInspectDepartment') ||
      (pageSource.includes('setSelectedDepartment') && pageSource.includes('heroRef.current?.scrollIntoView')),
    'DepartmentBudgetsPage must scroll to the hero workspace when Inspect is clicked'
  );

  console.log('✅ ALL DEPARTMENT BUDGET SCROLL TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
