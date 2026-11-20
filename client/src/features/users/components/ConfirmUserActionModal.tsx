import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Trash2,
  X,
  Loader2,
  Check,
  ArrowRight,
  Building,
  Mail,
} from 'lucide-react';
import type { DirectoryUser } from '../utils/users.utils';

export interface ConfirmUserActionModalProps {
  dialog: {
    type: 'deactivate' | 'reactivate' | 'delete';
    user: DirectoryUser;
  } | null;
  isOpen: boolean;
  isProcessing: boolean;
  error: string | null;
  confirmDeleteChecked: boolean;
  onConfirmCheckedChange: (checked: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
  onSwitchToDeactivate?: () => void;
}

export const ConfirmUserActionModal: React.FC<ConfirmUserActionModalProps> = ({
  dialog,
  isOpen,
  isProcessing,
  error,
  confirmDeleteChecked,
  onConfirmCheckedChange,
  onClose,
  onConfirm,
  onSwitchToDeactivate,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen || !dialog) return null;

  const { type, user } = dialog;
  const isDelete = type === 'delete';
  const isDeactivate = type === 'deactivate';

  const roleLabel =
    user.role === 'ADMIN'
      ? 'Administrator'
      : user.role === 'MANAGER'
      ? 'Manager'
      : 'Employee';

  // Check if error suggests deactivation due to compliance records
  const isAuditComplianceError =
    Boolean(error) &&
    (error!.toLowerCase().includes('deactivate') ||
      error!.toLowerCase().includes('compliance') ||
      error!.toLowerCase().includes('corporate travel'));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Ethereal Frosted Glass Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={!isProcessing ? onClose : undefined}
          aria-hidden="true"
          className="fixed inset-0 bg-ink/45 backdrop-blur-md transition-opacity"
        />

        {/* Double-Bezel Nested Modal Shell */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-action-title"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
          }}
          className="relative w-full max-w-lg p-1.5 rounded-3xl bg-surface/85 backdrop-blur-2xl border border-white/60 shadow-[0_25px_60px_-15px_rgba(6,27,49,0.3),0_0_0_1px_rgba(6,27,49,0.06)] z-10 overflow-hidden"
        >
          {/* Inner Machined Core */}
          <div className="rounded-[calc(1.5rem-0.375rem)] bg-surface border border-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-border-warm/40">
              <div className="space-y-1.5">
                <h3
                  id="modal-action-title"
                  className="text-lg font-bold text-ink tracking-tight"
                >
                  {isDelete
                    ? `Delete ${user.name}?`
                    : isDeactivate
                    ? `Deactivate ${user.name}?`
                    : `Reactivate ${user.name}?`}
                </h3>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Close dialog"
                className="p-1.5 rounded-full text-slate-400 hover:text-ink hover:bg-slate-100 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* User Identity Chip */}
              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-warm/60 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                      isDelete
                        ? 'bg-rose-100/70 text-rose-800 border-rose-200/80'
                        : isDeactivate
                        ? 'bg-amber-100/70 text-amber-900 border-amber-200/80'
                        : 'bg-emerald-100/70 text-emerald-900 border-emerald-200/80'
                    }`}
                  >
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'U'}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-ink truncate">
                        {user.name}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-white border border-border-warm text-slate-700 shadow-2xs">
                        {roleLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted truncate">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="size-3 text-slate-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Building className="size-3 text-slate-400 shrink-0" />
                        <span>{user.department}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Warning / Guidance Banner */}
              {isDelete ? (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-rose-50/70 to-rose-50/30 border border-rose-100/90 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                    <ShieldAlert className="size-4 text-rose-600 shrink-0" />
                    <span>Permanent Data &amp; Audit Purge</span>
                  </div>
                  <p className="text-xs text-rose-950/80 leading-relaxed font-normal">
                    This action is immediate and cannot be undone. Purging this account
                    permanently removes all associated travel authorizations, expense
                    receipts, and compliance logs from the active directory.
                  </p>
                </div>
              ) : isDeactivate ? (
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                    <UserX className="size-4 text-amber-700 shrink-0" />
                    <span>Suspends Portal Access Safely</span>
                  </div>
                  <p className="text-xs text-amber-950/80 leading-relaxed font-normal">
                    Deactivating immediately revokes login permissions and active
                    sessions. All historical expense receipts, trip approvals, and
                    audit trails remain fully preserved for financial compliance.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                    <ShieldCheck className="size-4 text-emerald-700 shrink-0" />
                    <span>Restores Full Account Privileges</span>
                  </div>
                  <p className="text-xs text-emerald-950/80 leading-relaxed font-normal">
                    Reactivating will restore sign-in access, allowing this team member
                    to submit travel requests and participate in company workflows.
                  </p>
                </div>
              )}

              {/* Irreversible Delete Acknowledgment Card */}
              {isDelete && (
                <div className="pt-1">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={confirmDeleteChecked}
                    onClick={() => onConfirmCheckedChange(!confirmDeleteChecked)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-150 flex items-start gap-3 cursor-pointer select-none active:scale-[0.99] ${
                      confirmDeleteChecked
                        ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                        : 'bg-surface hover:bg-surface-subtle/80 border-border-warm/80'
                    }`}
                  >
                    <div
                      className={`mt-0.5 size-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        confirmDeleteChecked
                          ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                          : 'bg-white border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="size-3 stroke-[3]" />
                    </div>
                    <span className="text-xs text-ink leading-snug font-medium">
                      I understand this action is irreversible and permanently purges all
                      corporate travel and audit history for this member.
                    </span>
                  </button>
                </div>
              )}

              {/* Error Callout with Smart Compliance Remedy */}
              {error && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl border border-rose-200 bg-rose-50/90 text-xs space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start gap-2 text-rose-900 font-semibold">
                    <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                  </div>

                  {/* Smart Compliance Remedy Button */}
                  {isAuditComplianceError && onSwitchToDeactivate && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={onSwitchToDeactivate}
                        className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50/80 text-amber-900 border border-amber-200/90 font-semibold text-xs shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <UserX className="size-3.5 text-amber-700" />
                        <span>Deactivate Account Instead (Preserves Audit Logs)</span>
                        <ArrowRight className="size-3.5 text-amber-700" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-surface-subtle/60 border-t border-border-warm/50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-border-warm/80 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-ink active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessing || (isDelete && !confirmDeleteChecked)}
                onClick={onConfirm}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDelete
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : isDeactivate
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isDelete ? (
                  <Trash2 className="size-3.5" />
                ) : isDeactivate ? (
                  <UserX className="size-3.5" />
                ) : (
                  <UserCheck className="size-3.5" />
                )}
                <span>
                  {isDelete
                    ? 'Permanently Delete Member'
                    : isDeactivate
                    ? 'Deactivate User'
                    : 'Reactivate User'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
