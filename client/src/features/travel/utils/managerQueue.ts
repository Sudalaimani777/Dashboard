import type { TravelRequest, TravelStatus, TravelType } from '../types/travel.types';

export type ManagerTypeFilter = 'ALL' | TravelType;
export type ManagerHistoryBucket =
  | 'ALL'
  | 'AWAITING_ADMIN'
  | 'WAITING_EMPLOYEE'
  | 'APPROVED_SETTLED'
  | 'REJECTED_CANCELLED';

export type ManagerDecisionAction = 'APPROVE' | 'REQUEST_REVISION' | 'REJECT';

const REVISION_TIMELINE_STATUSES = new Set([
  'REVISION_REQUESTED_BY_MANAGER',
  'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
  'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
]);

/**
 * Checks whether a request awaiting Tier 1 review came from a revision/resubmission loop.
 */
export function isResubmittedForManagerAudit(request: TravelRequest): boolean {
  if (request.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER') {
    return true;
  }
  if (!['SUBMITTED', 'PENDING_MANAGER_REVIEW'].includes(request.status)) {
    return false;
  }
  const events = request.timeline || [];
  return events.some((ev) => {
    const evType = String(ev.eventType || ev.event_type || '').toUpperCase();
    const toStatus = String(ev.toStatus || ev.to_status || '').toUpperCase();
    return (
      evType.includes('RESUBMIT') ||
      evType.includes('REVISION') ||
      REVISION_TIMELINE_STATUSES.has(toStatus)
    );
  });
}

/**
 * Returns true if the status can currently be decided by a Line Manager.
 */
export function isManagerReviewableStatus(status?: TravelStatus): boolean {
  return (
    status === 'PENDING_MANAGER_REVIEW' ||
    status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER'
  );
}

/**
 * Guards against self-auditing personal requests and non-reviewable statuses.
 */
export function canManagerAuditRequest(
  request: TravelRequest,
  currentUserId?: string
): boolean {
  if (currentUserId && request.userId === currentUserId) {
    return false;
  }
  return isManagerReviewableStatus(request.status);
}

export interface ClassifiedManagerQueue {
  teamQueue: TravelRequest[];
  initialAudit: TravelRequest[];
  revisions: TravelRequest[];
  teamHistoryAndTracking: TravelRequest[];
}

const WAITING_EMPLOYEE_STATUSES = new Set<TravelStatus>([
  'REVISION_REQUESTED_BY_MANAGER',
  'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
]);

const TRACKING_AND_HISTORY_STATUSES = new Set<TravelStatus>([
  'PENDING_ADMIN_APPROVAL',
  'REVISION_REQUESTED_BY_MANAGER',
  'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
  'APPROVED',
  'SETTLED',
  'REJECTED',
  'CANCELLED',
]);

/**
 * Partitions managerQueue cleanly with zero overlap and strict self-request exclusion.
 */
export function classifyManagerQueue(
  queue: TravelRequest[],
  currentUserId?: string
): ClassifiedManagerQueue {
  const teamQueue = currentUserId
    ? queue.filter((r) => r.userId !== currentUserId)
    : queue;

  const initialAudit: TravelRequest[] = [];
  const revisions: TravelRequest[] = [];
  const teamHistoryAndTracking: TravelRequest[] = [];

  for (const req of teamQueue) {
    if (req.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER') {
      revisions.push(req);
      continue;
    }

    if (req.status === 'PENDING_MANAGER_REVIEW' || String(req.status) === 'SUBMITTED') {
      if (isResubmittedForManagerAudit(req)) {
        revisions.push(req);
      } else {
        initialAudit.push(req);
      }
      continue;
    }

    if (TRACKING_AND_HISTORY_STATUSES.has(req.status)) {
      teamHistoryAndTracking.push(req);
    }
  }

  return {
    teamQueue,
    initialAudit,
    revisions,
    teamHistoryAndTracking,
  };
}

export interface ManagerFilterOptions {
  query?: string;
  typeFilter?: ManagerTypeFilter;
  statusBucket?: ManagerHistoryBucket;
}

/**
 * Checks if a request matches a ManagerHistoryBucket filter.
 */
export function matchesHistoryBucket(
  status: TravelStatus,
  bucket: ManagerHistoryBucket = 'ALL'
): boolean {
  switch (bucket) {
    case 'AWAITING_ADMIN':
      return status === 'PENDING_ADMIN_APPROVAL';
    case 'WAITING_EMPLOYEE':
      return WAITING_EMPLOYEE_STATUSES.has(status);
    case 'APPROVED_SETTLED':
      return status === 'APPROVED' || status === 'SETTLED';
    case 'REJECTED_CANCELLED':
      return status === 'REJECTED' || status === 'CANCELLED';
    case 'ALL':
    default:
      return true;
  }
}

/**
 * Filters requests by search text (title, city, project, requester), travel type, and history bucket.
 */
export function filterManagerRequests(
  requests: TravelRequest[],
  options: ManagerFilterOptions = {}
): TravelRequest[] {
  const q = (options.query || '').trim().toLowerCase();
  const typeFilter = options.typeFilter || 'ALL';
  const statusBucket = options.statusBucket || 'ALL';

  return requests.filter((req) => {
    if (typeFilter !== 'ALL' && req.travelType !== typeFilter) {
      return false;
    }
    if (statusBucket !== 'ALL' && !matchesHistoryBucket(req.status, statusBucket)) {
      return false;
    }
    if (!q) return true;

    return (
      req.title.toLowerCase().includes(q) ||
      req.origin.toLowerCase().includes(q) ||
      req.destination.toLowerCase().includes(q) ||
      req.projectCode.toLowerCase().includes(q) ||
      (req.requesterName || '').toLowerCase().includes(q) ||
      (req.requesterEmail || '').toLowerCase().includes(q)
    );
  });
}

/**
 * Matches backend remark constraints: optional on APPROVE, min 3 chars on REQUEST_REVISION / REJECT.
 */
export function validateManagerDecisionRemarks(
  action: ManagerDecisionAction,
  remarks: string
): { valid: boolean; error?: string } {
  if (action === 'APPROVE') {
    return { valid: true };
  }
  const trimmed = (remarks || '').trim();
  if (trimmed.length < 3) {
    return {
      valid: false,
      error:
        action === 'REJECT'
          ? 'Please enter at least 3 characters explaining why this request is rejected.'
          : 'Please enter at least 3 characters of revision instructions.',
    };
  }
  return { valid: true };
}

/**
 * Extracts the latest resubmission note written by an employee after a revision request.
 */
export function getLatestResubmissionNote(request: TravelRequest): string | null {
  const events = request.timeline || [];
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const ev = events[i];
    const evType = String(ev.eventType || ev.event_type || '').toUpperCase();
    const toStatus = String(ev.toStatus || ev.to_status || '').toUpperCase();
    if (
      (evType.includes('RESUBMIT') || toStatus === 'PENDING_MANAGER_REVIEW') &&
      ev.remarks &&
      evType !== 'SUBMITTED'
    ) {
      return ev.remarks;
    }
  }
  return null;
}
