import { createUserSchema } from '../schemas/users.schema';

export type ManagedUserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type UserRole = ManagedUserRole;

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  manager_id: string | null;
  manager_name: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'EMPLOYEE' | 'MANAGER';
  department: string;
  managerId?: string | null;
}

export interface UpdateUserPayload {
  role?: ManagedUserRole;
  department?: string;
  managerId?: string | null;
  isActive?: boolean;
}

export interface UserDirectoryStats {
  total: number;
  managers: number;
  employees: number;
  admins: number;
  unassignedEmployees: number;
  active: number;
  deactivated: number;
}

export function computeUserStats(users: DirectoryUser[]): UserDirectoryStats {
  let managers = 0;
  let employees = 0;
  let admins = 0;
  let unassignedEmployees = 0;
  let active = 0;
  let deactivated = 0;

  for (const u of users) {
    if (u.is_active === false) {
      deactivated += 1;
    } else {
      active += 1;
    }

    if (u.role === 'ADMIN') admins += 1;
    if (u.role === 'MANAGER') managers += 1;
    if (u.role === 'EMPLOYEE') {
      employees += 1;
      if (!u.manager_id) unassignedEmployees += 1;
    }
  }

  return {
    total: users.length,
    managers,
    employees,
    admins,
    unassignedEmployees,
    active,
    deactivated,
  };
}

export function filterDirectoryUsers(
  users: DirectoryUser[],
  options: {
    query?: string;
    roleFilter?: 'ALL' | ManagedUserRole;
    departmentFilter?: string;
    statusFilter?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  } = {}
): DirectoryUser[] {
  const q = (options.query || '').trim().toLowerCase();
  const roleFilter = options.roleFilter || 'ALL';
  const departmentFilter = options.departmentFilter || 'ALL';
  const statusFilter = options.statusFilter || 'ALL';

  return users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (
      departmentFilter !== 'ALL' &&
      u.department.toLowerCase() !== departmentFilter.toLowerCase()
    ) {
      return false;
    }
    if (statusFilter === 'ACTIVE' && u.is_active === false) return false;
    if (statusFilter === 'INACTIVE' && u.is_active !== false) return false;
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      (u.manager_name || '').toLowerCase().includes(q)
    );
  });
}

export function validateNewUserForm(input: CreateUserPayload): { valid: boolean; error?: string } {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      error: parsed.error.issues[0]?.message || 'Please check the entered member details.',
    };
  }
  return { valid: true };
}
