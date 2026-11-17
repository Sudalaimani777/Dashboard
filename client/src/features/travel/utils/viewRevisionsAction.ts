export interface ViewRevisionsActionParams {
  revisionRequests: Array<{ id: string }>;
  onNavigate: (url: string) => void;
  onSetSegment: (segment: 'REVISIONS') => void;
  onClearSearch?: () => void;
  onScrollToTable?: () => void;
  targetDashboardTab?: string;
}

export interface ViewRevisionsActionResult {
  action: 'NAVIGATE_SINGLE' | 'FILTER_AND_SCROLL' | 'NONE';
  targetUrl?: string;
  targetTab?: string;
}

/**
 * Handles the "View Revisions" user action.
 * - When exactly 1 revision is pending: directly navigates to the edit/resubmit flow for immediate resolution.
 * - When multiple revisions are pending: switches the segment to REVISIONS, clears any active search query,
 *   synchronizes the URL to ?tab=revisions, and smoothly scrolls down to the requests table.
 */
export function handleViewRevisionsAction({
  revisionRequests,
  onNavigate,
  onSetSegment,
  onClearSearch,
  onScrollToTable,
  targetDashboardTab = 'revisions',
}: ViewRevisionsActionParams): ViewRevisionsActionResult {
  if (revisionRequests.length === 1) {
    const targetUrl = `/travel/requests/${revisionRequests[0].id}/edit?tab=revisions`;
    onNavigate(targetUrl);
    return {
      action: 'NAVIGATE_SINGLE',
      targetUrl,
    };
  }

  if (revisionRequests.length > 1) {
    onSetSegment('REVISIONS');
    onClearSearch?.();
    onNavigate(`/dashboard?tab=${targetDashboardTab}`);
    onScrollToTable?.();
    return {
      action: 'FILTER_AND_SCROLL',
      targetTab: targetDashboardTab,
    };
  }

  return {
    action: 'NONE',
  };
}
