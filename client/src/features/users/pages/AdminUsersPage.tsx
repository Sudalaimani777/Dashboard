import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  Building2,
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
import { ConfirmUserActionModal } from '../components/ConfirmUserActionModal';
import {
  computeUserStats,
  filterDirectoryUsers,
  isUserInReportingLine,
  type DirectoryScope,
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

  const [directoryScope, setDirectoryScope] = useState<DirectoryScope>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | ManagedUserRole>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

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

  const lineUsers = useMemo(
    () => users.filter((u) => isUserInReportingLine(u, currentUser?.id, users)),
    [users, currentUser?.id]
  );

  const scopedUsers = useMemo(
    () => (directoryScope === 'LINE' ? lineUsers : users),
    [directoryScope, lineUsers, users]
  );

  const stats = useMemo(() => computeUserStats(scopedUsers), [scopedUsers]);
  const managers = useMemo(() => scopedUsers.filter((u) => u.role === 'MANAGER'), [scopedUsers]);
  const admins = useMemo(() => users.filter((u) => u.role === 'ADMIN'), [users]);

  const departments = useMemo(() => {
    const set = new Set<string>(DEFAULT_DEPARTMENTS);
    for (const u of scopedUsers) {
      if (u.department) set.add(u.department);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [scopedUsers]);

  const filteredUsers = useMemo(
    () =>
      filterDirectoryUsers(scopedUsers, {
        query: searchQuery,
        roleFilter,
        departmentFilter,
        statusFilter,
      }),
    [scopedUsers, searchQuery, roleFilter, departmentFilter, statusFilter]
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

  const handleSwitchToDeactivate = () => {
    if (!confirmDialog) return;
    setActionError(null);
    setConfirmDeleteChecked(false);
    setConfirmDialog({
      type: 'deactivate',
      user: confirmDialog.user,
    });
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
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Reporting Line Scope Switcher */}
          <div
            role="group"
            aria-label="Directory scope"
            className="inline-flex rounded-xl border border-border-warm bg-surface-subtle p-1 shadow-2xs"
          >
            <button
              type="button"
              aria-pressed={directoryScope === 'ALL'}
              onClick={() => setDirectoryScope('ALL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
                directoryScope === 'ALL'
                  ? 'bg-surface text-ink shadow-xs border border-border-warm/80'
                  : 'text-muted hover:text-ink hover:bg-surface/50'
              }`}
            >
              <Building2 className="size-3.5 text-muted" />
              <span>All Team Members</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-surface border border-border-warm text-muted">
                {users.length}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={directoryScope === 'LINE'}
              onClick={() => setDirectoryScope('LINE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
                directoryScope === 'LINE'
                  ? 'bg-surface text-ink shadow-xs border border-border-warm/80'
                  : 'text-muted hover:text-ink hover:bg-surface/50'
              }`}
            >
              <Users className="size-3.5 text-primary" />
              <span>My Reporting Line</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  lineUsers.length > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface border border-border-warm text-muted'
                }`}
              >
                {lineUsers.length}
              </span>
            </button>
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
            <h2 className="text-sm font-bold text-ink">
              {directoryScope === 'LINE' ? 'My Reporting Line Directory' : 'Organization Directory'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-surface-subtle text-muted border border-border-warm">
              {filteredUsers.length}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted">Loading team directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-ink">
              {directoryScope === 'LINE' && lineUsers.length === 0
                ? 'No team members in your reporting line yet'
                : 'No matching team members'}
            </p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {directoryScope === 'LINE' && lineUsers.length === 0
                ? 'Managers assigned to report to you and their direct reports will appear here automatically.'
                : 'Adjust your search query, department, or status filters.'}
            </p>
            {directoryScope === 'LINE' && users.length > 0 && (
              <button
                type="button"
                onClick={() => setDirectoryScope('ALL')}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-primary hover:border-primary/40 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Building2 className="size-3.5" />
                <span>View All Team Members ({users.length})</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Supervisor / Reporting</th>
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
                        <div className="text-[11px] text-slate-600 font-medium">{member.email}</div>
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
                      <td className="py-3.5 px-4 text-slate-800">
                        {member.role === 'EMPLOYEE' ? (
                          member.manager_name ? (
                            <span className="text-ink font-medium">{member.manager_name}</span>
                          ) : (
                            <span className="text-amber-700 font-medium">Unassigned Manager</span>
                          )
                        ) : member.role === 'MANAGER' ? (
                          member.reporting_admin_name ? (
                            <span className="text-ink font-medium">{member.reporting_admin_name}</span>
                          ) : (
                            <span className="text-amber-700 font-medium">Unassigned Admin</span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                            Executive Lead
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 font-medium whitespace-nowrap">
                        {formatAddedDate(member.created_at)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Edit action */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(member);
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
      <ConfirmUserActionModal
        isOpen={Boolean(confirmDialog)}
        dialog={confirmDialog}
        isProcessing={isProcessingAction}
        error={actionError}
        confirmDeleteChecked={confirmDeleteChecked}
        onConfirmCheckedChange={setConfirmDeleteChecked}
        onClose={() => {
          setConfirmDialog(null);
          setActionError(null);
          setConfirmDeleteChecked(false);
        }}
        onConfirm={handleConfirmAction}
        onSwitchToDeactivate={handleSwitchToDeactivate}
      />

      {/* Edit Modal */}
      {editingUser && (
        <UserFormModal
          initialUser={editingUser}
          managers={managers}
          admins={admins}
          departments={departments}
          onClose={() => {
            setEditingUser(null);
          }}
          onUpdate={handleUpdate}
        />
      )}
    </motion.div>
  );
};
