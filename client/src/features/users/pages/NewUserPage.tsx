import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { AuthField } from '../../auth/components/AuthField';
import { PasswordStrengthMeter } from '../../auth/components/PasswordStrengthMeter';
import { usersApi } from '../services/users.api';
import { createUserSchema, type CreateUserFormValues } from '../schemas/users.schema';
import type { DirectoryUser } from '../utils/users.utils';
import { useToast } from '../../../shared/context/ToastContext';

const DEFAULT_DEPARTMENTS = ['Engineering', 'Sales', 'Product', 'Operations', 'Finance', 'Executive'];

export const NewUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [managers, setManagers] = useState<DirectoryUser[]>([]);
  const [admins, setAdmins] = useState<DirectoryUser[]>([]);
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: '',
      reportingAdminId: '',
    },
    mode: 'onTouched',
  });

  const [name, email, password, role, department] = watch([
    'name',
    'email',
    'password',
    'role',
    'department',
  ]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
      return;
    }

    usersApi
      .listUsers()
      .then((list) => {
        setManagers(list.filter((u) => u.role === 'MANAGER' && u.is_active !== false));
        setAdmins(list.filter((u) => u.role === 'ADMIN' && u.is_active !== false));
        const deptSet = new Set<string>(DEFAULT_DEPARTMENTS);
        for (const u of list) {
          if (u.department) deptSet.add(u.department);
        }
        setDepartments(Array.from(deptSet).sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {
        // Keep defaults if directory prefetch fails
      });
  }, [user, navigate]);

  const checklist = useMemo(
    () => [
      { label: 'Full name provided', ok: (name || '').trim().length >= 2 },
      { label: 'Valid work email', ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim()) },
      { label: 'Initial password (8+ chars)', ok: (password || '').trim().length >= 8 },
      { label: 'Department assigned', ok: (department || '').trim().length >= 2 },
    ],
    [name, email, password, department]
  );

  const onSubmit = async (values: CreateUserFormValues) => {
    setServerError(null);
    try {
      await usersApi.createUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        department: values.department.trim(),
        managerId: values.role === 'EMPLOYEE' ? values.managerId || null : null,
        reportingAdminId: values.role === 'MANAGER' ? values.reportingAdminId || null : null,
      });
      showToast({
        title: 'Team member added',
        description: `${values.name.trim()} (${values.role.toLowerCase()}) has been added to ${values.department.trim()}.`,
        type: 'USER_CREATED',
        linkUrl: '/dashboard?tab=users',
      });
      navigate('/dashboard?tab=users', { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create member.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5 pb-12">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard?tab=users')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" />
          Back to Team &amp; Access
        </button>
      </div>

      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Add Team Member</h1>
        <p className="text-xs text-muted">
          Create an Employee or Manager account with an initial password and department assignment.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start"
        noValidate
      >
        {/* Main Form Card */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border-warm p-6 shadow-xs space-y-5">
          {serverError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-destructive font-medium"
            >
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AuthField
              id="new-user-name"
              label="Full name"
              type="text"
              placeholder="Enter full name"
              error={errors.name?.message}
              required
              {...register('name')}
            />

            <AuthField
              id="new-user-email"
              label="Work email"
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              required
              {...register('email')}
            />
          </div>

          <div>
            <AuthField
              id="new-user-password"
              label="Initial password"
              isPassword
              autoComplete="new-password"
              placeholder="Enter initial password"
              error={errors.password?.message}
              required
              {...register('password')}
            />
            <PasswordStrengthMeter password={password || ''} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="new-user-role" className="block text-xs font-semibold text-ink">
                Account Role
              </label>
              <select
                id="new-user-role"
                className="w-full h-11 px-3.5 rounded-xl border border-border-warm bg-surface text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary cursor-pointer"
                {...register('role')}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Administrator</option>
              </select>
              {errors.role?.message && (
                <p role="alert" className="text-xs text-destructive font-medium">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-user-department" className="block text-xs font-semibold text-ink">
                Department
              </label>
              <input
                id="new-user-department"
                type="text"
                list="new-user-departments"
                placeholder="Engineering"
                aria-invalid={Boolean(errors.department)}
                className={`w-full h-11 px-3.5 rounded-xl border bg-surface text-sm text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 ${
                  errors.department
                    ? 'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive'
                    : 'border-border-warm focus-visible:ring-primary/20 focus-visible:border-primary'
                }`}
                {...register('department')}
              />
              <datalist id="new-user-departments">
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
              <label htmlFor="new-user-manager" className="block text-xs font-semibold text-ink">
                Reporting Manager
              </label>
              <select
                id="new-user-manager"
                className="w-full h-11 px-3.5 rounded-xl border border-border-warm bg-surface text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary cursor-pointer"
                {...register('managerId')}
              >
                <option value="">Unassigned (any manager)</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.department}) — {m.email}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted">
                Assigned line manager conducts Tier 1 audits for this employee's travel requests.
              </p>
            </div>
          )}

          {role === 'MANAGER' && (
            <div className="space-y-1.5">
              <label htmlFor="new-user-reporting-admin" className="block text-xs font-semibold text-ink">
                Reporting Admin
              </label>
              <select
                id="new-user-reporting-admin"
                className="w-full h-11 px-3.5 rounded-xl border border-border-warm bg-surface text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary cursor-pointer"
                {...register('reportingAdminId')}
              >
                <option value="">Unassigned (general executive pool)</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.department}) — {a.email}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted">
                Designated administrator who reviews this manager's travel requests and receives escalated team approvals.
              </p>
            </div>
          )}

          {role === 'ADMIN' && (
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-warm text-xs text-muted leading-relaxed">
              <strong className="text-ink font-semibold block mb-0.5">Executive Governance Role</strong>
              Administrators hold organization-wide executive clearance and department budget authority. No reporting supervisor is required.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-warm">
            <button
              type="button"
              onClick={() => navigate('/dashboard?tab=users')}
              className="px-4 py-2.5 rounded-xl border border-border-warm bg-surface text-xs font-semibold text-muted hover:text-ink hover:bg-surface-subtle cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating Member...</span>
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  <span>Create Member</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sidebar: Readiness & Access Scope */}
        <aside className="space-y-4">
          <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                Provisioning Checklist
              </h2>
            </div>
            <ul className="space-y-2 text-xs">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  {item.ok ? (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-slate-400 shrink-0" />
                  )}
                  <span className={item.ok ? 'text-ink font-semibold' : 'text-slate-800 font-medium'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
};
