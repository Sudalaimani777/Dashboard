import { z } from 'zod';

export const USER_NAME_REGEX = /^(?=.*[A-Za-z])[A-Za-z\s'-]+$/;

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be 2–100 characters (letters, spaces, hyphens, and apostrophes only).')
    .max(100, 'Name must be 2–100 characters (letters, spaces, hyphens, and apostrophes only).')
    .regex(
      USER_NAME_REGEX,
      'Name must be 2–100 characters (letters, spaces, hyphens, and apostrophes only).'
    )
    .refine(
      (val) => (val.match(/[A-Za-z]/g) || []).length >= 2,
      'Name must contain at least 2 letters.'
    ),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter a valid work email address.')
    .email('Please enter a valid work email address.'),
  password: z
    .string()
    .min(8, 'Initial password must be at least 8 characters long.')
    .refine(
      (p) => p.trim().length >= 8,
      'Initial password cannot be blank spaces or contain only whitespace.'
    ),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  department: z
    .string()
    .trim()
    .min(2, 'Department must be between 2 and 80 characters.')
    .max(80, 'Department must be between 2 and 80 characters.')
    .refine(
      (d) => /[A-Za-z0-9]/.test(d),
      'Department must contain valid alphanumeric characters.'
    ),
  managerId: z.string().optional().nullable(),
  reportingAdminId: z.string().optional().nullable(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  department: z
    .string()
    .trim()
    .min(2, 'Department must be between 2 and 80 characters.')
    .max(80, 'Department must be between 2 and 80 characters.')
    .refine(
      (d) => /[A-Za-z0-9]/.test(d),
      'Department must contain valid alphanumeric characters.'
    ),
  managerId: z.string().optional().nullable(),
  reportingAdminId: z.string().optional().nullable(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
