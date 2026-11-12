import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';
import { usersService, UsersService } from './users.service.js';
import { UserValidationError } from './users.validation.js';

export class UsersController {
  constructor(private service: UsersService = usersService) {}

  listUsers = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await this.service.listUsers();
      return sendSuccess(res, { users }, 'Users retrieved successfully');
    } catch (err) {
      return sendError(res, (err as Error).message || 'Failed to load users', 500);
    }
  };

  createUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await this.service.createUser(req.body);
      return sendSuccess(res, { user }, 'User created successfully', 201);
    } catch (err) {
      const statusCode = err instanceof UserValidationError ? err.statusCode : 400;
      return sendError(res, (err as Error).message, statusCode);
    }
  };

  updateUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetId = String(req.params.id || '');
      const actorId = req.user?.userId || '';
      const user = await this.service.updateUser(targetId, actorId, req.body);
      return sendSuccess(res, { user }, 'User updated successfully');
    } catch (err) {
      const statusCode = err instanceof UserValidationError ? err.statusCode : 400;
      return sendError(res, (err as Error).message, statusCode);
    }
  };
}

export const usersController = new UsersController();
