import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserCog, X } from 'lucide-react';
import {
  updateUserSchema,
  type UpdateUserFormValues,
} from '../schemas/users.schema';
import type {
  DirectoryUser,
  UpdateUserPayload,
} from '../utils/users.utils';

export interface UserFormModalProps {
  initialUser: DirectoryUser;
  managers: DirectoryUser[];
  admins?: DirectoryUser[];
  departments: string[];
  onClose: () => void;
  onUpdate: (id: string, payload: UpdateUserPayload) => Promise<void>;
  mode?: 'edit';
}

export const EditUserForm: React.FC<{
  initialUser: DirectoryUser;
  availableManagers: DirectoryUser[];
  availableAdmins: DirectoryUser[];
  departments: string[];
  onClose: () => void;
  onUpdate: (id: string, payload: UpdateUserPayload) => Promise<void>;
}> = ({ initialUser, availableManagers, availableAdmins, departments, onClose, onUpdate }) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      role: initialUser.role || 'EMPLOYEE',
      department: initialUser.department || departments[0] || 'Engineering',
      managerId: initialUser.manager_id || '',
      reportingAdminId: initialUser.reporting_admin_id || '',
    },
    mode: 'onTouched',
  });

  const role = watch('role');

  const onSubmit = async (values: UpdateUserFormValues) => {
    setServerError(null);
    try {
      await onUpdate(initialUser.id, {
        role: values.role,
        department: values.department.trim(),
        managerId: values.role === 'EMPLOYEE' ? values.managerId || null : null,
        reportingAdminId: values.role === 'MANAGER' ? values.reportingAdminId || null : null,
      });
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to update member.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 text-left" noValidate>
      {serverError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs text-destructive font-medium"
        >
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label htmlFor="user-role" className="block text-xs font-semibold text-ink">
            Role
          </label>
          <select
            id="user-role"
            disabled={initialUser.role === 'ADMIN'}
            className="w-full h-11 px-3 rounded-xl border border-border-warm bg-surface text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            {...register('role')}
          >
            {initialUser.role === 'ADMIN' ? (
              <option value="ADMIN">Administrator</option>
            ) : (
              <>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Administrator</option>
              </>
            )}
          </select>
          {initialUser.role === 'ADMIN' && (
            <p className="text-[11px] text-faint">
              Admin roles cannot be downgraded via directory edit.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user-department" className="block text-xs font-semibold text-ink">
            Department
          </label>
          <input
            id="user-department"
            type="text"
            list="tripflow-departments-edit"
            placeholder="Engineering"
            aria-invalid={Boolean(errors.department)}
            className={`w-full h-11 px-3.5 rounded-xl border bg-surface text-sm text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 ${
              errors.department
                ? 'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive'
                : 'border-border-warm focus-visible:ring-primary/20 focus-visible:border-primary'
            }`}
            {...register('department')}
          />
          <datalist id="tripflow-departments-edit">
            {departments.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          {errors.department?.message &&
            <p role="alert" className="text-xs text-destructive font-medium">
              {errors.department.message}
            </p>
          }
        </div>
      </div>

      {role === 'EMPLOYEE' && (
        <div className="space-y-1.5">
          <label htmlFor="user-manager" className="block text-xs font-semibold text-ink">
            Reporting Manager
          </label>
          <select
            id="user-manager"
            className="w-full h-11 px-3 rounded-xl border border-border-warm bg-surface text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary cursor-pointer"
            {...register('managerId')}
          >
            <option value="">Unassigned (any manager)</option>
            {availableManagers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.department}) — {m.email}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted">
            Assigned manager conducts Tier 1 audits for this employee's travel requests.
          </p>
        </div>
      )}

      {role === 'MANAGER' && (
        <div className="space-y-1.5">
          <label htmlFor="user-admin" className="block text-xs font-semibold text-ink">
            Reporting Admin
          </label>
          <select
            id="user-admin"
            className="w-full h-11 px-3 rounded-xl border border-border-warm bg-surface text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary cursor-pointer"
            {...register('reportingAdminId')}
          >
            <option value="">Unassigned (any admin)</option>
            {availableAdmins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.department}) — {a.email}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted">
            Assigned admin reviews this manager's personal trips and receives forward approvals.
          </p>
        </div>
      )}

      {role === 'ADMIN' && (
        <div className="p-3 rounded-xl bg-surface-subtle border border-border-warm text-xs text-muted">
          Administrators serve as executive reviewers and do not report to a manager or admin.
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-warm">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-muted hover:text-ink hover:bg-surface-subtle cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
};

export const UserEditModal: React.FC<UserFormModalProps> = ({
  initialUser,
  managers,
  admins = [],
  departments,
  onClose,
  onUpdate,
}) => {
  const availableManagers = managers.filter((m) => m.id !== initialUser.id);
  const availableAdmins = (admins || []).filter((a) => a.id !== initialUser.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-border-warm bg-surface shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-warm bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCog className="size-4" />
            </span>
            <div>
              <h2 id="user-modal-title" className="text-sm font-bold text-ink">
                Edit {initialUser.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="size-4" />
          </button>
        </div>

        <EditUserForm
          initialUser={initialUser}
          availableManagers={availableManagers}
          availableAdmins={availableAdmins}
          departments={departments}
          onClose={onClose}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
};

// Alias export for backward compatibility
export const UserFormModal = UserEditModal;
