import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { JwtPayload } from '../../features/auth/auth.types.js';
import { query } from '../db/pool.js';
import { sendError } from '../utils/response.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  let token: string | undefined;

  // 1. Check HttpOnly cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fall back to Authorization Bearer header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Access denied. No authorization token provided.', 401);
  }

  try {
    const decoded = jwt.verify(
      token,
      config.jwt.secret as jwt.Secret
    ) as unknown as JwtPayload;

    if (!decoded || !decoded.userId) {
      return sendError(res, 'Invalid authorization token payload.', 401);
    }

    // Verify user is active in database (session revocation check)
    const userRes = await query('SELECT is_active, role, department FROM users WHERE id = $1', [decoded.userId]);
    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      return sendError(res, 'Access denied. Account is inactive or has been deactivated.', 401);
    }

    decoded.role = userRes.rows[0].role || decoded.role;
    decoded.department = userRes.rows[0].department || decoded.department;
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired authorization token.', 401);
  }
}
