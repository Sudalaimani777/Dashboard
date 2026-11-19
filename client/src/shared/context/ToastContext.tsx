import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import SwipeToast from '../components/toast/SwipeToast';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?:
    | 'TRAVEL_SUBMITTED'
    | 'FORWARDED_TO_ADMIN'
    | 'REVISION_REQUESTED'
    | 'TRAVEL_APPROVED'
    | 'TRAVEL_SETTLED'
    | 'TRAVEL_REJECTED'
    | 'MANAGER_OVERSIGHT'
    | 'USER_CREATED'
    | 'SUCCESS'
    | string;
  linkUrl?: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
}

export function getToastFuseColor(type?: string): string {
  switch (type) {
    case 'REVISION_REQUESTED':
      return '#F59E0B'; // Amber
    case 'TRAVEL_APPROVED':
    case 'TRAVEL_SETTLED':
    case 'USER_CREATED':
    case 'SUCCESS':
      return '#10B981'; // Emerald
    case 'TRAVEL_REJECTED':
      return '#EF4444'; // Destructive Red
    case 'FORWARDED_TO_ADMIN':
    case 'MANAGER_OVERSIGHT':
    case 'TRAVEL_SUBMITTED':
    default:
      return '#533AFD'; // Stripe brand primary
  }
}

export function getToastIcon(type?: string): React.ReactNode {
  switch (type) {
    case 'TRAVEL_APPROVED':
    case 'TRAVEL_SETTLED':
    case 'USER_CREATED':
    case 'SUCCESS':
      return <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />;
    case 'REVISION_REQUESTED':
      return <AlertTriangle size={18} className="text-amber-600 shrink-0" />;
    case 'TRAVEL_REJECTED':
      return <XCircle size={18} className="text-rose-600 shrink-0" />;
    case 'FORWARDED_TO_ADMIN':
    case 'MANAGER_OVERSIGHT':
      return <ShieldAlert size={18} className="text-[#533AFD] shrink-0" />;
    case 'TRAVEL_SUBMITTED':
    default:
      return <Clock size={18} className="text-[#533AFD] shrink-0" />;
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Safe navigation fallback (works even if rendered without React Router)
  let navigate: (url: string) => void;
  try {
    navigate = useNavigate();
  } catch {
    navigate = (url: string) => {
      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
    };
  }

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'> & { id?: string }) => {
    const id =
      toast.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    const newToast: Toast = {
      ...toast,
      id,
      linkUrl: toast.linkUrl || '/dashboard?tab=notifications',
      duration: toast.duration ?? 8000,
    };

    setToasts((prev) => {
      // Deduplicate by ID if already exists
      const filtered = prev.filter((t) => t.id !== id);
      return [...filtered, newToast];
    });

    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {toasts.map((toast, index) => (
        <SwipeToast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          icon={getToastIcon(toast.type)}
          duration={toast.duration ?? 8000}
          closeButton={true}
          pauseOnHover={true}
          swipeDistance={40}
          fuse="bottom"
          fuseColor={getToastFuseColor(toast.type)}
          background="#FFFFFF"
          color="#0F172A"
          style={{
            '--st-offset': `${24 + index * 92}px`,
          } as React.CSSProperties}
          onClick={() => {
            navigate(toast.linkUrl || '/dashboard?tab=notifications');
            dismissToast(toast.id);
          }}
          onClose={() => {
            dismissToast(toast.id);
          }}
        />
      ))}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toasts: [],
      showToast: () => '',
      dismissToast: () => {},
    };
  }
  return ctx;
}
