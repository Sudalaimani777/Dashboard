import React from 'react';
import { History } from 'lucide-react';
import type { TravelTimelineEvent } from '../../types/travel.types';

export interface AuditTimelineLogProps {
  timeline?: TravelTimelineEvent[];
}

export const AuditTimelineLog: React.FC<AuditTimelineLogProps> = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-4 shadow-xs">
      <h3 className="text-sm font-semibold text-ink flex items-center gap-2 border-b border-border-warm pb-3">
        <History className="size-4 text-primary" /> Audit Ledger & Event History
      </h3>

      <div className="relative pl-3 flex flex-col gap-4 border-l-2 border-border-warm ml-2">
        {timeline.map((event, idx) => {
          const rawStatus = event.toStatus || event.to_status || event.eventType || event.event_type || 'STATUS_UPDATE';
          const formattedStatus = String(rawStatus).replace(/_/g, ' ');
          const actorRole = event.actorRole || event.actor_role || 'SYSTEM';
          const actorName = event.actorName || event.actor_name;
          const rawDate = event.createdAt || event.created_at;
          const formattedDate = rawDate
            ? new Date(rawDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <div key={event.id || idx} className="relative pl-4 flex flex-col gap-1 text-xs">
              {/* Timeline node */}
              <span className="absolute -left-[19px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-primary/10" />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-subtle border border-border-warm text-muted">
                    {actorRole}
                  </span>
                  <span className="font-semibold text-ink">
                    {formattedStatus}
                  </span>
                  {actorName && (
                    <span className="text-[11px] text-faint">
                      ({actorName})
                    </span>
                  )}
                </div>
                {formattedDate && (
                  <span className="text-[10px] text-faint font-mono whitespace-nowrap">
                    {formattedDate}
                  </span>
                )}
              </div>

              {event.remarks && (
                <p className="text-[11px] text-muted italic bg-surface-subtle/60 p-2 rounded-lg border border-border-warm/60 mt-1">
                  "{event.remarks}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
