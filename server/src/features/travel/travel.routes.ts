// server/src/features/travel/travel.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { travelController } from './travel.controller.js';

export const travelRoutes = Router();

// 1. Core Request CRUD & Scoped Queries
travelRoutes.post('/requests', requireAuth, travelController.createRequest);
travelRoutes.get('/requests', requireAuth, travelController.getRequests);
travelRoutes.get('/requests/:id', requireAuth, travelController.getRequestById);

// 2. Lifecycle & Review Actions
travelRoutes.post(
  '/requests/:id/manager-review',
  requireAuth,
  requireRole(['MANAGER', 'ADMIN']),
  travelController.managerReview
);

travelRoutes.post(
  '/requests/:id/admin-review',
  requireAuth,
  requireRole(['ADMIN']),
  travelController.adminReview
);

travelRoutes.post('/requests/:id/resubmit', requireAuth, travelController.employeeResubmit);
travelRoutes.post('/requests/:id/cancel', requireAuth, travelController.cancelRequest);

// 3. Governance & Audit Queues
travelRoutes.get(
  '/manager-queue',
  requireAuth,
  requireRole(['MANAGER', 'ADMIN']),
  travelController.getManagerQueue
);

travelRoutes.get(
  '/admin-queue',
  requireAuth,
  requireRole(['ADMIN']),
  travelController.getAdminQueue
);

// 4. Financial & Budget Headroom
travelRoutes.get('/budgets', requireAuth, travelController.getDepartmentBudget);
