export type ManagedUserRole = 'EMPLOYEE' | 'MANAGER';
export type UserRole = ManagedUserRole | 'ADMIN';

export interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  manager_id: string | null;
  manager_name: string | null;
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
}

export interface UpdateManagedUserDto {
  role?: ManagedUserRole;
  department?: string;
  managerId?: string | null;
}
