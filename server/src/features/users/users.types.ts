export type ManagedUserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type UserRole = ManagedUserRole;

export interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  manager_id: string | null;
  manager_name: string | null;
  reporting_admin_id: string | null;
  reporting_admin_name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateManagedUserDto {
  name: string;
  email: string;
  password: string;
  role: ManagedUserRole;
  department: string;
  managerId?: string | null;
  reportingAdminId?: string | null;
}

export interface UpdateManagedUserDto {
  role?: ManagedUserRole;
  department?: string;
  managerId?: string | null;
  reportingAdminId?: string | null;
  isActive?: boolean;
}
