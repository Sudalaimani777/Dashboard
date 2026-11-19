// client/src/features/notifications/services/notifications.api.ts
import axios, { isAxiosError, type AxiosInstance } from 'axios';
import type { NotificationListResponse } from '../types/notification.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const notificationApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

class NotificationsApiService {
  private handleError(err: unknown, defaultMessage: string): never {
    if (isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined;
      const message = responseData?.message || err.message || defaultMessage;
      throw new Error(message);
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(defaultMessage);
  }

  async fetchNotifications(limit = 50, offset = 0): Promise<NotificationListResponse> {
    try {
      const res = await notificationApiClient.get<NotificationListResponse>('/notifications', {
        params: { limit, offset },
      });
      return res.data;
    } catch (err) {
      return this.handleError(err, 'Failed to fetch notifications');
    }
  }

  async markAsRead(id: string): Promise<boolean> {
    try {
      const res = await notificationApiClient.patch<{ success: boolean; marked: boolean }>(
        `/notifications/${id}/read`
      );
      return res.data.marked ?? res.data.success;
    } catch (err) {
      return this.handleError(err, `Failed to mark notification ${id} as read`);
    }
  }

  async markAllAsRead(): Promise<number> {
    try {
      const res = await notificationApiClient.patch<{ success: boolean; count: number }>(
        '/notifications/read-all'
      );
      return res.data.count ?? 0;
    } catch (err) {
      return this.handleError(err, 'Failed to mark all notifications as read');
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const res = await notificationApiClient.delete<{ success: boolean; deleted: boolean }>(
        `/notifications/${id}`
      );
      return res.data.deleted ?? res.data.success;
    } catch (err) {
      return this.handleError(err, `Failed to delete notification ${id}`);
    }
  }

  async deleteAllNotifications(): Promise<number> {
    try {
      const res = await notificationApiClient.delete<{ success: boolean; count: number }>(
        '/notifications/all'
      );
      return res.data.count ?? 0;
    } catch (err) {
      return this.handleError(err, 'Failed to delete all notifications');
    }
  }
}

export const notificationsApi = new NotificationsApiService();
