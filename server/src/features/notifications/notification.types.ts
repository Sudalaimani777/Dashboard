// server/src/features/notifications/notification.types.ts

export type NotificationType =
  | 'TRAVEL_SUBMITTED'
  | 'FORWARDED_TO_ADMIN'
  | 'REVISION_REQUESTED'
  | 'RESUBMITTED'
  | 'TRAVEL_APPROVED'
  | 'TRAVEL_SETTLED'
  | 'TRAVEL_REJECTED'
  | 'MANAGER_OVERSIGHT';

export interface Notification {
  id: string;
  userId: string;
  actorId: string | null;
  requestId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  actorId?: string | null;
  requestId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  isRead?: boolean;
}

export interface NotificationListResult {
  notifications: Notification[];
  unreadCount: number;
}
