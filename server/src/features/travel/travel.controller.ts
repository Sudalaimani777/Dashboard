// server/src/features/travel/travel.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';
import { TravelService } from './travel.service.js';
import { TravelRole, TravelStatus } from './travel.types.js';

export class TravelController {
  private service: TravelService;

  constructor(service?: TravelService) {
    this.service = service || new TravelService();
  }

  /**
   * POST /api/travel/requests
   * Submits a new travel request with itemized expenses and quotation/receipt proofs.
   */
  createRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }

      const request = await this.service.createRequest(userId, req.body);
      return sendSuccess(res, request, 'Travel request created successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  };

  /**
   * GET /api/travel/requests
   * Returns scoped requests based on caller's role (Employee: own, Manager: team, Admin: all).
   */
  getRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const role = (req.user?.role || 'EMPLOYEE') as TravelRole;
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }

      const statusFilter = req.query.status as TravelStatus | undefined;
      const isPersonal = req.query.scope === 'personal' || req.query.personal === 'true';

      const requests = isPersonal
        ? await this.service.getMyRequests(userId, statusFilter)
        : await this.service.getScopedRequests(userId, role, statusFilter);
      return sendSuccess(res, requests, 'Travel requests fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  };

  /**
   * GET /api/travel/requests/:id
   * Returns single travel request with itemized expenses and audit timeline.
   */
  getRequestById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const role = (req.user?.role || 'EMPLOYEE') as TravelRole;
      const id = String(req.params.id);

      const request = await this.service.getRequestById(id, userId, role);
      return sendSuccess(res, request, 'Travel request details fetched');
    } catch (err: any) {
      const statusCode = err.message.includes('not found') ? 404 : err.message.includes('Access denied') ? 403 : 400;
      return sendError(res, err.message, statusCode);
    }
  };

  /**
   * GET /api/travel/manager-queue
   * Returns requests pending Tier 1 Manager audit.
   */
  getManagerQueue = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      // Admins have org-wide oversight, whereas Managers see their direct reports & unassigned requests
      const targetManagerId = role === 'ADMIN' ? undefined : userId;
      const queue = await this.service.getManagerQueue(targetManagerId);
      return sendSuccess(res, queue, 'Manager review queue fetched');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  };

  /**
   * GET /api/travel/admin-queue
   * Returns requests pending Tier 2 Admin executive clearance / settlement.
   */
  getAdminQueue = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const queue = await this.service.getAdminQueue();
      return sendSuccess(res, queue, 'Admin governance queue fetched');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  };

  /**
   * POST /api/travel/requests/:id/manager-review
   * Tier 1 Line Manager review action: APPROVE, REVISE, REJECT.
   */
  managerReview = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const id = String(req.params.id);
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }

      const updated = await this.service.managerReview(userId, id, req.body);
      return sendSuccess(res, updated, 'Manager review action recorded');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  };

  /**
   * POST /api/travel/requests/:id/admin-review
   * Tier 2 Admin review action: APPROVE (clearance/settlement), REVISE (Route A / Route B), REJECT.
   */
  adminReview = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const id = String(req.params.id);
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }

      const updated = await this.service.adminReview(userId, id, req.body);
      return sendSuccess(res, updated, 'Admin review action recorded');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  };

  /**
   * POST /api/travel/requests/:id/resubmit
   * Resubmission by employee after alterations.
   * INVARIANT: strictly returns to PENDING_MANAGER_REVIEW.
   */
  employeeResubmit = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const id = String(req.params.id);
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }

      const updated = await this.service.employeeResubmit(userId, id, req.body);
      return sendSuccess(res, updated, 'Travel request resubmitted for manager re-verification');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  };

  /**
   * POST /api/travel/requests/:id/cancel
   * Cancels request by requester.
   */
  cancelRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const id = String(req.params.id);
      if (!userId) {
        return sendError(res, 'Authentication required', 401);
      }

      const cancelled = await this.service.cancelRequest(userId, id, req.body?.remarks);
      return sendSuccess(res, cancelled, 'Travel request cancelled successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  };

  /**
   * GET /api/travel/budgets
   * Retrieves department quarterly budget and available headroom.
   */
  getDepartmentBudget = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const department = (req.query.department as string) || req.user?.department || 'Engineering';
      const year = req.query.year ? Number(req.query.year) : 2026;
      const quarter = (req.query.quarter as string) || 'Q4';

      const budget = await this.service.getDepartmentBudget(department, year, quarter);
      if (!budget) {
        return sendError(res, `Budget not found for ${department} ${year} ${quarter}`, 404);
      }

      return sendSuccess(res, budget, 'Department budget fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  };
}

export const travelController = new TravelController();
