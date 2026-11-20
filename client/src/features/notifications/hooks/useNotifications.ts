// client/src/features/notifications/hooks/useNotifications.ts
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Notification } from '../types/notification.types';
import { notificationsApi } from '../services/notifications.api';
import { playNotificationChime } from '../../../shared/utils/audioChime';
import { useToast } from '../../../shared/context/ToastContext';
import { API_BASE_URL } from '../../../config/api';

export interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refresh: () => Promise<void>;
  hasActionRequired: boolean;
}

export const NotificationContext = createContext<UseNotificationsResult | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Derive unreadCount directly from notifications to guarantee single source of truth
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Safely retrieve toast context (works even if rendered without ToastProvider)
  const toastContext = useToast();
  const showToast = toastContext.showToast;

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await notificationsApi.fetchNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    let removedItem: Notification | undefined;
    setNotifications((prev) => {
      removedItem = prev.find((n) => n.id === id);
      return prev.filter((n) => n.id !== id);
    });

    try {
      await notificationsApi.deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      // Rollback on failure
      if (removedItem) {
        setNotifications((prev) => [removedItem!, ...prev]);
      }
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    const backup = [...notifications];
    setNotifications([]);
    try {
      await notificationsApi.deleteAllNotifications();
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      setNotifications(backup);
    }
  }, [notifications]);

  useEffect(() => {
    refresh();

    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const streamUrl = `${API_BASE_URL}/notifications/stream`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) {
          return;
        }

        const notif = data as Notification;

        // 1. Play gentle glass chime
        playNotificationChime();

        // 2. Spawn SwipeToast with 8s fuse
        if (showToast) {
          showToast({
            id: notif.id,
            title: notif.title,
            description: notif.message,
            type: notif.type,
            linkUrl: notif.linkUrl || '/dashboard?tab=notifications',
          });
        }

        // 3. Atomically update notifications list (unreadCount automatically derives cleanly)
        setNotifications((prev) => {
          const existingIndex = prev.findIndex((n) => n.id === notif.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = notif;
            return updated;
          }
          return [notif, ...prev];
        });
      } catch (err) {
        console.error('Error handling notification SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.debug('Notification SSE connection reconnecting:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [refresh, showToast]);

  const hasActionRequired = useMemo(() => {
    return notifications.some(
      (n) => !n.isRead && (n.type === 'REVISION_REQUESTED' || n.type === 'TRAVEL_SUBMITTED')
    );
  }, [notifications]);

  return React.createElement(
    NotificationContext.Provider,
    {
      value: {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        refresh,
        hasActionRequired,
      },
    },
    children
  );
};

export function useNotifications(): UseNotificationsResult {
  const ctx = useContext(NotificationContext);
  if (ctx) {
    return ctx;
  }

  // Graceful fallback for components rendered outside of NotificationProvider
  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    deleteNotification: async () => {},
    clearAllNotifications: async () => {},
    refresh: async () => {},
    hasActionRequired: false,
  };
}
