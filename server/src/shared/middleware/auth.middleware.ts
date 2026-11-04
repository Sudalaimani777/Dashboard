import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { JwtPayload } from '../../features/auth/auth.types.js';
import { sendError } from '../utils/response.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(
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
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired authorization token.', 401);
  }
}
