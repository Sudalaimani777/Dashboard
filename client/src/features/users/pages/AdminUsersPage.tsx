import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { PencilLine, Plus, Search, Users } from 'lucide-react';
import { TravelMetricsGrid } from '../../travel/components/shared/TravelMetricsGrid';
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

const DEFAULT_DEPARTMENTS = ['Engineering', 'Sales', 'Product', 'Operations', 'Finance', 'Executive'];

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | ManagedUserRole>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<DirectoryUser | null>(null);

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
      }),
    [users, searchQuery, roleFilter, departmentFilter]
  );

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
            Provision Employees and Managers, assign reporting managers, and manage department access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/users/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
        >
          <Plus className="size-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      <TravelMetricsGrid
        metrics={[
          { label: 'Total Members', value: stats.total, subtext: 'Provisioned accounts' },
          { label: 'Managers', value: stats.managers, subtext: 'Tier 1 approvers' },
          { label: 'Employees', value: stats.employees, subtext: 'Travel requesters' },
          {
            label: 'Unassigned Employees',
            value: stats.unassignedEmployees,
            subtext:
              stats.unassignedEmployees > 0
                ? 'Needs reporting manager'
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

      {/* Search & Filters */}
      <div className="bg-surface rounded-xl border border-border-warm p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, department, or manager..."
            aria-label="Search team directory"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border-warm bg-surface-subtle text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter by role"
            className="inline-flex rounded-lg border border-border-warm bg-surface p-0.5"
          >
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'EMPLOYEE', label: 'Employees' },
                { id: 'MANAGER', label: 'Managers' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={roleFilter === opt.id}
                onClick={() => setRoleFilter(opt.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer ${
                  roleFilter === opt.id ? 'bg-primary text-white shadow-2xs' : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

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
            <p className="text-xs text-muted">Adjust your filters or add a new Employee or Manager.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Reporting Manager</th>
                  <th className="py-3 px-4">Added</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-xs">
                {filteredUsers.map((member) => {
                  const isAdmin = member.role === 'ADMIN';
                  return (
                    <tr key={member.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-ink">{member.name}</div>
                        <div className="text-[11px] text-muted">{member.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            member.role === 'ADMIN'
                              ? 'bg-primary/10 text-primary border-primary/25'
                              : member.role === 'MANAGER'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-surface-subtle text-ink border-border-warm'
                          }`}
                        >
                          {member.role}
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
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                        {new Date(member.created_at).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isAdmin ? (
                          <span className="text-[11px] text-faint">Protected</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(member);
                              setModalMode('edit');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          >
                            <PencilLine className="size-3.5 text-primary" />
                            <span>Edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
