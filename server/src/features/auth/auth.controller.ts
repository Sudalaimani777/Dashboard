import { CookieOptions, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';
import { authService, AuthService } from './auth.service.js';

const COOKIE_NAME = 'token';

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
});

export class AuthController {
  constructor(private service: AuthService = authService) {}

  signup = async (_req: Request, res: Response) => {
    return sendError(
      res,
      'Self-registration is disabled. Please contact your administrator.',
      403
    );
  };

  signin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.service.signin({ email, password });

      res.cookie(COOKIE_NAME, result.token, getCookieOptions());

      return sendSuccess(res, result, 'Signed in successfully', 200);
    } catch (err) {
      const message = (err as Error).message;
      return sendError(res, message, 401);
    }
  };

  signout = async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return sendSuccess(res, null, 'Signed out successfully', 200);
  };

  me = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.userId) {
        return sendError(res, 'Unauthorized', 401);
      }
      const user = await this.service.getProfile(req.user.userId);
      return sendSuccess(res, { user }, 'Profile retrieved successfully', 200);
    } catch (err) {
      return sendError(res, (err as Error).message, 404);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await this.service.forgotPassword({ email });
      return sendSuccess(
        res,
        result.previewUrl ? { previewUrl: result.previewUrl } : null,
        result.message,
        200
      );
    } catch (err) {
      return sendError(res, (err as Error).message, 400);
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.service.resetPassword({ token, newPassword });
      return sendSuccess(res, null, result.message, 200);
    } catch (err) {
      return sendError(res, (err as Error).message, 400);
    }
  };
}

export const authController = new AuthController();
