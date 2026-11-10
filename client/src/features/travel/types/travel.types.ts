// client/src/features/travel/types/travel.types.ts

export type TravelRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export type TravelType = 'UPCOMING' | 'ALREADY_TRAVELLED';

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

export type ExpenseCategory = 'FLIGHT' | 'HOTEL' | 'MEALS_PER_DIEM' | 'TRANSIT' | 'MISC';

export type RevisionTarget = 'MANAGER' | 'EMPLOYEE';

export interface TravelExpenseItem {
  id?: string;
  category: ExpenseCategory;
  merchant: string;
  amount: number;
  expenseDate: string;
  receiptImageUrl?: string | null;
  notes?: string | null;
}

export interface TravelTimelineEvent {
  id: string;
  travelRequestId?: string;
  actorId?: string;
  actorRole: TravelRole;
  actorName?: string;
  eventType: string;
  fromStatus?: string | null;
  toStatus: string;
  remarks?: string | null;
  createdAt: string;
}

export interface TravelRequest {
  id: string;
  userId: string;
  managerId?: string | null;
  adminId?: string | null;
  travelType: TravelType;
  title: string;
  purpose: string;
  projectCode: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  supportingDocUrl?: string | null;
  totalExpenses: number;
  status: TravelStatus;
  revisionTarget?: RevisionTarget | null;
  managerRemarks?: string | null;
  managerReviewedAt?: string | null;
  adminRemarks?: string | null;
  adminReviewedAt?: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  // Joined details
  requesterName?: string;
  requesterEmail?: string;
  requesterDepartment?: string;
  managerName?: string;
  adminName?: string;
  expenses?: TravelExpenseItem[];
  timeline?: TravelTimelineEvent[];
}

export interface CreateTravelRequestInput {
  travelType: TravelType;
  title: string;
  purpose: string;
  projectCode: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  supportingDocUrl?: string | null;
  expenses: Array<{
    category: ExpenseCategory;
    merchant: string;
    amount: number;
    expenseDate: string;
    receiptImageUrl?: string | null;
    notes?: string | null;
  }>;
  currency?: string;
}

export interface ManagerReviewInput {
  action: 'APPROVE' | 'APPROVE_AND_FORWARD' | 'REVISE' | 'REQUEST_REVISION' | 'REJECT';
  remarks?: string;
}

export interface AdminReviewInput {
  action: 'APPROVE' | 'SETTLE' | 'REVISE' | 'REQUEST_REVISION' | 'REJECT';
  remarks?: string;
  revisionTarget?: RevisionTarget;
  revision_target?: RevisionTarget;
  forceOverride?: boolean;
}

export interface ResubmitRequestInput {
  remarks?: string;
  employee_response_notes?: string;
  departureDate?: string;
  returnDate?: string;
  supportingDocUrl?: string;
  expenses?: Array<{
    category: ExpenseCategory;
    merchant: string;
    amount: number;
    expenseDate: string;
    receiptImageUrl?: string | null;
    notes?: string | null;
  }>;
}

export interface DepartmentBudget {
  id: string;
  department: string;
  fiscalYear: number;
  fiscalQuarter: string;
  totalAllocation: number;
  utilizedAmount: number;
  availableHeadroom: number;
  utilizationPercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}
