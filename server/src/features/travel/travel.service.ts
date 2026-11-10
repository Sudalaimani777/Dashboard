// server/src/features/travel/travel.service.ts
import { TravelRepository, CreateTravelRequestData } from './travel.repository.js';
import {
  TravelRequest,
  TravelRole,
  TravelStatus,
  TravelType,
  RevisionTarget,
  validateStatusTransition,
  canEmployeeModify
} from './travel.types.js';
import {
  validateCreateRequestPayload,
  validateManagerReviewPayload,
  validateAdminReviewPayload,
  validateResubmitPayload
} from './travel.validation.js';

export interface ManagerReviewOptions {
  action: 'APPROVE' | 'APPROVE_AND_FORWARD' | 'REVISE' | 'REQUEST_REVISION' | 'REJECT';
  remarks?: string;
}

export interface AdminReviewOptions {
  action: 'APPROVE' | 'SETTLE' | 'REVISE' | 'REQUEST_REVISION' | 'REJECT';
  remarks?: string;
  revisionTarget?: RevisionTarget;
  revision_target?: RevisionTarget;
  forceOverride?: boolean;
}

export interface EmployeeResubmitOptions {
  remarks?: string;
  employee_response_notes?: string;
  departureDate?: string;
  departure_date?: string;
  returnDate?: string;
  return_date?: string;
  supportingDocUrl?: string;
  supporting_doc_url?: string;
  expenses?: any[];
  updated_expenses?: any[];
}

export class TravelService {
  private repo: TravelRepository;

  constructor(repo?: TravelRepository) {
    this.repo = repo || new TravelRepository();
  }

  /**
   * Submits a new travel request with itemized expenses and receipt/quotation proofs.
   */
  async createRequest(userId: string, rawInput: any): Promise<TravelRequest> {
    // Normalize snake_case / camelCase for validation
    const normalizedValidation = {
      travel_type: rawInput.travel_type || rawInput.travelType,
      title: rawInput.title,
      purpose: rawInput.purpose,
      project_code: rawInput.project_code || rawInput.projectCode,
      origin: rawInput.origin,
      destination: rawInput.destination,
      departure_date: rawInput.departure_date || rawInput.departureDate,
      return_date: rawInput.return_date || rawInput.returnDate,
      emergency_contact_name: rawInput.emergency_contact_name || rawInput.emergencyContactName,
      emergency_contact_phone: rawInput.emergency_contact_phone || rawInput.emergencyContactPhone,
      supporting_doc_url: rawInput.supporting_doc_url || rawInput.supportingDocUrl,
      expenses: (rawInput.expenses || []).map((exp: any) => ({
        category: exp.category,
        merchant: exp.merchant,
        amount: Number(exp.amount),
        expense_date: exp.expense_date || exp.expenseDate,
        receipt_image_url: exp.receipt_image_url || exp.receiptImageUrl,
        notes: exp.notes
      }))
    };

    const { valid, errors } = validateCreateRequestPayload(normalizedValidation);
    if (!valid) {
      throw new Error(`Validation failed: ${errors?.join(', ')}`);
    }

    // Format for repository
    const repoPayload: CreateTravelRequestData = {
      userId,
      travelType: normalizedValidation.travel_type as TravelType,
      title: normalizedValidation.title,
      purpose: normalizedValidation.purpose,
      projectCode: normalizedValidation.project_code,
      origin: normalizedValidation.origin,
      destination: normalizedValidation.destination,
      departureDate: normalizedValidation.departure_date,
      returnDate: normalizedValidation.return_date,
      emergencyContactName: normalizedValidation.emergency_contact_name,
      emergencyContactPhone: normalizedValidation.emergency_contact_phone,
      supportingDocUrl: normalizedValidation.supporting_doc_url,
      expenses: normalizedValidation.expenses.map((e: any) => ({
        category: e.category,
        merchant: e.merchant,
        amount: e.amount,
        expenseDate: e.expense_date,
        receiptImageUrl: e.receipt_image_url,
        notes: e.notes
      })),
      currency: rawInput.currency || 'INR',
      status: 'PENDING_MANAGER_REVIEW'
    };

    return this.repo.createRequestWithExpenses(repoPayload);
  }

  /**
   * Fetches requests belonging to the authenticated user.
   */
  async getMyRequests(userId: string): Promise<TravelRequest[]> {
    return this.repo.findScopedRequests(userId, 'EMPLOYEE');
  }

  /**
   * Fetches a single travel request by ID with full itemized expenses and audit timeline.
   */
  async getRequestById(id: string, actorId?: string, actorRole?: TravelRole): Promise<TravelRequest> {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new Error('Travel request not found');
    }

    if (actorRole === 'EMPLOYEE' && actorId && request.userId !== actorId) {
      throw new Error('Access denied: You can only view your own travel requests');
    }

