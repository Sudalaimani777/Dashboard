// server/src/features/travel/travel.service.ts
import crypto from 'node:crypto';
import { TravelRepository, CreateTravelRequestData } from './travel.repository.js';
import {
  TravelRequest,
  TravelRole,
  TravelStatus,
  TravelType,
  RevisionTarget,
  SupportingDoc,
  validateStatusTransition,
  canEmployeeModify
} from './travel.types.js';
import { cloudinaryService } from '../../shared/services/cloudinary.service.js';
import { fileSecurityService } from '../../shared/services/fileSecurity.service.js';
import {
  validateCreateRequestPayload,
  validateManagerReviewPayload,
  validateAdminReviewPayload,
  validateResubmitPayload,
  validateUpsertBudgetPayload
} from './travel.validation.js';
import { pool } from '../../shared/db/pool.js';
import { notificationService } from '../notifications/notification.service.js';

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
  isDraft?: boolean;
  is_draft?: boolean;
  title?: string;
  purpose?: string;
  projectCode?: string;
  project_code?: string;
  origin?: string;
  destination?: string;
  departureDate?: string;
  departure_date?: string;
  returnDate?: string;
  return_date?: string;
  supportingDocUrl?: string;
  supporting_doc_url?: string;
  supportingDocs?: SupportingDoc[];
  supporting_docs?: SupportingDoc[];
  emergencyContactName?: string;
  emergency_contact_name?: string;
  emergencyContactPhone?: string;
  emergency_contact_phone?: string;
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
      supporting_docs: rawInput.supporting_docs || rawInput.supportingDocs || (
        (rawInput.supporting_doc_url || rawInput.supportingDocUrl) ? [{
          id: 'initial-1',
          type: 'LINK',
          name: 'Primary Proof',
          url: rawInput.supporting_doc_url || rawInput.supportingDocUrl,
        }] : []
      ),
      expenses: (rawInput.expenses || []).map((exp: any) => ({
        category: exp.category,
        merchant: exp.merchant,
        amount: Number(exp.amount),
        originalCurrency: exp.originalCurrency || exp.original_currency || exp.currency || 'INR',
        originalAmount: Number(exp.originalAmount ?? exp.original_amount ?? exp.amount) || 0,
        exchangeRate: Number(exp.exchangeRate ?? exp.exchange_rate ?? 1.0),
        inrAmount: Number(exp.inrAmount ?? exp.inr_amount ?? exp.amount) || 0,
        expense_date: exp.expense_date || exp.expenseDate,
        receipt_image_url: exp.receipt_image_url || exp.receiptImageUrl,
        notes: exp.notes
      }))
    };

    const isDraft = Boolean(rawInput.isDraft || rawInput.is_draft || rawInput.status === 'DRAFT');

    if (!isDraft) {
      const { valid, errors } = validateCreateRequestPayload(normalizedValidation);
      if (!valid) {
        throw new Error(`Validation failed: ${errors?.join(', ')}`);
      }
    } else {
      if (!normalizedValidation.title || String(normalizedValidation.title).trim().length < 2) {
        throw new Error('Title is required to save a travel draft.');
      }
    }

    // Fetch requester profile for role & reporting hierarchy
    const userRes = await pool.query(
      'SELECT id, name, email, role, manager_id, reporting_admin_id FROM users WHERE id = $1',
      [userId]
    );
    const requester = userRes.rows[0];
    const isManager = requester?.role === 'MANAGER';

    // Option A: Manager personal trips start directly in PENDING_ADMIN_APPROVAL (bypasses redundant Tier 1 self-review)
    const initialStatus: TravelStatus = isDraft
      ? 'DRAFT'
      : isManager
      ? 'PENDING_ADMIN_APPROVAL'
      : 'PENDING_MANAGER_REVIEW';

    const assignedAdminId = isManager && requester?.reporting_admin_id ? requester.reporting_admin_id : null;

    // Format for repository
    const repoPayload: CreateTravelRequestData = {
      userId,
      adminId: assignedAdminId,
      travelType: (normalizedValidation.travel_type as TravelType) || 'UPCOMING',
      title: normalizedValidation.title,
      purpose: normalizedValidation.purpose || 'Travel draft',
      projectCode: normalizedValidation.project_code || 'ENG-2026',
      origin: normalizedValidation.origin || 'TBD',
      destination: normalizedValidation.destination || 'TBD',
      departureDate: normalizedValidation.departure_date || new Date().toISOString().split('T')[0],
      returnDate: normalizedValidation.return_date || new Date().toISOString().split('T')[0],
      emergencyContactName: normalizedValidation.emergency_contact_name,
      emergencyContactPhone: normalizedValidation.emergency_contact_phone,
      supportingDocUrl: normalizedValidation.supporting_doc_url || normalizedValidation.supporting_docs?.[0]?.url,
      supportingDocs: normalizedValidation.supporting_docs,
      expenses: normalizedValidation.expenses.map((e: any) => ({
        category: e.category || 'MISC',
        merchant: e.merchant || 'Pending',
        amount: Number(e.amount) || 0,
        originalCurrency: e.originalCurrency || 'INR',
        originalAmount: Number(e.originalAmount ?? e.amount) || 0,
        exchangeRate: Number(e.exchangeRate ?? 1.0),
        inrAmount: Number(e.inrAmount ?? e.amount) || 0,
        expenseDate: e.expense_date || new Date().toISOString().split('T')[0],
        receiptImageUrl: e.receipt_image_url,
        notes: e.notes
      })),
      currency: rawInput.currency || 'INR',
      status: initialStatus
    };

    const created = await this.repo.createRequestWithExpenses(repoPayload);

    // Transactional Notification Dispatch
    if (created.status !== 'DRAFT') {
      try {
        if (isManager) {
          if (requester?.reporting_admin_id) {
            // Targeted executive oversight notification to assigned Reporting Admin
            const adminRes = await pool.query(
              'SELECT id, name, email FROM users WHERE id = $1',
              [requester.reporting_admin_id]
            );
            if (adminRes.rows.length > 0) {
              const admin = adminRes.rows[0];
              await notificationService.notify({
                userId: admin.id,
                actorId: userId,
                requestId: created.id,
                type: 'MANAGER_OVERSIGHT',
                title: 'Executive Oversight: Manager Travel Request',
                message: `${requester.name} submitted a personal travel request: "${created.title}"`,
                linkUrl: '/dashboard?tab=notifications',
                recipientEmail: admin.email,
                recipientName: admin.name,
                emailType: 'MANAGER_OVERSIGHT',
                emailData: { managerName: requester.name, trip: created }
              });
            }
          } else {
            // Fallback: notify all active admins if manager has no assigned reporting admin
            const adminRes = await pool.query(
              "SELECT id, name, email FROM users WHERE role = 'ADMIN' AND (is_active IS NULL OR is_active = TRUE)"
            );
            for (const admin of adminRes.rows) {
              await notificationService.notify({
                userId: admin.id,
                actorId: userId,
                requestId: created.id,
                type: 'MANAGER_OVERSIGHT',
                title: 'Executive Oversight: Manager Travel Request',
                message: `${requester.name} submitted a personal travel request: "${created.title}"`,
                linkUrl: '/dashboard?tab=notifications',
                recipientEmail: admin.email,
                recipientName: admin.name,
                emailType: 'MANAGER_OVERSIGHT',
                emailData: { managerName: requester.name, trip: created }
              });
            }
          }
        } else if (requester?.manager_id) {
          // Employee travel request: notify line manager
          const mgrRes = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [requester.manager_id]
          );
          if (mgrRes.rows.length > 0) {
            const manager = mgrRes.rows[0];
            await notificationService.notify({
              userId: manager.id,
              actorId: userId,
              requestId: created.id,
              type: 'TRAVEL_SUBMITTED',
              title: 'New Travel Request Submitted',
              message: `${requester.name} submitted a new travel request: "${created.title}"`,
              linkUrl: '/dashboard?tab=notifications',
              recipientEmail: manager.email,
              recipientName: manager.name,
              emailType: 'TRAVEL_SUBMITTED',
              emailData: { requesterName: requester.name, trip: created }
            });
          }
        }
      } catch (notifErr: any) {
        console.warn('⚠️ [TravelService] Failed to dispatch submission notification:', notifErr?.message || notifErr);
      }
    }

    return created;
  }

  /**
   * Fetches requests belonging to the authenticated user.
   */
  async getMyRequests(userId: string, statusFilter?: TravelStatus): Promise<TravelRequest[]> {
    return this.repo.findScopedRequests(userId, 'EMPLOYEE', statusFilter);
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

    if (actorRole === 'MANAGER' && actorId && request.userId !== actorId) {
      const assignedManagerId = request.managerId || (request as any).manager_id;
      if (assignedManagerId && assignedManagerId !== actorId) {
        throw new Error('Access denied: You can only view travel requests for your direct reports');
      }
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
  async getAdminQueue(adminId?: string, scope: 'assigned' | 'all' = 'all'): Promise<TravelRequest[]> {
    return this.repo.getAdminQueue(adminId, scope);
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
    options: ManagerReviewOptions,
    actorRole: TravelRole = 'MANAGER'
  ): Promise<TravelRequest> {
    const request = await this.getRequestById(requestId);

    const requestOwnerId = request.userId || request.user_id;
    if (requestOwnerId && requestOwnerId === managerId) {
      throw new Error('Self-review blocked: Managers cannot audit or approve their own personal travel requests');
    }

    const assignedManagerId = request.managerId || (request as any).manager_id;
    if (assignedManagerId && assignedManagerId !== managerId && actorRole !== 'ADMIN') {
      throw new Error('Forbidden: You are not authorized to audit travel requests outside your reporting line');
    }

    if ((request.requesterRole === 'MANAGER' || (request as any).requester_role === 'MANAGER') && actorRole !== 'ADMIN') {
      throw new Error('Forbidden: Manager personal trips require executive approval from an Administrator');
    }

    // For valid UUIDs, verify against user directory in DB
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestOwnerId || '');
    if (isUuid && actorRole !== 'ADMIN') {
      const userRes = await pool.query('SELECT role, manager_id FROM users WHERE id = $1', [requestOwnerId]);
      const requester = userRes.rows[0];
      if (requester?.role === 'MANAGER') {
        throw new Error('Forbidden: Manager personal trips require executive approval from an Administrator');
      }
      const directManagerId = assignedManagerId || requester?.manager_id;
      if (!directManagerId || directManagerId !== managerId) {
        throw new Error('Forbidden: You are not authorized to audit travel requests outside your reporting line');
      }
    }

    const reviewableStatuses: TravelStatus[] = ['PENDING_MANAGER_REVIEW', 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER'];
    if (!reviewableStatuses.includes(request.status)) {
      throw new Error(`Cannot review request: current status is ${request.status}, expected one of: ${reviewableStatuses.join(', ')}`);
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

    const isManagerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(managerId || '');
    let manager: any = null;
    if (isManagerUuid) {
      const mgrRes = await pool.query(
        'SELECT id, name, email, reporting_admin_id FROM users WHERE id = $1',
        [managerId]
      );
      manager = mgrRes.rows[0];
    }

    const assignedAdminId =
      normalizedAction === 'APPROVE_AND_FORWARD' && manager?.reporting_admin_id
        ? manager.reporting_admin_id
        : null;

    const updated = await this.repo.updateStatusWithTimeline({
      requestId,
      actorId: managerId,
      actorRole: 'MANAGER',
      fromStatus: request.status,
      toStatus,
      remarks: options.remarks || null,
      adminId: assignedAdminId,
    });

    // Transactional Notification Dispatch
    try {
      const reqUserRes = await pool.query(
        'SELECT id, name, email, manager_id FROM users WHERE id = $1',
        [request.userId || (request as any).user_id]
      );
      const requester = reqUserRes.rows[0];

      if (normalizedAction === 'APPROVE_AND_FORWARD') {
        // Transition Manager's card to FORWARDED_TO_ADMIN (marked read)
        await notificationService.notify({
          userId: managerId,
          actorId: managerId,
          requestId,
          type: 'FORWARDED_TO_ADMIN',
          title: 'Travel Request Forwarded to Executive Review',
          message: `You approved travel request "${request.title}" and forwarded it for executive review.`,
          linkUrl: '/dashboard?tab=notifications',
          isRead: true
        });

        if (manager?.reporting_admin_id) {
          // Targeted notification to Manager's assigned Reporting Admin
          const adminRes = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [manager.reporting_admin_id]
          );
          if (adminRes.rows.length > 0) {
            const admin = adminRes.rows[0];
            await notificationService.notify({
              userId: admin.id,
              actorId: managerId,
              requestId,
              type: 'TRAVEL_SUBMITTED',
              title: 'Travel Request Awaiting Executive Approval',
              message: `Manager ${manager?.name || 'Manager'} approved travel request "${request.title}" and forwarded it for executive review`,
              linkUrl: '/dashboard?tab=notifications',
              recipientEmail: admin.email,
              recipientName: admin.name,
              emailType: 'TRAVEL_SUBMITTED',
              emailData: { requesterName: requester?.name || 'Employee', trip: updated }
            });
          }
        } else {
          // Manager approved: notify all active Admins (fallback)
          const adminRes = await pool.query(
            "SELECT id, name, email FROM users WHERE role = 'ADMIN' AND (is_active IS NULL OR is_active = TRUE)"
          );
          for (const admin of adminRes.rows) {
            await notificationService.notify({
              userId: admin.id,
              actorId: managerId,
              requestId,
              type: 'TRAVEL_SUBMITTED',
              title: 'Travel Request Awaiting Executive Approval',
              message: `Manager ${manager?.name || 'Manager'} approved travel request "${request.title}" and forwarded it for executive review`,
              linkUrl: '/dashboard?tab=notifications',
              recipientEmail: admin.email,
              recipientName: admin.name,
              emailType: 'TRAVEL_SUBMITTED',
              emailData: { requesterName: requester?.name || 'Employee', trip: updated }
            });
          }
        }
      } else if (normalizedAction === 'REQUEST_REVISION') {
        // Manager's own card transitions to REVISION_REQUESTED (marked read)
        await notificationService.notify({
          userId: managerId,
          actorId: managerId,
          requestId,
          type: 'REVISION_REQUESTED',
          title: 'Revisions Requested from Employee',
          message: `You requested revisions on "${request.title}": ${options.remarks || 'Pending employee update'}`,
          linkUrl: '/dashboard?tab=notifications',
          isRead: true
        });

        if (requester) {
          await notificationService.notify({
            userId: requester.id,
            actorId: managerId,
            requestId,
            type: 'REVISION_REQUESTED',
            title: 'Action Required: Revisions Requested',
            message: `Manager requested revisions on "${request.title}": ${options.remarks || 'Please update your request.'}`,
            linkUrl: '/dashboard?tab=notifications',
            recipientEmail: requester.email,
            recipientName: requester.name,
            emailType: 'REVISION_REQUESTED',
            emailData: { actorName: manager?.name || 'Manager', remarks: options.remarks || '', trip: updated }
          });
        }
      } else if (normalizedAction === 'REJECT') {
        // Manager's own card transitions to TRAVEL_REJECTED (marked read)
        await notificationService.notify({
          userId: managerId,
          actorId: managerId,
          requestId,
          type: 'TRAVEL_REJECTED',
          title: 'Travel Request Rejected',
          message: `You rejected travel request "${request.title}".`,
          linkUrl: '/dashboard?tab=notifications'
        });
        await pool.query(
          'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND request_id = $2',
          [managerId, requestId]
        );

        if (requester) {
          await notificationService.notify({
            userId: requester.id,
            actorId: managerId,
            requestId,
            type: 'TRAVEL_REJECTED',
            title: 'Travel Request Update',
            message: `Your travel request "${request.title}" was declined: ${options.remarks || 'Denied by manager.'}`,
            linkUrl: '/dashboard?tab=notifications',
            recipientEmail: requester.email,
            recipientName: requester.name,
            emailType: 'TRAVEL_REJECTED',
            emailData: { reason: options.remarks || '', trip: updated }
          });
        }
      }
    } catch (notifErr: any) {
      console.warn('⚠️ [TravelService] Failed to dispatch manager review notification:', notifErr?.message || notifErr);
    }

    return updated;
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
      const year = request.departureDate
        ? (parseInt(request.departureDate.split('-')[0], 10) || new Date(request.departureDate).getFullYear())
        : 2026;
      const quarter = this.getFiscalQuarter(request.departureDate || new Date());

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
      toStatus = 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE';
    } else {
      toStatus = 'REJECTED';
    }

    if (!validateStatusTransition(request.status, toStatus)) {
      throw new Error(`Invalid status transition from ${request.status} to ${toStatus}`);
    }

    const updated = await this.repo.updateStatusWithTimeline({
      requestId,
      actorId: adminId,
      actorRole: 'ADMIN',
      fromStatus: request.status,
      toStatus,
      remarks: options.remarks || null,
      revisionTarget: normalizedAction === 'REQUEST_REVISION' ? 'EMPLOYEE' : (revisionTarget || null)
    });

    // Transactional Notification Dispatch
    try {
      const adminRes = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [adminId]
      );
      const admin = adminRes.rows[0];

      const reqUserRes = await pool.query(
        'SELECT id, name, email, manager_id FROM users WHERE id = $1',
        [request.userId || (request as any).user_id]
      );
      const requester = reqUserRes.rows[0];

      if (normalizedAction === 'APPROVE') {
        if (request.travelType === 'UPCOMING') {
          // Notify requester
          if (requester) {
            await notificationService.notify({
              userId: requester.id,
              actorId: adminId,
              requestId,
              type: 'TRAVEL_APPROVED',
              title: 'Travel Request Approved',
              message: `Your travel request "${request.title}" has been approved.`,
              linkUrl: '/dashboard?tab=notifications',
              recipientEmail: requester.email,
              recipientName: requester.name,
              emailType: 'TRAVEL_APPROVED',
              emailData: { trip: updated }
            });
          }
          // Also notify requester's line manager if available
          if (requester?.manager_id) {
            const mgrRes = await pool.query(
              'SELECT id, name, email FROM users WHERE id = $1',
              [requester.manager_id]
            );
            if (mgrRes.rows.length > 0) {
              const mgr = mgrRes.rows[0];
              await notificationService.notify({
                userId: mgr.id,
                actorId: adminId,
                requestId,
                type: 'TRAVEL_APPROVED',
                title: 'Travel Request Approved',
                message: `Travel request "${request.title}" for ${requester.name} was approved by executive review.`,
                linkUrl: '/dashboard?tab=notifications',
                recipientEmail: mgr.email,
                recipientName: mgr.name,
                emailType: 'TRAVEL_APPROVED',
                emailData: { trip: updated }
              });
            }
          }
        } else {
          // ALREADY_TRAVELLED -> SETTLED
          if (requester) {
            await notificationService.notify({
              userId: requester.id,
              actorId: adminId,
              requestId,
              type: 'TRAVEL_SETTLED',
              title: 'Reimbursement Settled',
              message: `Your expense reimbursement for "${request.title}" has been settled.`,
              linkUrl: '/dashboard?tab=notifications',
              recipientEmail: requester.email,
              recipientName: requester.name,
              emailType: 'TRAVEL_SETTLED',
              emailData: { trip: updated }
            });
          }
        }
      } else if (normalizedAction === 'REQUEST_REVISION') {
        if (revisionTarget === 'MANAGER' && requester?.manager_id) {
          const mgrRes = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [requester.manager_id]
          );
          if (mgrRes.rows.length > 0) {
            const mgr = mgrRes.rows[0];
            await notificationService.notify({
              userId: mgr.id,
              actorId: adminId,
              requestId,
              type: 'REVISION_REQUESTED',
              title: 'Executive Admin Revisions Requested',
              message: `Executive admin requested revisions on "${request.title}": ${options.remarks || 'Please review.'}`,
              linkUrl: '/dashboard?tab=notifications',
              recipientEmail: mgr.email,
              recipientName: mgr.name,
              emailType: 'REVISION_REQUESTED',
              emailData: { actorName: admin?.name || 'Admin', remarks: options.remarks || '', trip: updated }
            });
          }
        } else if (requester) {
          await notificationService.notify({
            userId: requester.id,
            actorId: adminId,
            requestId,
            type: 'REVISION_REQUESTED',
            title: 'Action Required: Revisions Requested',
            message: `Executive admin requested revisions on "${request.title}": ${options.remarks || 'Please update your request.'}`,
            linkUrl: '/dashboard?tab=notifications',
            recipientEmail: requester.email,
            recipientName: requester.name,
            emailType: 'REVISION_REQUESTED',
            emailData: { actorName: admin?.name || 'Admin', remarks: options.remarks || '', trip: updated }
          });
        }
      } else if (normalizedAction === 'REJECT') {
        if (requester) {
          await notificationService.notify({
            userId: requester.id,
            actorId: adminId,
            requestId,
            type: 'TRAVEL_REJECTED',
            title: 'Travel Request Update',
            message: `Your travel request "${request.title}" was denied: ${options.remarks || 'Denied by executive review.'}`,
            linkUrl: '/dashboard?tab=notifications',
            recipientEmail: requester.email,
            recipientName: requester.name,
            emailType: 'TRAVEL_REJECTED',
            emailData: { reason: options.remarks || '', trip: updated }
          });
        }
      }
      // Transition Admin's own card for this trip to resolved/read
      if (normalizedAction === 'APPROVE') {
        const adminType = request.travelType === 'UPCOMING' ? 'TRAVEL_APPROVED' : 'TRAVEL_SETTLED';
        const adminTitle = request.travelType === 'UPCOMING' ? 'Travel Request Cleared' : 'Reimbursement Settled';
        await notificationService.notify({
          userId: adminId,
          actorId: adminId,
          requestId,
          type: adminType,
          title: adminTitle,
          message: `Executive approval complete for "${request.title}".`,
          linkUrl: '/dashboard?tab=notifications',
          isRead: true
        });
      } else if (normalizedAction === 'REQUEST_REVISION') {
        await notificationService.notify({
          userId: adminId,
          actorId: adminId,
          requestId,
          type: 'REVISION_REQUESTED',
          title: 'Executive Revisions Requested',
          message: `You requested revisions on "${request.title}".`,
          linkUrl: '/dashboard?tab=notifications',
          isRead: true
        });
      } else if (normalizedAction === 'REJECT') {
        await notificationService.notify({
          userId: adminId,
          actorId: adminId,
          requestId,
          type: 'TRAVEL_REJECTED',
          title: 'Travel Request Declined',
          message: `You declined "${request.title}".`,
          linkUrl: '/dashboard?tab=notifications',
          isRead: true
        });
      }
    } catch (notifErr: any) {
      console.warn('⚠️ [TravelService] Failed to dispatch admin review notification:', notifErr?.message || notifErr);
    }

    return updated;
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
    const keepAsDraft = request.status === 'DRAFT' && Boolean(options.isDraft || options.is_draft);

    if (!keepAsDraft) {
      // Validate resubmit payload
      const validation = validateResubmitPayload({
        employee_response_notes: remarks,
        updated_expenses: expensesList
      });

      if (!validation.valid) {
        throw new Error(`Resubmission validation failed: ${validation.errors?.join(', ')}`);
      }
    }

    // Update request metadata if provided
    await this.repo.updateRequestFields(requestId, {
      title: options.title,
      purpose: options.purpose,
      projectCode: options.project_code || options.projectCode,
      origin: options.origin,
      destination: options.destination,
      departureDate: options.departure_date || options.departureDate,
      returnDate: options.return_date || options.returnDate,
      supportingDocUrl: options.supporting_doc_url || options.supportingDocUrl || (options.supporting_docs || options.supportingDocs)?.[0]?.url,
      supportingDocs: options.supporting_docs || options.supportingDocs,
      emergencyContactName: options.emergency_contact_name || options.emergencyContactName,
      emergencyContactPhone: options.emergency_contact_phone || options.emergencyContactPhone,
    });

    // Update expenses if new list provided
    if (expensesList && Array.isArray(expensesList) && expensesList.length > 0) {
      const normalizedExpenses = expensesList.map((e) => ({
        category: e.category || 'MISC',
        merchant: e.merchant || 'Pending',
        amount: Number(e.amount) || 0,
        originalCurrency: ((e as any).originalCurrency || (e as any).original_currency || (e as any).currency || 'INR').toUpperCase().trim(),
        originalAmount: Number((e as any).originalAmount ?? (e as any).original_amount ?? e.amount) || 0,
        exchangeRate: Number((e as any).exchangeRate ?? (e as any).exchange_rate ?? 1.0),
        inrAmount: Number((e as any).inrAmount ?? (e as any).inr_amount ?? e.amount) || 0,
        expenseDate: e.expense_date || e.expenseDate || new Date().toISOString().split('T')[0],
        receiptImageUrl: e.receipt_image_url || e.receiptImageUrl,
        notes: e.notes
      }));
      await this.repo.updateExpenses(requestId, normalizedExpenses);
    }

    if (keepAsDraft) {
      return this.getRequestById(requestId);
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
      remarks: remarks || (request.status === 'DRAFT' ? 'Submitted travel request from draft' : 'Resubmitted after employee revisions')
    });

    const updated = await this.getRequestById(requestId);

    // Transactional Notification Dispatch
    try {
      const userRes = await pool.query(
        'SELECT id, name, email, manager_id FROM users WHERE id = $1',
        [userId]
      );
      const requester = userRes.rows[0];

      if (requester?.manager_id) {
        const mgrRes = await pool.query(
          'SELECT id, name, email FROM users WHERE id = $1',
          [requester.manager_id]
        );
        if (mgrRes.rows.length > 0) {
          const manager = mgrRes.rows[0];
          await notificationService.notify({
            userId: manager.id,
            actorId: userId,
            requestId,
            type: 'RESUBMITTED',
            title: 'Travel Request Resubmitted',
            message: `${requester.name} has resubmitted travel request: "${request.title}"`,
            linkUrl: '/dashboard?tab=notifications',
            recipientEmail: manager.email,
            recipientName: manager.name,
            emailType: 'TRAVEL_SUBMITTED',
            emailData: { requesterName: requester.name, trip: updated }
          });
        }
      }

      // Mark Employee's own card as resubmitted and read
      await pool.query(
        "UPDATE notifications SET type = 'RESUBMITTED', title = 'Travel Request Resubmitted', is_read = TRUE WHERE user_id = $1 AND request_id = $2",
        [userId, requestId]
      );
    } catch (notifErr: any) {
      console.warn('⚠️ [TravelService] Failed to dispatch resubmit notification:', notifErr?.message || notifErr);
    }

    return updated;
  }

  /**
   * Alias for employeeResubmit.
   */
  async resubmitRequest(
    userId: string,
    requestId: string,
    options: EmployeeResubmitOptions
  ): Promise<TravelRequest> {
    return this.employeeResubmit(userId, requestId, options);
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
    if (department && department.toUpperCase() === 'ALL') {
      const overview = await this.repo.getAllDepartmentBudgets({ year, quarter });
      const budgets = overview.budgets;
      let totalAllocation = 0;
      let utilizedAmount = 0;
      for (const b of budgets) {
        totalAllocation += Number(b.total_allocation || 0);
        utilizedAmount += Number(b.utilized_amount || 0);
      }
      const availableAmount = Math.max(0, totalAllocation - utilizedAmount);
      const utilizationPercentage = totalAllocation > 0 ? (utilizedAmount / totalAllocation) * 100 : 0;
      return {
        id: 'ALL',
        department: 'ALL',
        fiscal_year: year,
        fiscalYear: year,
        fiscal_quarter: quarter,
        fiscalQuarter: quarter,
        total_allocation: totalAllocation,
        totalAllocation,
        utilized_amount: utilizedAmount,
        utilizedAmount,
        available_headroom: availableAmount,
        availableAmount,
        utilization_percentage: utilizationPercentage,
        utilizationPercentage,
        categoryBreakdown: [],
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return this.repo.getDepartmentBudget(department, year, quarter);
  }

  /**
   * Lists all configured department budgets and known corporate departments.
   */
  async getBudgetOverview(year?: number, quarter?: string) {
    return this.repo.getAllDepartmentBudgets({ year, quarter });
  }

  /**
   * Creates or updates a quarterly department travel budget allocation.
   */
  async upsertDepartmentBudget(input: {
    department: string;
    fiscalYear?: number;
    fiscal_year?: number;
    fiscalQuarter?: string;
    fiscal_quarter?: string;
    totalAllocation?: number;
    total_allocation?: number;
  }) {
    const validation = validateUpsertBudgetPayload(input);
    if (!validation.valid) {
      throw new Error(`Budget validation failed: ${validation.errors?.join(', ')}`);
    }

    const department = input.department.trim();
    const fiscalYear = Number(input.fiscalYear ?? input.fiscal_year);
    const fiscalQuarter = String(input.fiscalQuarter ?? input.fiscal_quarter).toUpperCase();
    const totalAllocation = Number(input.totalAllocation ?? input.total_allocation);

    return this.repo.upsertDepartmentBudget({
      department,
      fiscalYear,
      fiscalQuarter,
      totalAllocation
    });
  }

  /**
   * Uploads an itinerary or quotation proof to Cloudinary and returns a SupportingDoc entity.
   */
  async uploadProof(file?: Express.Multer.File, userId?: string): Promise<SupportingDoc> {
    if (!file || !file.buffer || file.buffer.length === 0 || file.size === 0) {
      throw new Error('Uploaded file is empty (0 bytes). Please provide a valid file.');
    }

    // Comprehensive 5-layer security verification: Multer, file-type, sharp, pdfjs, ClamAV
    const verified = await fileSecurityService.verifyFile(file.buffer, {
      declaredFilename: file.originalname || 'proof-document.pdf',
      declaredMimeType: file.mimetype || 'application/pdf',
    });

    const uploadResult = await cloudinaryService.uploadBuffer(
      verified.sanitizedBuffer,
      file.originalname || 'proof-document.pdf',
      verified.verifiedMime
    );

    const doc: SupportingDoc = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'FILE',
      name: uploadResult.name,
      url: uploadResult.url,
      previewUrl: uploadResult.previewUrl,
      downloadUrl: uploadResult.downloadUrl,
      format: verified.verifiedExt || uploadResult.format,
      size: verified.metadata.sanitizedSize || uploadResult.size,
      uploadedAt: new Date().toISOString(),
    };

    return doc;
  }

  private getFiscalQuarter(dateOrStr: Date | string): string {
    if (typeof dateOrStr === 'string' && dateOrStr.includes('-')) {
      const parts = dateOrStr.split('-');
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        if (month >= 1 && month <= 3) return 'Q1';
        if (month >= 4 && month <= 6) return 'Q2';
        if (month >= 7 && month <= 9) return 'Q3';
        return 'Q4';
      }
    }
    const d = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
    const month = d.getMonth() + 1; // 1-12
    if (month >= 1 && month <= 3) return 'Q1';
    if (month >= 4 && month <= 6) return 'Q2';
    if (month >= 7 && month <= 9) return 'Q3';
    return 'Q4';
  }
}
