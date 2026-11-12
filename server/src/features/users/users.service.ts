import bcrypt from 'bcryptjs';
import { usersRepository, UsersRepository } from './users.repository.js';
import { UserDirectoryItem } from './users.types.js';
import {
  UserValidationError,
  validateCreateUserInput,
  validateUpdateUserInput,
} from './users.validation.js';

export class UsersService {
  constructor(private repo: UsersRepository = usersRepository) {}

  private async assertValidManager(managerId: string | null | undefined, targetUserId?: string) {
    if (!managerId) return;
    if (targetUserId && managerId === targetUserId) {
      throw new UserValidationError('A user cannot be assigned as their own reporting manager.', 400);
    }
    const manager = await this.repo.findById(managerId);
    if (!manager) {
      throw new UserValidationError('Selected reporting manager does not exist.', 400);
    }
    if (manager.role !== 'MANAGER') {
      throw new UserValidationError('Assigned reporting manager must hold the MANAGER role.', 400);
    }
  }

  async listUsers(): Promise<UserDirectoryItem[]> {
    return this.repo.listAll();
  }

  async createUser(rawInput: unknown): Promise<UserDirectoryItem> {
    const dto = validateCreateUserInput(rawInput);

    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new UserValidationError('An account with this email already exists.', 409);
    }

    const effectiveManagerId = dto.role === 'EMPLOYEE' ? dto.managerId ?? null : dto.managerId ?? null;
    await this.assertValidManager(effectiveManagerId);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.repo.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
      department: dto.department,
      managerId: effectiveManagerId,
    });
  }

  async updateUser(
    targetUserId: string,
    actorUserId: string,
    rawInput: unknown
  ): Promise<UserDirectoryItem> {
    const existing = await this.repo.findById(targetUserId);
    if (!existing) {
      throw new UserValidationError('User not found.', 404);
    }

    const dto = validateUpdateUserInput(rawInput);

    if (targetUserId === actorUserId && dto.role !== undefined) {
      throw new UserValidationError('Administrators cannot change or demote their own role.', 400);
    }

    if (existing.role === 'ADMIN' && dto.role !== undefined) {
      throw new UserValidationError('Administrator accounts cannot be demoted via user management.', 400);
    }

    if (dto.managerId !== undefined) {
      await this.assertValidManager(dto.managerId, targetUserId);
    }

    const updated = await this.repo.updateUser(targetUserId, dto);
    if (!updated) {
      throw new UserValidationError('User not found.', 404);
    }
    return updated;
  }
}

export const usersService = new UsersService();
