// client/src/features/notifications/pages/NotificationsHubPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  BellOff,
  CheckCheck,
  Check,
  ArrowRight,
  Bell,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { RubberSegment } from '../../../shared/components/ui/RubberSegment';
import type { Notification } from '../types/notification.types';

export type NotificationFilter = 'ALL' | 'UNREAD' | 'ACTION_REQUIRED';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'just now';
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

function getNotificationBadge(type: string): { label: string; className: string } {
  switch (type) {
    case 'TRAVEL_APPROVED':
      return { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'TRAVEL_SETTLED':
      return { label: 'Settled', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'REVISION_REQUESTED':
      return { label: 'Revision Requested', className: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'TRAVEL_REJECTED':
      return { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'MANAGER_OVERSIGHT':
      return { label: 'Manager Oversight', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'FORWARDED_TO_ADMIN':
      return { label: 'In Executive Review', className: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'RESUBMITTED':
      return { label: 'Resubmitted', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'TRAVEL_SUBMITTED':
    default:
      return { label: 'Pending Review', className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

function getNotificationIcon(type: string): React.ReactNode {
  switch (type) {
    case 'TRAVEL_APPROVED':
    case 'TRAVEL_SETTLED':
      return (
        <div className="size-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 className="size-5" />
        </div>
      );
    case 'REVISION_REQUESTED':
      return (
        <div className="size-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
          <AlertTriangle className="size-5" />
        </div>
      );
    case 'TRAVEL_REJECTED':
      return (
        <div className="size-9 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
          <XCircle className="size-5" />
        </div>
      );
    case 'MANAGER_OVERSIGHT':
      return (
        <div className="size-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-primary shrink-0">
          <ShieldAlert className="size-5" />
        </div>
      );
    case 'FORWARDED_TO_ADMIN':
      return (
        <div className="size-9 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
          <Clock className="size-5" />
        </div>
      );
    case 'TRAVEL_SUBMITTED':
    default:
      return (
        <div className="size-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
          <Clock className="size-5" />
        </div>
      );
  }
}

export const NotificationsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');

  const unreadItemsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const actionRequiredCount = useMemo(() => {
    return notifications.filter(
      (n) => !n.isRead && (n.type === 'REVISION_REQUESTED' || n.type === 'TRAVEL_SUBMITTED')
    ).length;
  }, [notifications]);

  const filterTabs = useMemo(
    () => [
      { id: 'ALL' as const, label: 'All', count: undefined, countType: 'default' as const },
      { id: 'UNREAD' as const, label: 'Unread', count: unreadItemsCount, countType: 'primary' as const },
      {
        id: 'ACTION_REQUIRED' as const,
        label: 'Action Required',
        count: actionRequiredCount,
        countType: 'amber' as const,
      },
    ],
    [unreadItemsCount, actionRequiredCount]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'UNREAD':
        return notifications.filter((n) => !n.isRead);
      case 'ACTION_REQUIRED':
        return notifications.filter(
          (n) => !n.isRead && (n.type === 'REVISION_REQUESTED' || n.type === 'TRAVEL_SUBMITTED')
        );
      case 'ALL':
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const handleOpenRequest = (n: Notification) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    if (n.requestId) {
      navigate(`/travel/requests/${n.requestId}`);
    } else if (n.linkUrl && n.linkUrl !== '/dashboard?tab=notifications') {
      navigate(n.linkUrl);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border-warm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Bell className="size-5" />
            </div>
            <h1 className="text-xl font-bold text-ink tracking-tight">Notifications Hub</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            Track governance decisions, revision requests, and clearance milestones in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              unreadCount > 0
                ? 'border-border-warm bg-surface text-ink hover:bg-surface-subtle shadow-xs active:scale-[0.98]'
                : 'border-border-warm/50 text-faint bg-surface-subtle/50 cursor-not-allowed opacity-60'
            }`}
          >
            <CheckCheck className="size-3.5 text-primary" />
            <span>Mark all as read</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Pills with RubberSegment */}
      <RubberSegment
        aria-label="Filter notifications"
        variant="surface"
        size="sm"
        value={activeFilter}
        onChange={(val) => setActiveFilter(val as NotificationFilter)}
        items={filterTabs.map((tab) => ({
          value: tab.id,
          label: tab.label,
          badge: tab.id !== 'ALL' && tab.count && tab.count > 0 ? tab.count : undefined,
        }))}
      />

      {/* 3. Notification List with Smooth Crossfades & Motion Layout */}
      <div className="space-y-3">
        {isLoading && notifications.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-border-warm rounded-2xl">
            <Loader2 className="size-6 text-primary mx-auto animate-spin mb-3" />
            <p className="text-xs text-muted">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-16 text-center bg-surface border border-border-warm rounded-2xl flex flex-col items-center justify-center"
          >
            <div className="size-12 rounded-2xl bg-surface-subtle border border-border-warm flex items-center justify-center text-muted mb-3">
              <BellOff className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-ink">All caught up</h3>
            <p className="text-xs text-muted mt-1 max-w-sm">
              {activeFilter === 'UNREAD'
                ? 'You have zero unread notifications.'
                : activeFilter === 'ACTION_REQUIRED'
                ? 'No actions or revisions are currently waiting for your input.'
                : "You're up to date on all travel governance milestones and alerts."}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredNotifications.map((n) => {
              const badge = getNotificationBadge(n.type);
              const isUnread = !n.isRead;
              const hasAction = n.type === 'REVISION_REQUESTED';

              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-xl border transition-all duration-150 gap-4 ${
                    isUnread
                      ? hasAction
                        ? 'bg-amber-50/20 border-amber-300 shadow-xs ring-1 ring-amber-400/20'
                        : 'bg-white border-primary/30 shadow-xs ring-1 ring-primary/10'
                      : 'bg-surface/80 border-border-warm/90 hover:border-border-warm hover:bg-surface'
                  }`}
                >
                  {/* Left: Event Icon + Body Content */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {getNotificationIcon(n.type)}

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                        >
                          {badge.label}
                        </span>

                        <span className="text-[11px] font-mono text-muted tabular-nums">
                          {formatRelativeTime(n.createdAt)}
                        </span>

                        {isUnread && (
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-ink tracking-tight">
                        {n.title}
                      </h4>

                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions CTA */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.id)}
                        className="p-1.5 rounded-lg border border-border-warm text-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check className="size-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteNotification(n.id)}
                      className="p-1.5 rounded-lg border border-border-warm text-muted hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/70 transition-colors cursor-pointer"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    {n.requestId && (
                      <button
                        type="button"
                        onClick={() => handleOpenRequest(n)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border-warm text-xs font-semibold text-ink hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer shadow-2xs group-hover:border-primary/40 active:scale-[0.98]"
                      >
                        <span>Open Travel Request</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default NotificationsHubPage;
