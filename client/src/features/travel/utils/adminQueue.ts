import type { TravelRequest, TravelStatus, TravelType } from '../types/travel.types';

export type AdminTypeFilter = 'ALL' | TravelType;
export type AdminDecisionAction = 'APPROVE' | 'SETTLE' | 'REQUEST_REVISION' | 'REJECT';
export type AdminLedgerStatusFilter = 'ALL' | 'APPROVED' | 'SETTLED' | 'REJECTED' | 'CANCELLED';

export interface ClassifiedAdminQueue {
  awaitingExecutive: TravelRequest[];
  tier1Oversight: TravelRequest[];
  dispatchedRevisions: TravelRequest[];
  ledgerArchive: TravelRequest[];
}

export function isManagerPersonalTrip(request: TravelRequest): boolean {
  return request.requesterRole === 'MANAGER';
}

const ARCHIVE_STATUSES = new Set<TravelStatus>(['APPROVED', 'SETTLED', 'REJECTED', 'CANCELLED']);

/**
 * Partitions adminQueue into non-overlapping executive queues, prioritizing
 * Managers' personal trips inside Tier 1 oversight.
 */
export function classifyAdminQueue(queue: TravelRequest[]): ClassifiedAdminQueue {
  const awaitingExecutive: TravelRequest[] = [];
  const tier1Oversight: TravelRequest[] = [];
  const dispatchedRevisions: TravelRequest[] = [];
  const ledgerArchive: TravelRequest[] = [];

  for (const req of queue) {
    if (req.status === 'PENDING_ADMIN_APPROVAL') {
      awaitingExecutive.push(req);
    } else if (req.status === 'PENDING_MANAGER_REVIEW') {
      tier1Oversight.push(req);
    } else if (req.status.includes('REVISION_REQUESTED_BY_ADMIN')) {
      dispatchedRevisions.push(req);
    } else if (ARCHIVE_STATUSES.has(req.status)) {
      ledgerArchive.push(req);
    }
  }

  // Sort Manager personal requests first so Admin notices blocked Tier 1 self-reviews immediately
  tier1Oversight.sort((a, b) => {
    const aMgr = isManagerPersonalTrip(a) ? 0 : 1;
    const bMgr = isManagerPersonalTrip(b) ? 0 : 1;
    return aMgr - bMgr;
  });

  return {
    awaitingExecutive,
    tier1Oversight,
    dispatchedRevisions,
    ledgerArchive,
  };
}

export interface AdminFilterOptions {
  query?: string;
  typeFilter?: AdminTypeFilter;
  departmentFilter?: string;
  statusFilter?: AdminLedgerStatusFilter;
}

/**
 * Filters Admin travel request lists by search query, travel type, department, and status.
 */
export function filterAdminRequests(
  requests: TravelRequest[],
  options: AdminFilterOptions
): TravelRequest[] {
  const normalizedQuery = (options.query || '').trim().toLowerCase();
  const typeFilter = options.typeFilter || 'ALL';
  const departmentFilter = options.departmentFilter || 'ALL';
  const statusFilter = options.statusFilter || 'ALL';

  return requests.filter((req) => {
    if (typeFilter !== 'ALL' && req.travelType !== typeFilter) {
      return false;
    }

    if (
      departmentFilter !== 'ALL' &&
      (req.requesterDepartment || '').toLowerCase() !== departmentFilter.toLowerCase()
    ) {
      return false;
    }

    if (statusFilter !== 'ALL' && req.status !== statusFilter) {
      return false;
    }

    if (normalizedQuery) {
      const haystack = [
        req.title,
        req.projectCode,
        req.origin,
        req.destination,
        req.requesterName,
        req.requesterEmail,
        req.requesterDepartment,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Validates Admin decision remarks (>= 3 chars for Reject/Revision) and budget overflow override.
 */
export function validateAdminDecisionRemarks(
  action: AdminDecisionAction,
  remarks: string,
  options: { isOverflow?: boolean; forceOverride?: boolean } = {}
): { valid: boolean; message?: string } {
  const trimmed = remarks.trim();

  if (action === 'REQUEST_REVISION' && trimmed.length < 3) {
    return {
      valid: false,
      message: 'Please provide revision instructions (at least 3 characters).',
    };
  }

  if (action === 'REJECT' && trimmed.length < 3) {
    return {
      valid: false,
      message: 'Please provide rejection rationale (at least 3 characters).',
    };
  }

  if ((action === 'APPROVE' || action === 'SETTLE') && options.isOverflow && !options.forceOverride) {
    return {
      valid: false,
      message: 'This request exceeds quarterly department headroom. Confirm the Budget Overflow Override checkbox to proceed.',
    };
  }

  return { valid: true };
}
