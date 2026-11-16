import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { usersController } from './users.controller.js';

export const usersRoutes = Router();

usersRoutes.get('/', requireAuth, requireRole(['ADMIN']), usersController.listUsers);
usersRoutes.post('/', requireAuth, requireRole(['ADMIN']), usersController.createUser);
usersRoutes.patch('/:id/status', requireAuth, requireRole(['ADMIN']), usersController.updateUserStatus);
usersRoutes.patch('/:id', requireAuth, requireRole(['ADMIN']), usersController.updateUser);
usersRoutes.delete('/:id', requireAuth, requireRole(['ADMIN']), usersController.deleteUser);
