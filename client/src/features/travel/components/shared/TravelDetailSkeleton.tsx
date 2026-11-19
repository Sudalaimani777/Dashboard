import React from 'react';

/**
 * Structural loading skeleton matching the 12-column travel detail and resubmit layouts.
 */
export const TravelDetailSkeleton: React.FC = () => (
  <div
    aria-busy="true"
    aria-label="Loading travel request"
    className="max-w-7xl mx-auto flex flex-col gap-5 animate-pulse"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="h-4 w-36 rounded-md bg-border-warm/60" />
      <div className="flex items-center gap-2">
        <div className="h-8 w-24 rounded-lg bg-border-warm/60" />
        <div className="h-8 w-28 rounded-lg bg-border-warm/60" />
      </div>
    </div>

    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col lg:flex-row justify-between gap-4">
      <div className="flex flex-col gap-2.5 flex-1">
        <div className="h-7 w-72 rounded-md bg-border-warm/60" />
        <div className="h-4 w-96 max-w-full rounded-md bg-border-warm/50" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-24 rounded-lg bg-border-warm/50" />
        <div className="h-8 w-24 rounded-lg bg-border-warm/50" />
        <div className="h-8 w-24 rounded-lg bg-border-warm/50" />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 flex flex-col gap-5">
        <div className="h-72 rounded-xl border border-border-warm bg-surface" />
        <div className="h-52 rounded-xl border border-border-warm bg-surface" />
      </div>
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="h-64 rounded-xl border border-border-warm bg-surface" />
        <div className="h-44 rounded-xl border border-border-warm bg-surface" />
      </div>
    </div>
  </div>
);
