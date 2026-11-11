export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  department: string;
  manager_id?: string | null;
  reset_token?: string | null;
  reset_token_expires_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<User, 'password_hash' | 'reset_token' | 'reset_token_expires_at'>;

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  department?: string;
}
