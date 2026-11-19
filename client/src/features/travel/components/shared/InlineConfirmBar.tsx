import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface InlineConfirmBarProps {
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible inline confirmation strip replacing blocking browser confirm dialogs.
 */
export const InlineConfirmBar: React.FC<InlineConfirmBarProps> = ({
  message,
  confirmLabel,
  cancelLabel = 'Keep Editing',
  isBusy = false,
  onConfirm,
  onCancel,
}) => (
  <div
    role="alertdialog"
    aria-label={confirmLabel}
    className="p-3.5 rounded-xl border border-red-200 bg-red-50/90 flex flex-wrap items-center justify-between gap-3"
  >
    <div className="flex items-center gap-2.5 text-xs text-ink">
      <AlertTriangle className="size-4 text-destructive shrink-0" />
      <span>{message}</span>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isBusy}
        onClick={onCancel}
        className="px-3 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        disabled={isBusy}
        onClick={onConfirm}
        className="px-3 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  </div>
);
