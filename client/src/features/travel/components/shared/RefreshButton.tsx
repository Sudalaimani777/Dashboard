import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

export interface RefreshButtonProps {
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  lastSyncedAt?: Date | null;
  className?: string;
  showTimestamp?: boolean;
  label?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isRefreshing = false,
  lastSyncedAt,
  className = '',
  showTimestamp = true,
  label = 'Refresh',
}) => {
  const [timeText, setTimeText] = useState<string>('');

  useEffect(() => {
    const updateTimeText = () => {
      if (!lastSyncedAt) {
        setTimeText('');
        return;
      }
      const diffSec = Math.floor((Date.now() - new Date(lastSyncedAt).getTime()) / 1000);
      if (diffSec < 15) {
        setTimeText('Synced just now');
      } else if (diffSec < 60) {
        setTimeText(`Synced ${diffSec}s ago`);
      } else if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        setTimeText(`Synced ${mins}m ago`);
      } else {
        const hours = Math.floor(diffSec / 3600);
        setTimeText(`Synced ${hours}h ago`);
      }
    };

    updateTimeText();
    const interval = setInterval(updateTimeText, 10000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showTimestamp && timeText && (
        <span className="text-[11px] text-faint hidden sm:inline-block font-mono select-none">
          {timeText}
        </span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh data"
        title={timeText || 'Refresh current data'}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-xs font-semibold text-ink shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <RotateCw
          className={`size-3.5 text-muted transition-transform ${
            isRefreshing ? 'animate-spin text-primary' : ''
          }`}
        />
        <span>{isRefreshing ? 'Syncing...' : label}</span>
      </button>
    </div>
  );
};
