import React from 'react';
import { History } from 'lucide-react';
import type { TravelTimelineEvent } from '../../types/travel.types';

export interface AuditTimelineLogProps {
  timeline?: TravelTimelineEvent[];
}

export const AuditTimelineLog: React.FC<AuditTimelineLogProps> = ({ timeline = [] }) => {
  if (timeline.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-5 flex flex-col gap-3 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68] flex items-center gap-2 border-b border-[#E8DFD3] pb-3">
        <History className="w-4 h-4 text-[#8A582B]" /> Audit Ledger & Event History
      </h3>

      <div className="flex flex-col gap-3 pt-1">
        {timeline.map((event) => (
          <div key={event.id} className="flex items-start gap-3 text-xs border-l-2 border-[#8A582B] pl-3 py-1">
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2B231D]">
                  {event.actorRole}: {event.toStatus.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-[#A0988E] font-mono">
                  {new Date(event.createdAt).toLocaleDateString()}
                </span>
              </div>
              {event.remarks && (
                <p className="text-[11px] text-[#756F68] italic mt-0.5">
                  "{event.remarks}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
