import { CreateManagedUserDto, UpdateManagedUserDto } from './users.types.js';

const NAME_REGEX = /^(?=.*[A-Za-z])[A-Za-z\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UserValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'UserValidationError';
    this.statusCode = statusCode;
  }
}

export function validateCreateUserInput(raw: any): CreateManagedUserDto {
  const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
  const email = typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const password = typeof raw?.password === 'string' ? raw.password : '';
  const role = raw?.role;
  const department = typeof raw?.department === 'string' ? raw.department.trim() : '';
  const managerId = raw?.managerId ? String(raw.managerId).trim() : null;
  const reportingAdminId = raw?.reportingAdminId ? String(raw.reportingAdminId).trim() : null;

  if (name.length < 2 || name.length > 100 || !NAME_REGEX.test(name) || (name.match(/[A-Za-z]/g) || []).length < 2) {
    throw new UserValidationError(
      'Name must be 2–100 characters and contain only letters, spaces, hyphens, and apostrophes.'
    );
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new UserValidationError('Please provide a valid work email address.');
  }
  if (password.trim().length < 8) {
    throw new UserValidationError('Initial password must be at least 8 characters long and cannot be only whitespace.');
  }
  if (role !== 'EMPLOYEE' && role !== 'MANAGER' && role !== 'ADMIN') {
    throw new UserValidationError('Role must be EMPLOYEE, MANAGER, or ADMIN.');
  }
  if (department.length < 2 || department.length > 80 || !/[A-Za-z0-9]/.test(department)) {
    throw new UserValidationError('Department must be between 2 and 80 characters.');
  }
  const effectiveManagerId = role === 'EMPLOYEE' ? managerId : null;
  if (effectiveManagerId !== null && !UUID_REGEX.test(effectiveManagerId)) {
    throw new UserValidationError('Invalid reporting manager ID format.');
  }
  const effectiveReportingAdminId = role === 'MANAGER' ? reportingAdminId : null;
  if (effectiveReportingAdminId !== null && !UUID_REGEX.test(effectiveReportingAdminId)) {
    throw new UserValidationError('Invalid reporting admin ID format.');
  }

  return {
    name,
    email,
    password,
    role,
    department,
    managerId: effectiveManagerId,
    reportingAdminId: effectiveReportingAdminId,
  };
}

export function validateUpdateUserInput(raw: any): UpdateManagedUserDto {
  const dto: UpdateManagedUserDto = {};

  if (raw?.role !== undefined) {
    if (raw.role !== 'EMPLOYEE' && raw.role !== 'MANAGER' && raw.role !== 'ADMIN') {
      throw new UserValidationError('Role must be EMPLOYEE, MANAGER, or ADMIN.');
    }
    dto.role = raw.role;
  }

  if (raw?.department !== undefined) {
    const department = typeof raw.department === 'string' ? raw.department.trim() : '';
    if (department.length < 2 || department.length > 80 || !/[A-Za-z0-9]/.test(department)) {
      throw new UserValidationError('Department must be between 2 and 80 characters.');
    }
    dto.department = department;
  }

  if (raw?.managerId !== undefined) {
    if (raw.managerId === null || raw.managerId === '') {
      dto.managerId = null;
    } else {
      const managerId = String(raw.managerId).trim();
      if (!UUID_REGEX.test(managerId)) {
        throw new UserValidationError('Invalid reporting manager ID format.');
      }
      dto.managerId = managerId;
    }
  }

  if (raw?.reportingAdminId !== undefined) {
    if (raw.reportingAdminId === null || raw.reportingAdminId === '') {
      dto.reportingAdminId = null;
    } else {
      const reportingAdminId = String(raw.reportingAdminId).trim();
      if (!UUID_REGEX.test(reportingAdminId)) {
        throw new UserValidationError('Invalid reporting admin ID format.');
      }
      dto.reportingAdminId = reportingAdminId;
    }
  }

  if (
    dto.role === undefined &&
    dto.department === undefined &&
    dto.managerId === undefined &&
    dto.reportingAdminId === undefined
  ) {
    throw new UserValidationError(
      'Provide at least one field to update (role, department, managerId, or reportingAdminId).'
    );
  }

  return dto;
}