    return request;
  }

  /**
   * Role-scoped retrieval of travel requests.
   */
  async getScopedRequests(actorId: string, role: TravelRole, statusFilter?: TravelStatus): Promise<TravelRequest[]> {
    return this.repo.findScopedRequests(actorId, role, statusFilter);
  }

  /**
   * Tier 1 Manager audit queue.
   */
  async getManagerQueue(managerId?: string): Promise<TravelRequest[]> {
    return this.repo.getManagerQueue(managerId);
  }

  /**
   * Tier 2 Executive Admin governance queue.
   */
  async getAdminQueue(): Promise<TravelRequest[]> {
    return this.repo.getAdminQueue();
  }

  /**
   * Tier 1 Line Manager review action:
   * - APPROVE / APPROVE_AND_FORWARD: transitions to PENDING_ADMIN_APPROVAL
   * - REVISE / REQUEST_REVISION: transitions to REVISION_REQUESTED_BY_MANAGER
   * - REJECT: transitions to REJECTED
   */
  async managerReview(
    managerId: string,
    requestId: string,
    options: ManagerReviewOptions
  ): Promise<TravelRequest> {
    const request = await this.getRequestById(requestId);

    if (request.status !== 'PENDING_MANAGER_REVIEW') {
      throw new Error(`Cannot review request: current status is ${request.status}, expected PENDING_MANAGER_REVIEW`);
    }

    // Normalize action
    const normalizedAction =
      options.action === 'APPROVE' || options.action === 'APPROVE_AND_FORWARD'
        ? 'APPROVE_AND_FORWARD'
        : options.action === 'REVISE' || options.action === 'REQUEST_REVISION'
        ? 'REQUEST_REVISION'
        : 'REJECT';

    const validation = validateManagerReviewPayload({
      action: normalizedAction,
      remarks: options.remarks
    });

    if (!validation.valid) {
      throw new Error(`Manager review failed: ${validation.errors?.join(', ')}`);
    }

    let toStatus: TravelStatus;
    if (normalizedAction === 'APPROVE_AND_FORWARD') {
      toStatus = 'PENDING_ADMIN_APPROVAL';
    } else if (normalizedAction === 'REQUEST_REVISION') {
      toStatus = 'REVISION_REQUESTED_BY_MANAGER';
    } else {
      toStatus = 'REJECTED';
    }

    if (!validateStatusTransition(request.status, toStatus)) {
      throw new Error(`Invalid status transition from ${request.status} to ${toStatus}`);
    }

    return this.repo.updateStatusWithTimeline({
      requestId,
      actorId: managerId,
      actorRole: 'MANAGER',
      fromStatus: request.status,
      toStatus,
      remarks: options.remarks || null
    });
  }

  /**
   * Tier 2 Admin executive clearance & payout settlement:
   * - APPROVE:
   *     - UPCOMING -> APPROVED (cleared itinerary)
   *     - ALREADY_TRAVELLED -> SETTLED (disbursed reimbursement)
   *     - Validates and updates department budget headroom
   * - REVISE / REQUEST_REVISION:
   *     - Route A (target: MANAGER): REVISION_REQUESTED_BY_ADMIN_TO_MANAGER
   *     - Route B (target: EMPLOYEE): REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE
   * - REJECT: transitions to REJECTED
   */
  async adminReview(
    adminId: string,
    requestId: string,
    options: AdminReviewOptions
  ): Promise<TravelRequest> {
    const request = await this.getRequestById(requestId);

    if (request.status !== 'PENDING_ADMIN_APPROVAL') {
      throw new Error(`Cannot review request: current status is ${request.status}, expected PENDING_ADMIN_APPROVAL`);
    }

    const revisionTarget = options.revision_target || options.revisionTarget;
    const normalizedAction =
      options.action === 'APPROVE' || options.action === 'SETTLE'
        ? 'APPROVE'
        : options.action === 'REVISE' || options.action === 'REQUEST_REVISION'
        ? 'REQUEST_REVISION'
        : 'REJECT';

    const validation = validateAdminReviewPayload({
      action: normalizedAction,
      revision_target: revisionTarget,
      remarks: options.remarks
    });

    if (!validation.valid) {
      throw new Error(`Admin review failed: ${validation.errors?.join(', ')}`);
    }

    let toStatus: TravelStatus;

    if (normalizedAction === 'APPROVE') {
      toStatus = request.travelType === 'ALREADY_TRAVELLED' ? 'SETTLED' : 'APPROVED';

      // Check and update department budget headroom
      const dept = request.requesterDepartment || 'Engineering';
      const year = request.departureDate ? new Date(request.departureDate).getFullYear() : 2026;
      const quarter = this.getFiscalQuarter(request.departureDate ? new Date(request.departureDate) : new Date());

      const budget = await this.repo.getDepartmentBudget(dept, year, quarter);
      if (budget) {
        const headroom =
          budget.available_headroom !== undefined
            ? budget.available_headroom
            : (budget as any).availableHeadroom !== undefined
            ? (budget as any).availableHeadroom
            : Number(budget.total_allocation) - Number(budget.utilized_amount);

        const totalExpenses = Number(request.totalExpenses ?? request.total_expenses ?? 0);

        if (headroom < totalExpenses && !options.forceOverride) {
          throw new Error(
            `Department budget exceeded: insufficient headroom for approval (Available: ₹${headroom}, Required: ₹${totalExpenses}). Provide forceOverride: true to bypass.`
          );
        }
        await this.repo.updateBudgetUtilization(dept, year, quarter, totalExpenses);
      }
    } else if (normalizedAction === 'REQUEST_REVISION') {
      if (revisionTarget === 'MANAGER') {
        toStatus = 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER';
      } else {
        toStatus = 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE';
      }
    } else {
      toStatus = 'REJECTED';
    }

    if (!validateStatusTransition(request.status, toStatus)) {
      throw new Error(`Invalid status transition from ${request.status} to ${toStatus}`);
    }

    return this.repo.updateStatusWithTimeline({
      requestId,
      actorId: adminId,
      actorRole: 'ADMIN',
      fromStatus: request.status,
      toStatus,
      remarks: options.remarks || null,
      revisionTarget: revisionTarget || null
    });
  }

  /**
   * Resubmission handler for Employee when revisions are requested.
   * INVARIANT: Regardless of whether Admin requested revision via Route A or Route B,
   * employee resubmission strictly transitions to PENDING_MANAGER_REVIEW.
   */
  async employeeResubmit(
    userId: string,
    requestId: string,
    options: EmployeeResubmitOptions
  ): Promise<TravelRequest> {
    const request = await this.getRequestById(requestId);

    if (request.userId !== userId) {
      throw new Error('Unauthorized: Only the creator can resubmit this travel request');
    }

    if (!canEmployeeModify(request.status)) {
      throw new Error(`Cannot modify request: current status is ${request.status}`);
    }

    const expensesList = options.updated_expenses || options.expenses;
    const remarks = options.employee_response_notes || options.remarks;

    // Validate resubmit payload
    const validation = validateResubmitPayload({
      employee_response_notes: remarks,
      updated_expenses: expensesList
    });

    if (!validation.valid) {
      throw new Error(`Resubmission validation failed: ${validation.errors?.join(', ')}`);
    }

    // Update expenses if new list provided
    if (expensesList && Array.isArray(expensesList) && expensesList.length > 0) {
      const normalizedExpenses = expensesList.map((e) => ({
        category: e.category,
        merchant: e.merchant,
        amount: Number(e.amount),
        expenseDate: e.expense_date || e.expenseDate,
        receiptImageUrl: e.receipt_image_url || e.receiptImageUrl,
        notes: e.notes
      }));
      await this.repo.updateExpenses(requestId, normalizedExpenses);
    }

    // Mandatory Invariant: Resubmission strictly returns to PENDING_MANAGER_REVIEW
    const toStatus: TravelStatus = 'PENDING_MANAGER_REVIEW';

    if (!validateStatusTransition(request.status, toStatus)) {
      throw new Error(`Invalid transition from ${request.status} to ${toStatus}`);
    }

    await this.repo.updateStatusWithTimeline({
      requestId,
      actorId: userId,
      actorRole: 'EMPLOYEE',
      fromStatus: request.status,
      toStatus,
      remarks: remarks || 'Resubmitted after employee revisions'
    });

    return this.getRequestById(requestId);
  }

  /**
   * Cancels a travel request if in a cancellable state.
   */
  async cancelRequest(userId: string, requestId: string, remarks?: string): Promise<TravelRequest> {
    const request = await this.getRequestById(requestId);

    if (request.userId !== userId) {
      throw new Error('Unauthorized: Only the requester can cancel this travel request');
    }

    if (!validateStatusTransition(request.status, 'CANCELLED')) {
      throw new Error(`Cannot cancel request in status ${request.status}`);
    }

    return this.repo.updateStatusWithTimeline({
      requestId,
      actorId: userId,
      actorRole: 'EMPLOYEE',
      fromStatus: request.status,
      toStatus: 'CANCELLED',
      remarks: remarks || 'Cancelled by requester'
    });
  }

  /**
   * Department budget allocation and headroom.
   */
  async getDepartmentBudget(department: string, year = 2026, quarter = 'Q4') {
    return this.repo.getDepartmentBudget(department, year, quarter);
  }

  private getFiscalQuarter(date: Date): string {
    const month = date.getMonth() + 1; // 1-12
    if (month >= 1 && month <= 3) return 'Q1';
    if (month >= 4 && month <= 6) return 'Q2';
    if (month >= 7 && month <= 9) return 'Q3';
    return 'Q4';
  }
}
