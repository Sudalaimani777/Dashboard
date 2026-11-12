// server/src/features/travel/travel.types.ts

export type TravelRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export type TravelType = 'UPCOMING' | 'ALREADY_TRAVELLED';

export type ExpenseCategory = 'FLIGHT' | 'HOTEL' | 'MEALS_PER_DIEM' | 'TRANSIT' | 'MISC';

export type TravelStatus = 
  | 'DRAFT'
  | 'PENDING_MANAGER_REVIEW'
  | 'REVISION_REQUESTED_BY_MANAGER'
  | 'PENDING_ADMIN_APPROVAL'
  | 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER'
  | 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
  | 'APPROVED'
  | 'SETTLED'
  | 'REJECTED'
  | 'CANCELLED';

export type RevisionTarget = 'MANAGER' | 'EMPLOYEE';

export interface TravelExpense {
  id?: string;
  travel_request_id?: string;
  travelRequestId?: string;
  category: ExpenseCategory;
  merchant: string;
  amount: number;
  expense_date?: string;
  expenseDate?: string;
  receipt_image_url?: string | null;
  receiptImageUrl?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface TravelRequest {
  id: string;
  user_id: string;
  userId?: string;
  manager_id?: string | null;
  managerId?: string | null;
  admin_id?: string | null;
  adminId?: string | null;
  travel_type: TravelType;
  travelType?: TravelType;
  title: string;
  purpose: string;
  project_code: string;
  projectCode?: string;
  origin: string;
  destination: string;
  departure_date: string;
  departureDate?: string;
  return_date: string;
  returnDate?: string;
  emergency_contact_name: string;
  emergencyContactName?: string;
  emergency_contact_phone: string;
  emergencyContactPhone?: string;
  supporting_doc_url?: string | null;
  supportingDocUrl?: string | null;
  total_expenses: number;
  totalExpenses?: number;
  status: TravelStatus;
  revision_target?: RevisionTarget | null;
  revisionTarget?: RevisionTarget | null;
  manager_remarks?: string | null;
  managerRemarks?: string | null;
  manager_reviewed_at?: string | null;
  managerReviewedAt?: string | null;
  admin_remarks?: string | null;
  adminRemarks?: string | null;
  admin_reviewed_at?: string | null;
  adminReviewedAt?: string | null;
  currency: string;
  created_at: string;
  createdAt?: string;
  updated_at: string;
  updatedAt?: string;
  // Joined / populated fields
  requester_name?: string;
  requesterName?: string;
  requester_email?: string;
  requesterEmail?: string;
  requester_department?: string;
  requesterDepartment?: string;
  manager_name?: string;
  managerName?: string;
  admin_name?: string;
  adminName?: string;
  expenses?: TravelExpense[];
  timeline?: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  travel_request_id: string;
  travelRequestId?: string;
  actor_id: string;
  actorId?: string;
  actor_role: string;
  actorRole?: string;
  actor_name?: string;
  actorName?: string;
  event_type: string;
  eventType?: string;
  from_status?: string | null;
  fromStatus?: string | null;
  to_status: string;
  toStatus?: string;
  remarks?: string | null;
  created_at: string;
  createdAt?: string;
}

export interface DepartmentBudget {
  id: string;
  department: string;
  fiscal_year: number;
  fiscal_quarter: string;
  total_allocation: number;
  utilized_amount: number;
  available_headroom?: number;
  utilization_percentage?: number;
  categoryBreakdown?: Array<{ category: string; total: number }>;
  created_at: string;
  updated_at: string;
}

/**
 * Finite State Machine allowed transitions.
 * Enforces strict 2-tier approval workflow and manager re-verification invariant.
 */
export const ALLOWED_TRANSITIONS: Record<TravelStatus, TravelStatus[]> = {
  DRAFT: [
    'PENDING_MANAGER_REVIEW', 
    'CANCELLED'
  ],
  PENDING_MANAGER_REVIEW: [
    'PENDING_ADMIN_APPROVAL', 
    'REVISION_REQUESTED_BY_MANAGER', 
    'REJECTED',
    'CANCELLED'
  ],
  REVISION_REQUESTED_BY_MANAGER: [
    'PENDING_MANAGER_REVIEW', 
    'CANCELLED'
  ],
  PENDING_ADMIN_APPROVAL: [
    'APPROVED',
    'SETTLED',
    'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
    'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
    'REJECTED'
  ],
  REVISION_REQUESTED_BY_ADMIN_TO_MANAGER: [
    'REVISION_REQUESTED_BY_MANAGER', 
    'PENDING_ADMIN_APPROVAL', 
    'REJECTED'
  ],
  // STRICT INVARIANT: Resubmission from Admin Revision to Employee MUST route back to Manager!
  REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE: [
    'PENDING_MANAGER_REVIEW', 
    'CANCELLED'
  ],
  APPROVED: [],
  SETTLED: [],
  REJECTED: [],
  CANCELLED: []
};

/**
 * Validates whether a transition from current status to next status is legal.
 */
export function validateStatusTransition(current: TravelStatus, next: TravelStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

/**
 * Determines whether the employee is permitted to edit/modify the request or expenses.
 */
export function canEmployeeModify(status: TravelStatus): boolean {
  return (
    status === 'DRAFT' ||
    status === 'REVISION_REQUESTED_BY_MANAGER' ||
    status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
  );
}

/**
 * Determines whether the request has reached a terminal closed state.
 */
export function isTerminalStatus(status: TravelStatus): boolean {
  return (
    status === 'APPROVED' ||
    status === 'SETTLED' ||
    status === 'REJECTED' ||
    status === 'CANCELLED'
  );
}
