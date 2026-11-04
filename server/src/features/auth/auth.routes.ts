import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { authController } from './auth.controller.js';

const router = Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', authController.signout);

// Protected routes
router.get('/me', requireAuth, authController.me);

export const authRoutes = router;
