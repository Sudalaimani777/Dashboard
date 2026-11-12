import React from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileCheck2,
  GitMerge,
} from 'lucide-react';
import type { TravelRequest } from '../../types/travel.types';
import { TravelStatusBadge } from '../TravelStatusBadge';
import { RouteLabel } from '../shared/RouteLabel';
import { formatINR } from '../../utils/currency';
import { computeDraftReadiness } from '../../utils/travelAnalytics';

export const RecentActivityFeedCard: React.FC<{
  requests: TravelRequest[];
  onInspect: (req: TravelRequest) => void;
}> = ({ requests, onInspect }) => {
  const events = React.useMemo(() => {
    const items: Array<{
      key: string;
      request: TravelRequest;
      status: string;
      actorRole: string;
      remarks?: string | null;
      timestamp: number;
      dateLabel: string;
    }> = [];

    for (const req of requests) {
      for (const ev of req.timeline || []) {
        const rawDate = ev.createdAt || ev.created_at;
        const ts = rawDate ? new Date(rawDate).getTime() : 0;
        items.push({
          key: ev.id || `${req.id}-${ts}`,
          request: req,
          status: String(ev.toStatus || ev.to_status || ev.eventType || 'UPDATE').replace(/_/g, ' '),
          actorRole: String(ev.actorRole || ev.actor_role || 'SYSTEM'),
          remarks: ev.remarks,
          timestamp: ts,
          dateLabel: rawDate
            ? new Date(rawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : '',
        });
      }
    }

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [requests]);

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border-warm pb-3">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Activity className="size-4 text-primary" /> Recent Workflow Activity
        </h3>
        <span className="text-[11px] font-mono text-faint">{events.length} recent</span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-muted py-3 text-center">
          Approval updates, revision notes, and settlements will appear here.
        </p>
      ) : (
        <div className="divide-y divide-border-warm/80">
          {events.map((ev) => (
            <button
              key={ev.key}
              type="button"
              onClick={() => onInspect(ev.request)}
              className="w-full text-left py-2.5 px-2 -mx-2 first:pt-1 last:pb-1 rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink truncate">{ev.request.title}</span>
                <span className="text-[10px] font-mono text-faint shrink-0">{ev.dateLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="px-1.5 py-0.5 rounded-md bg-surface-subtle border border-border-warm text-[9px] font-semibold uppercase tracking-wide text-muted">
                  {ev.actorRole}
                </span>
                <span className="truncate">{ev.status}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const PolicyChecklistCard: React.FC<{ title?: string; items?: string[] }> = ({
  title = 'Travel Policy & Submission Guide',
  items = [
    'Attach a valid itinerary quote (Pre-Trip) or itemized receipt URL (Post-Trip).',
    'Match each expense row to Flight, Hotel, Meals, Transit, or Misc.',
    'Keep emergency contact details current before submitting for review.',
  ],
}) => (
  <div className="bg-surface-subtle/75 rounded-xl border border-border-warm p-4 flex flex-col gap-2.5">
    <h3 className="text-xs font-semibold text-ink flex items-center gap-2 border-b border-border-warm pb-2.5">
      <FileCheck2 className="size-4 text-primary" /> {title}
    </h3>
    <ul className="flex flex-col gap-2 text-xs text-muted">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 leading-relaxed">
          <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const RevisionWorkflowGuideCard: React.FC = () => (
  <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
    <h3 className="text-sm font-semibold text-ink flex items-center gap-2 border-b border-border-warm pb-3">
      <GitMerge className="size-4 text-primary" /> Resubmission Routing
    </h3>
    <div className="divide-y divide-border-warm/80 text-xs">
      {[
        { step: '01', title: 'Update & Explain', desc: 'Adjust quotes, receipts, or dates and add alteration notes.' },
        { step: '02', title: 'Line Manager Re-Audit', desc: 'All resubmissions return to your Manager first, even Admin-returned ones.' },
        { step: '03', title: 'Admin Clearance', desc: 'Final budget check and approval or reimbursement settlement.' },
      ].map((s) => (
        <div key={s.step} className="flex items-start gap-3 py-2.5 first:pt-1 last:pb-1">
          <span className="font-mono text-xs font-bold text-primary tabular-nums shrink-0 mt-0.5">
            {s.step}
          </span>
          <div>
            <p className="font-semibold text-ink">{s.title}</p>
            <p className="text-[11px] text-muted mt-0.5 leading-snug">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DraftReadinessSummaryCard: React.FC<{
  drafts: TravelRequest[];
  onResume: (req: TravelRequest) => void;
}> = ({ drafts, onResume }) => {
  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border-warm pb-3">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <FileCheck2 className="size-4 text-primary" /> Draft Readiness Breakdown
        </h3>
        <span className="text-[11px] font-mono font-bold text-primary tabular-nums">{drafts.length} saved</span>
      </div>

      {drafts.length === 0 ? (
        <p className="text-xs text-muted leading-relaxed">
          No drafts in progress. Save any new trip midway or clone a past trip on the left to start a draft.
        </p>
      ) : (
        <div className="divide-y divide-border-warm/80">
          {drafts.slice(0, 4).map((draft) => {
            const readiness = computeDraftReadiness(draft);
            return (
              <button
                key={draft.id}
                type="button"
                onClick={() => onResume(draft)}
                className="w-full text-left py-2.5 px-2 -mx-2 first:pt-1 last:pb-1 rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink truncate">{draft.title}</span>
                  <span className="text-[10px] font-mono font-bold text-primary tabular-nums shrink-0">
                    {readiness.readyCount}/{readiness.totalChecks}
                  </span>
                </div>
                <p className="text-[11px] text-muted truncate">
                  {readiness.missing.length > 0
                    ? `Missing: ${readiness.missing.join(', ')}`
                    : 'All required fields ready to submit'}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const RecentTripsSnapshotCard: React.FC<{
  title: string;
  subtitle: string;
  requests: TravelRequest[];
  actionLabel: string;
  onAction: (req: TravelRequest) => void;
  showReadiness?: boolean;
  emptyMessage?: string;
  onFooterClick?: () => void;
  footerLabel?: string;
}> = ({
  title,
  subtitle,
  requests,
  actionLabel,
  onAction,
  showReadiness = false,
  emptyMessage,
  onFooterClick,
  footerLabel,
}) => {
  if (requests.length === 0 && !emptyMessage) return null;

  return (
    <div className="bg-surface rounded-xl border border-border-warm overflow-hidden shadow-xs flex flex-col">
      <div className="p-4 border-b border-border-warm bg-surface-subtle flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="text-[11px] text-muted">{subtitle}</p>
        </div>
        {onFooterClick && footerLabel && (
          <button
            type="button"
            onClick={onFooterClick}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span>{footerLabel}</span>
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="py-6 px-4 text-center text-xs text-muted">{emptyMessage}</div>
      ) : (
        <div className="divide-y divide-border-warm">
          {requests.map((req) => {
            const readiness = showReadiness ? computeDraftReadiness(req) : null;
            return (
              <div
                key={req.id}
                className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-surface-subtle/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-ink truncate">{req.title}</span>
                    <TravelStatusBadge status={req.status} size="sm" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted mt-1 font-mono">
                    <RouteLabel origin={req.origin} destination={req.destination} />
                    <span aria-hidden="true">•</span>
                    <span>{req.projectCode}</span>
                    <span aria-hidden="true">•</span>
                    <span>{req.departureDate}</span>
                  </div>
                  {readiness && (
                    <p className="text-[10px] text-muted mt-1">
                      Readiness:{' '}
                      <strong className="text-ink font-mono">
                        {readiness.readyCount}/{readiness.totalChecks}
                      </strong>
                      {readiness.missing.length > 0
                        ? ` · Missing: ${readiness.missing.slice(0, 2).join(', ')}`
                        : ' · Ready to submit'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold tabular-nums text-primary">
                    {formatINR(req.totalExpenses)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAction(req)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-primary hover:border-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {actionLabel === 'Clone as Draft' && <Copy className="size-3" />}
                    {actionLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ResolvedRevisionsCard: React.FC<{
  requests: TravelRequest[];
  onInspect: (req: TravelRequest) => void;
}> = ({ requests, onInspect }) => {
  const resolved = React.useMemo(() => {
    return requests.filter((r) => {
      if (r.status.includes('REVISION_REQUESTED')) return false;
      return Boolean(
        r.timeline?.some((ev) => {
          const s = String(ev.toStatus || ev.to_status || ev.eventType || ev.event_type || '');
          return s.includes('REVISION');
        })
      );
    });
  }, [requests]);

  return (
    <div className="bg-surface rounded-xl border border-border-warm overflow-hidden shadow-xs flex flex-col">
      <div className="p-4 border-b border-border-warm bg-surface-subtle flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Resolved Revision History</h3>
          <p className="text-[11px] text-muted">
            Past requests that were returned for fixes and subsequently resolved.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-border-warm text-muted">
          {resolved.length}
        </span>
      </div>

      {resolved.length === 0 ? (
        <div className="py-7 px-4 text-center text-xs text-muted">
          No historical revisions found. All prior trips cleared without rework.
        </div>
      ) : (
        <div className="divide-y divide-border-warm">
          {resolved.slice(0, 5).map((req) => {
            const revEvent = req.timeline?.find((ev) =>
              String(ev.toStatus || ev.to_status || '').includes('REVISION')
            );
            return (
              <div key={req.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-subtle/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink truncate">{req.title}</span>
                    <TravelStatusBadge status={req.status} size="sm" />
                  </div>
                  {revEvent?.remarks && (
                    <p className="text-[11px] text-muted italic truncate mt-0.5">
                      Feedback: “{revEvent.remarks}”
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onInspect(req)}
                  className="px-2.5 py-1 rounded-lg border border-border-warm text-xs font-semibold text-primary hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer shrink-0"
                >
                  Inspect
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
