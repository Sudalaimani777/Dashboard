// server/src/features/notifications/notification.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { sseRegistry } from './notificationStream.js';
import { notificationService, NotificationService } from './notification.service.js';

export class NotificationController {
  private service: NotificationService;

  constructor(service?: NotificationService) {
    this.service = service || notificationService;
  }

  stream = (req: AuthenticatedRequest, res: Response): void => {
    const userId = (req.user as any)?.id || req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    // Initial connected handshake event
    res.write('data: {"connected":true}\n\n');

    sseRegistry.addClient(userId, res);

    req.on('close', () => {
      sseRegistry.removeClient(userId, res);
    });
  };

  list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = (req.user as any)?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;

      const result = await this.service.getUserNotifications(userId, limit, offset);

      res.status(200).json({
        success: true,
        notifications: result.notifications,
        unreadCount: result.unreadCount,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  markRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = (req.user as any)?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id);
      const marked = await this.service.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        marked,
        data: { marked }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  markAllRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = (req.user as any)?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const count = await this.service.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        count,
        data: { count }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = (req.user as any)?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = String(req.params.id);
      const deleted = await this.service.deleteNotification(id, userId);

      res.status(200).json({
        success: true,
        deleted,
        data: { deleted }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  deleteAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = (req.user as any)?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const count = await this.service.deleteAllNotifications(userId);

      res.status(200).json({
        success: true,
        count,
        data: { count }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

export const notificationController = new NotificationController();
