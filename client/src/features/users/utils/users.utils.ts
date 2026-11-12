import { createUserSchema } from '../schemas/users.schema';

export type ManagedUserRole = 'EMPLOYEE' | 'MANAGER';
export type UserRole = ManagedUserRole | 'ADMIN';

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  manager_id: string | null;
  manager_name: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: ManagedUserRole;
  department: string;
  managerId?: string | null;
}

export interface UpdateUserPayload {
  role?: ManagedUserRole;
  department?: string;
  managerId?: string | null;
}

export interface UserDirectoryStats {
  total: number;
  managers: number;
  employees: number;
  unassignedEmployees: number;
}

export function computeUserStats(users: DirectoryUser[]): UserDirectoryStats {
  let managers = 0;
  let employees = 0;
  let unassignedEmployees = 0;

  for (const u of users) {
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
    unassignedEmployees,
  };
}

export function filterDirectoryUsers(
  users: DirectoryUser[],
  options: {
    query?: string;
    roleFilter?: 'ALL' | ManagedUserRole;
    departmentFilter?: string;
  } = {}
): DirectoryUser[] {
  const q = (options.query || '').trim().toLowerCase();
  const roleFilter = options.roleFilter || 'ALL';
  const departmentFilter = options.departmentFilter || 'ALL';

  return users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (
      departmentFilter !== 'ALL' &&
      u.department.toLowerCase() !== departmentFilter.toLowerCase()
    ) {
      return false;
    }
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
