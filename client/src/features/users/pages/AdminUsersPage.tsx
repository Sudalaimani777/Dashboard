import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  Loader2,
  PencilLine,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { TravelMetricsGrid } from '../../travel/components/shared/TravelMetricsGrid';
import { useAuth } from '../../auth/hooks/useAuth';
import { usersApi } from '../services/users.api';
import { UserFormModal } from '../components/UserFormModal';
import {
  computeUserStats,
  filterDirectoryUsers,
  type CreateUserPayload,
  type DirectoryUser,
  type ManagedUserRole,
  type UpdateUserPayload,
} from '../utils/users.utils';

const DEFAULT_DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Product',
  'Operations',
  'Finance',
  'Executive',
];

interface ConfirmDialogState {
  type: 'deactivate' | 'reactivate' | 'delete';
  user: DirectoryUser;
}

function formatAddedDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const reduceMotion = useReducedMotion();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | ManagedUserRole>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<DirectoryUser | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeleteChecked, setConfirmDeleteChecked] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersApi.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team directory.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const stats = useMemo(() => computeUserStats(users), [users]);
  const managers = useMemo(() => users.filter((u) => u.role === 'MANAGER'), [users]);

  const departments = useMemo(() => {
    const set = new Set<string>(DEFAULT_DEPARTMENTS);
    for (const u of users) {
      if (u.department) set.add(u.department);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const filteredUsers = useMemo(
    () =>
      filterDirectoryUsers(users, {
        query: searchQuery,
        roleFilter,
        departmentFilter,
        statusFilter,
      }),
    [users, searchQuery, roleFilter, departmentFilter, statusFilter]
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      roleFilter !== 'ALL' ||
      statusFilter !== 'ALL' ||
      departmentFilter !== 'ALL'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setDepartmentFilter('ALL');
  };

  const handleCreate = async (payload: CreateUserPayload) => {
    const created = await usersApi.createUser(payload);
    setUsers((prev) => [created, ...prev]);
    setFeedback(`Added ${created.name} (${created.role}) to ${created.department}.`);
  };

  const handleUpdate = async (id: string, payload: UpdateUserPayload) => {
    const updated = await usersApi.updateUser(id, payload);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    setFeedback(`Updated ${updated.name}'s access & assignment.`);
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsProcessingAction(true);
    setActionError(null);
    const { type, user } = confirmDialog;

    try {
      if (type === 'deactivate') {
        const updated = await usersApi.toggleStatus(user.id, false);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
        setFeedback(`Deactivated ${user.name}. Login access revoked.`);
        setConfirmDialog(null);
        setConfirmDeleteChecked(false);
      } else if (type === 'reactivate') {
        const updated = await usersApi.toggleStatus(user.id, true);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
        setFeedback(`Reactivated ${user.name}. Login access restored.`);
        setConfirmDialog(null);
        setConfirmDeleteChecked(false);
      } else if (type === 'delete') {
        if (!confirmDeleteChecked) {
          setActionError('Please acknowledge that travel records will be permanently erased.');
          return;
        }
        await usersApi.deleteUser(user.id);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setFeedback(`Permanently deleted ${user.name} and erased their travel records from directory.`);
        setConfirmDialog(null);
        setConfirmDeleteChecked(false);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Team &amp; Access</h1>
          <p className="text-xs text-muted">
            Provision Employees, Managers, and Administrators, manage lifecycle status, and oversee department assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/users/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="size-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <TravelMetricsGrid
        metrics={[
          {
            label: 'Total Members',
            value: stats.total,
            subtext: `${stats.active} active · ${stats.deactivated} deactivated`,
          },
          {
            label: 'Managers & Admins',
            value: stats.managers + stats.admins,
            subtext: `${stats.managers} managers · ${stats.admins} administrators`,
          },
          {
            label: 'Employees',
            value: stats.employees,
            subtext: `${stats.employees - stats.unassignedEmployees} assigned to a manager`,
          },
          {
            label: 'Unassigned Employees',
            value: stats.unassignedEmployees,
            tone: stats.unassignedEmployees > 0 ? 'amber' : 'default',
            subtext:
              stats.unassignedEmployees > 0
                ? 'Action required: assign manager'
                : 'All employees assigned',
          },
        ]}
      />

      {feedback && (
        <div className="rounded-xl border border-[#3F624D]/30 bg-[#F0F7F2] px-4 py-2.5 text-xs text-[#2E4B3A] font-medium flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#3F624D] hover:text-[#2E4B3A] cursor-pointer font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-destructive font-medium"
        >
          {error}
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="bg-surface rounded-xl border border-border-warm p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px] sm:max-w-md">
          <Search className="size-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, department..."
            aria-label="Search team directory"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border-warm bg-surface-subtle text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Role Filter */}
          <div
            role="group"
            aria-label="Filter by role"
            className="inline-flex rounded-lg border border-border-warm bg-surface p-0.5"
          >
            {(
              [
                { id: 'ALL', label: 'All Roles' },
                { id: 'EMPLOYEE', label: 'Employees' },
                { id: 'MANAGER', label: 'Managers' },
                { id: 'ADMIN', label: 'Admins' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={roleFilter === opt.id}
                onClick={() => setRoleFilter(opt.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer ${
                  roleFilter === opt.id
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border-warm hidden sm:block" />

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Filter by account status"
            className="px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface text-xs text-ink font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>

          {/* Department Dropdown */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter by department"
            className="px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface text-xs text-ink font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-surface rounded-xl border border-border-warm overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-warm">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Organization Directory</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-surface-subtle text-muted border border-border-warm">
              {filteredUsers.length}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted">Loading team directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center space-y-1">
            <p className="text-sm font-semibold text-ink">No matching team members</p>
            <p className="text-xs text-muted">Adjust your filters or add a new team member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Reporting Manager</th>
                  <th className="py-3 px-4 whitespace-nowrap">Added</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-xs">
                {filteredUsers.map((member) => {
                  const isCurrentActor = member.id === currentUser?.id;
                  const isActive = member.is_active !== false;

                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors ${
                        !isActive ? 'bg-surface-subtle/40 opacity-80' : 'hover:bg-surface-subtle/50'
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{member.name}</span>
                          {isCurrentActor && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted">{member.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            member.role === 'ADMIN'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : member.role === 'MANAGER'
                              ? 'bg-amber-50 text-amber-900 border-amber-200/80'
                              : 'bg-surface-subtle text-ink/80 border-border-warm'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isActive
                              ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-ink">{member.department}</td>
                      <td className="py-3.5 px-4 text-muted">
                        {member.role === 'EMPLOYEE' ? (
                          member.manager_name ? (
                            <span className="text-ink font-medium">{member.manager_name}</span>
                          ) : (
                            <span className="text-amber-700 font-medium">Unassigned</span>
                          )
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted whitespace-nowrap">
                        {formatAddedDate(member.created_at)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Edit action */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(member);
                              setModalMode('edit');
                            }}
                            aria-label={`Edit ${member.name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink cursor-pointer active:scale-[0.98] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          >
                            <PencilLine className="size-3 text-primary" />
                            <span>Edit</span>
                          </button>

                          {/* Lifecycle action */}
                          {!isCurrentActor && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setConfirmDeleteChecked(false);
                                setConfirmDialog({
                                  type: isActive ? 'deactivate' : 'reactivate',
                                  user: member,
                                });
                              }}
                              aria-label={
                                isActive
                                  ? `Deactivate ${member.name}`
                                  : `Reactivate ${member.name}`
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer active:scale-[0.98] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                                isActive
                                  ? 'border-amber-200 bg-surface hover:bg-amber-50/80 text-amber-800'
                                  : 'border-emerald-200 bg-surface hover:bg-emerald-50/80 text-emerald-800'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <UserX className="size-3 text-amber-700" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="size-3 text-emerald-700" />
                                  <span>Reactivate</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Delete action */}
                          {!isCurrentActor && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setConfirmDeleteChecked(false);
                                setConfirmDialog({ type: 'delete', user: member });
                              }}
                              aria-label={`Delete ${member.name}`}
                              title="Delete user"
                              className="p-1.5 rounded-lg border border-border-warm bg-surface hover:bg-red-50 hover:border-red-200 text-muted hover:text-destructive cursor-pointer active:scale-[0.98] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface rounded-2xl border border-border-warm max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmDialog.type === 'delete'
                      ? 'bg-red-100 text-destructive'
                      : confirmDialog.type === 'deactivate'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <AlertTriangle className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 id="confirm-dialog-title" className="text-base font-bold text-ink">
                    {confirmDialog.type === 'delete'
                      ? `Delete ${confirmDialog.user.name} (${
                          confirmDialog.user.role === 'MANAGER'
                            ? 'Manager'
                            : confirmDialog.user.role === 'ADMIN'
                            ? 'Administrator'
                            : 'Employee'
                        })?`
                      : confirmDialog.type === 'deactivate'
                      ? `Deactivate ${confirmDialog.user.name}?`
                      : `Reactivate ${confirmDialog.user.name}?`}
                  </h3>
                  <div className="text-xs text-muted leading-relaxed">
                    {confirmDialog.type === 'delete' ? (
                      <div className="space-y-2.5">
                        <p>
                          Are you sure you want to delete{' '}
                          <strong className="text-ink">{confirmDialog.user.name}</strong>?
                        </p>
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-destructive font-medium space-y-1">
                          <p className="font-semibold text-[13px]">Permanent Erasure Warning</p>
                          <p className="text-xs text-red-700 leading-normal">
                            If you delete this {confirmDialog.user.role === 'MANAGER' ? 'manager' : 'employee'}, their travel records will erase permanently and we can't bring back. All associated travel requests, expense receipts, and audit history will be permanently erased.
                          </p>
                        </div>
                      </div>
                    ) : confirmDialog.type === 'deactivate' ? (
                      <p>
                        Deactivating <strong>{confirmDialog.user.name}</strong> will immediately revoke
                        their login and authorization rights. All past expense receipts and trip records
                        remain securely saved.
                      </p>
                    ) : (
                      <p>
                        Reactivating <strong>{confirmDialog.user.name}</strong> will restore their access
                        to sign in and participate in travel workflows.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {confirmDialog.type === 'delete' && (
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-subtle/80 border border-border-warm cursor-pointer select-none hover:bg-surface-subtle transition-colors">
                    <input
                      type="checkbox"
                      id="confirm-erasure-checkbox"
                      name="confirmDeleteChecked"
                      checked={confirmDeleteChecked}
                      onChange={(e) => setConfirmDeleteChecked(e.target.checked)}
                      className="mt-0.5 size-4 rounded text-destructive border-border-warm focus:ring-destructive/30 cursor-pointer"
                    />
                    <span className="text-xs text-ink leading-snug font-medium">
                      I understand that if you delete this {confirmDialog.user.role === 'MANAGER' ? 'manager' : 'employee'}, their records will erase and we can't bring back this data.
                    </span>
                  </label>
                </div>
              )}

              {actionError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-destructive font-medium"
                >
                  {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-warm">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => {
                    setConfirmDialog(null);
                    setActionError(null);
                    setConfirmDeleteChecked(false);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-border-warm bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    isProcessingAction ||
                    (confirmDialog.type === 'delete' && !confirmDeleteChecked)
                  }
                  onClick={handleConfirmAction}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 ${
                    confirmDialog.type === 'delete'
                      ? 'bg-destructive hover:bg-destructive/90'
                      : confirmDialog.type === 'deactivate'
                      ? 'bg-amber-700 hover:bg-amber-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {isProcessingAction && <Loader2 className="size-3.5 animate-spin" />}
                  <span>
                    {confirmDialog.type === 'delete'
                      ? 'Permanently Delete Member'
                      : confirmDialog.type === 'deactivate'
                      ? 'Deactivate User'
                      : 'Reactivate User'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <UserFormModal
          mode={modalMode}
          initialUser={editingUser}
          managers={managers}
          departments={departments}
          onClose={() => {
            setModalMode(null);
            setEditingUser(null);
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}
    </motion.div>
  );
};
