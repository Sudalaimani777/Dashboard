// server/src/features/notifications/notification.service.ts
import { pool } from '../../shared/db/pool.js';
import { notificationRepo, NotificationRepository } from './notification.repository.js';
import { sseRegistry, NotificationStreamRegistry } from './notificationStream.js';
import { emailService, EmailService } from '../../shared/services/email.service.js';
import {
  Notification,
  CreateNotificationInput,
  NotificationListResult,
  NotificationType
} from './notification.types.js';

export interface NotifyOptions extends CreateNotificationInput {
  recipientEmail?: string;
  recipientName?: string;
  emailType?: NotificationType | string;
  emailData?: any;
  awaitEmail?: boolean;
}

export class NotificationService {
  private repo: NotificationRepository;
  private sse: NotificationStreamRegistry;
  private email: EmailService;

  constructor(
    repo?: NotificationRepository,
    sse?: NotificationStreamRegistry,
    email?: EmailService
  ) {
    this.repo = repo || notificationRepo;
    this.sse = sse || sseRegistry;
    this.email = email || emailService;
  }

  /**
   * Unified notification dispatcher:
   * 1. Persists notification record to PostgreSQL
   * 2. Emits real-time event to SSE clients of that user
   * 3. Dispatches transactional email asynchronously if recipient email is available
   */
  async notify(input: NotifyOptions): Promise<Notification> {
    // 1. Persist notification row (stateful upsert by request_id)
    const notification = await this.repo.upsertByRequest({
      userId: input.userId,
      actorId: input.actorId,
      requestId: input.requestId,
      type: input.type,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl,
      isRead: input.isRead
    });

    // 2. Broadcast via Server-Sent Events to active user sessions
    try {
      this.sse.broadcastToUser(input.userId, notification);
    } catch (err: any) {
      console.warn(`⚠️ [NotificationService] SSE broadcast failed for user ${input.userId}:`, err?.message || err);
    }

    // 3. Dispatch transactional HTML email
    const emailPromise = this.handleEmailDispatch(input, notification);
    if (input.awaitEmail) {
      await emailPromise;
    }

    return notification;
  }

  private async handleEmailDispatch(
    input: NotifyOptions,
    notification: Notification
  ): Promise<void> {
    try {
      let recipientEmail = input.recipientEmail;
      let recipientName = input.recipientName;

      // If contact info not provided, safely lookup user email and name from DB
      if (!recipientEmail) {
        const userRes = await pool.query(
          'SELECT name, email FROM users WHERE id = $1',
          [input.userId]
        );
        if (userRes.rows.length > 0) {
          recipientEmail = userRes.rows[0].email;
          recipientName = recipientName || userRes.rows[0].name;
        }
      }

      if (!recipientEmail) {
        return;
      }

      const safeRecipientName = recipientName || 'User';
      const emailType = input.emailType || input.type;
      const data = input.emailData || {};

      switch (emailType) {
        case 'TRAVEL_SUBMITTED':
        case 'RESUBMITTED':
          await this.email.sendTravelSubmittedEmail(
            recipientEmail,
            safeRecipientName,
            data.requesterName || 'Employee',
            data.trip || { id: notification.requestId, title: notification.title }
          );
          break;

        case 'REVISION_REQUESTED':
          await this.email.sendRevisionRequestedEmail(
            recipientEmail,
            safeRecipientName,
            data.actorName || 'Reviewer',
            data.remarks || notification.message,
            data.trip || { id: notification.requestId, title: notification.title }
          );
          break;

        case 'TRAVEL_APPROVED':
          await this.email.sendTravelApprovedEmail(
            recipientEmail,
            safeRecipientName,
            data.trip || { id: notification.requestId, title: notification.title }
          );
          break;

        case 'TRAVEL_SETTLED':
          await this.email.sendTravelSettledEmail(
            recipientEmail,
            safeRecipientName,
            data.trip || { id: notification.requestId, title: notification.title }
          );
          break;

        case 'TRAVEL_REJECTED':
          await this.email.sendTravelRejectedEmail(
            recipientEmail,
            safeRecipientName,
            data.reason || data.remarks || notification.message,
            data.trip || { id: notification.requestId, title: notification.title }
          );
          break;

        case 'MANAGER_OVERSIGHT':
          await this.email.sendManagerOversightEmail(
            recipientEmail,
            safeRecipientName,
            data.managerName || 'Manager',
            data.trip || { id: notification.requestId, title: notification.title }
          );
          break;

        default:
          // Unknown email type, no email sent
          break;
      }
    } catch (err: any) {
      console.warn(`⚠️ [NotificationService] Email dispatch failed for user ${input.userId}:`, err?.message || err);
    }
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationListResult> {
    return this.repo.getByUserId(userId, limit, offset);
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    return this.repo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return this.repo.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    return this.repo.delete(id, userId);
  }

  async deleteAllNotifications(userId: string): Promise<number> {
    return this.repo.deleteAll(userId);
  }
}

export const notificationService = new NotificationService();
