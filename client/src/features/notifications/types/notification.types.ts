// client/src/features/notifications/types/notification.types.ts

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

export interface NotificationListResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}
