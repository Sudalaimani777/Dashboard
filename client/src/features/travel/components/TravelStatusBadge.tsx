import React from 'react';
import type { TravelStatus } from '../types/travel.types';

export interface StatusBadgeConfig {
  label: string;
  className: string;
  dotClassName: string;
}

export function getStatusBadgeConfig(status: TravelStatus): StatusBadgeConfig {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        className: 'border-border-warm bg-canvas text-muted',
        dotClassName: 'bg-muted',
      };
    case 'PENDING_MANAGER_REVIEW':
      return {
        label: 'Pending Manager Review',
        className: 'border-amber-200 bg-amber-50/80 text-amber-800',
        dotClassName: 'bg-amber-500',
      };
    case 'REVISION_REQUESTED_BY_MANAGER':
      return {
        label: 'Revision Required (Manager)',
        className: 'border-rose-200 bg-rose-50/80 text-rose-800',
        dotClassName: 'bg-rose-500',
      };
    case 'PENDING_ADMIN_APPROVAL':
      return {
        label: 'Pending Admin Clearance',
        className: 'border-sky-200 bg-sky-50/80 text-sky-800',
        dotClassName: 'bg-sky-500',
      };
    case 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER':
      return {
        label: 'Admin Revision (via Manager)',
        className: 'border-rose-200 bg-rose-50/80 text-rose-800',
        dotClassName: 'bg-rose-500',
      };
    case 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE':
      return {
        label: 'Admin Revision (Direct)',
        className: 'border-rose-200 bg-rose-50/80 text-rose-800',
        dotClassName: 'bg-rose-500',
      };
    case 'APPROVED':
      return {
        label: 'Approved',
        className: 'border-emerald-200 bg-emerald-50/80 text-emerald-800',
        dotClassName: 'bg-emerald-500',
      };
    case 'SETTLED':
      return {
        label: 'Settled (Paid)',
        className: 'border-emerald-200 bg-emerald-50/80 text-emerald-800',
        dotClassName: 'bg-emerald-600',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'border-stone-200 bg-stone-100 text-stone-700',
        dotClassName: 'bg-stone-500',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'border-stone-200 bg-stone-100 text-stone-600',
        dotClassName: 'bg-stone-400',
      };
    default:
      return {
        label: status,
        className: 'border-border-warm bg-canvas text-muted',
        dotClassName: 'bg-muted',
      };
  }
}

export interface TravelStatusBadgeProps {
  status: TravelStatus;
  size?: 'sm' | 'md';
}

export const TravelStatusBadge: React.FC<TravelStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const { label, className } = getStatusBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium tracking-tight whitespace-nowrap transition-colors ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${className}`}
    >
      {label}
    </span>
  );
};
