// server/src/features/notifications/notification.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { notificationController } from './notification.controller.js';

export const notificationRoutes = Router();

// SSE real-time stream
notificationRoutes.get('/stream', requireAuth, notificationController.stream);

// List user notifications and unread count
notificationRoutes.get('/', requireAuth, notificationController.list);

// Mark all as read
notificationRoutes.patch('/read-all', requireAuth, notificationController.markAllRead);

// Mark single notification as read
notificationRoutes.patch('/:id/read', requireAuth, notificationController.markRead);

// Delete all notifications for authenticated user
notificationRoutes.delete('/all', requireAuth, notificationController.deleteAll);

// Delete single notification
notificationRoutes.delete('/:id', requireAuth, notificationController.delete);
