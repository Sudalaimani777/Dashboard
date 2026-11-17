import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  handleViewRevisionsAction,
  type ViewRevisionsActionParams,
} from '../src/features/travel/utils/viewRevisionsAction';

async function run() {
  console.log('🧪 Testing View Revisions Button Action Logic (TDD RED/GREEN)...');

  // Test 1: Single revision request should directly navigate to edit/resubmit page
  {
    const singleRevision = [{ id: 'req-abc-123', status: 'REVISION_REQUESTED_BY_MANAGER' }];
    let navigatedUrl = '';
    let segmentSet = '';
    let searchCleared = false;
    let scrolled = false;

    const result = handleViewRevisionsAction({
      revisionRequests: singleRevision,
      onNavigate: (url) => { navigatedUrl = url; },
      onSetSegment: (segment) => { segmentSet = segment; },
      onClearSearch: () => { searchCleared = true; },
      onScrollToTable: () => { scrolled = true; },
    });

    assert.equal(result.action, 'NAVIGATE_SINGLE');
    assert.equal(result.targetUrl, '/travel/requests/req-abc-123/edit?tab=revisions');
    assert.equal(navigatedUrl, '/travel/requests/req-abc-123/edit?tab=revisions');
    assert.equal(segmentSet, '', 'Should not switch local segment when directly navigating single request');
    console.log('  ✓ Test 1: Single revision directly navigates to edit page');
  }

  // Test 2: Multiple revision requests should filter to REVISIONS segment, clear search, update URL and scroll
  {
    const multipleRevisions = [
      { id: 'req-1', status: 'REVISION_REQUESTED_BY_MANAGER' },
      { id: 'req-2', status: 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE' },
    ];
    let navigatedUrl = '';
    let segmentSet = '';
    let searchCleared = false;
    let scrolled = false;

    const result = handleViewRevisionsAction({
      revisionRequests: multipleRevisions,
      onNavigate: (url) => { navigatedUrl = url; },
      onSetSegment: (segment) => { segmentSet = segment; },
      onClearSearch: () => { searchCleared = true; },
      onScrollToTable: () => { scrolled = true; },
    });

    assert.equal(result.action, 'FILTER_AND_SCROLL');
    assert.equal(segmentSet, 'REVISIONS');
    assert.equal(searchCleared, true, 'Search must be cleared so revision rows are not hidden');
    assert.equal(navigatedUrl, '/dashboard?tab=revisions');
    assert.equal(scrolled, true, 'Table must be scrolled into view');
    console.log('  ✓ Test 2: Multiple revisions filters segment, clears search, syncs URL, and scrolls');
  }

  // Test 3: Zero revisions handles gracefully
  {
    let navigatedUrl = '';
    const result = handleViewRevisionsAction({
      revisionRequests: [],
      onNavigate: (url) => { navigatedUrl = url; },
      onSetSegment: () => {},
    });
    assert.equal(result.action, 'NONE');
    assert.equal(navigatedUrl, '');
    console.log('  ✓ Test 3: Zero revisions is a graceful no-op');
  }

  // Test 4: Verify EmployeeTravelPortal.tsx connects the action handler and scroll ref
  {
    const portalFile = path.resolve(process.cwd(), 'client/src/features/travel/components/EmployeeTravelPortal.tsx');
    const content = fs.readFileSync(portalFile, 'utf-8');

    assert.ok(
      content.includes('handleViewRevisionsAction'),
      'EmployeeTravelPortal.tsx must use handleViewRevisionsAction'
    );
    assert.ok(
      content.includes('scrollIntoView') || content.includes('tableRef'),
      'EmployeeTravelPortal.tsx must have a table ref or scrollIntoView for smooth scrolling'
    );
    console.log('  ✓ Test 4: EmployeeTravelPortal component uses the new action handler and scroll ref');
  }

  // Test 5: Verify ManagerQueuePortal.tsx connects the action handler and scroll ref
  {
    const managerFile = path.resolve(process.cwd(), 'client/src/features/travel/components/ManagerQueuePortal.tsx');
    const content = fs.readFileSync(managerFile, 'utf-8');

    assert.ok(
      content.includes('handleViewRevisionsAction'),
      'ManagerQueuePortal.tsx must use handleViewRevisionsAction'
    );
    assert.ok(
      content.includes('personalTableRef'),
      'ManagerQueuePortal.tsx must have personalTableRef for smooth scrolling'
    );
    console.log('  ✓ Test 5: ManagerQueuePortal component uses the new action handler and scroll ref');
  }

  console.log('🎉 All View Revisions tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
