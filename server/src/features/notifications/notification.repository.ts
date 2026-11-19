// server/src/features/notifications/notification.repository.ts
import { pool } from '../../shared/db/pool.js';
import {
  Notification,
  CreateNotificationInput,
  NotificationListResult
} from './notification.types.js';

export class NotificationRepository {
  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      actorId: row.actor_id,
      requestId: row.request_id,
      type: row.type,
      title: row.title,
      message: row.message,
      linkUrl: row.link_url,
      isRead: row.is_read,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
    };
  }

  async create(input: CreateNotificationInput): Promise<Notification> {
    const linkUrl = input.linkUrl || '/dashboard?tab=notifications';
    const isRead = input.isRead ?? false;
    const query = `
      INSERT INTO notifications (
        user_id,
        actor_id,
        request_id,
        type,
        title,
        message,
        link_url,
        is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      input.userId,
      input.actorId ?? null,
      input.requestId ?? null,
      input.type,
      input.title,
      input.message,
      linkUrl,
      isRead
    ];

    const result = await pool.query(query, values);
    return this.mapRowToNotification(result.rows[0]);
  }

  async upsertByRequest(input: CreateNotificationInput): Promise<Notification> {
    const linkUrl = input.linkUrl || '/dashboard?tab=notifications';
    if (!input.requestId) {
      return this.create(input);
    }

    // Check for existing notification for this user & request
    const existing = await pool.query(
      'SELECT id FROM notifications WHERE user_id = $1 AND request_id = $2 ORDER BY created_at DESC',
      [input.userId, input.requestId]
    );

    if (existing.rows.length > 0) {
      const primaryId = existing.rows[0].id;
      // Prune legacy duplicates if any exist
      if (existing.rows.length > 1) {
        await pool.query(
          'DELETE FROM notifications WHERE user_id = $1 AND request_id = $2 AND id != $3',
          [input.userId, input.requestId, primaryId]
        );
      }

      const isRead = input.isRead ?? false;
      const updateQuery = `
        UPDATE notifications
        SET type = $1,
            title = $2,
            message = $3,
            actor_id = $4,
            link_url = $5,
            is_read = $6,
            created_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *;
      `;
      const res = await pool.query(updateQuery, [
        input.type,
        input.title,
        input.message,
        input.actorId ?? null,
        linkUrl,
        isRead,
        primaryId
      ]);
      return this.mapRowToNotification(res.rows[0]);
    }

    return this.create(input);
  }

  async getByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationListResult> {
    const listQuery = `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const listResult = await pool.query(listQuery, [userId, limit, offset]);

    const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE user_id = $1 AND is_read = FALSE;
    `;
    const countResult = await pool.query(countQuery, [userId]);
    const unreadCount = countResult.rows[0]?.count ?? 0;

    return {
      notifications: listResult.rows.map((row) => this.mapRowToNotification(row)),
      unreadCount
    };
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE;
    `;
    const result = await pool.query(query, [userId]);
    return result.rowCount ?? 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAll(userId: string): Promise<number> {
    const query = `
      DELETE FROM notifications
      WHERE user_id = $1;
    `;
    const result = await pool.query(query, [userId]);
    return result.rowCount ?? 0;
  }
}

export const notificationRepo = new NotificationRepository();
