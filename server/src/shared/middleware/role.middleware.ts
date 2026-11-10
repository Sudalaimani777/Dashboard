// server/src/shared/middleware/role.middleware.ts
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { query } from '../db/pool.js';
import { sendError } from '../utils/response.js';
import { TravelRole } from '../../features/travel/travel.types.js';

export function requireRole(allowedRoles: TravelRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'Authentication required', 401);
    }

    try {
      let role = req.user.role as TravelRole | undefined;

      // If role is missing from token payload, fetch from DB
      if (!role) {
        const userRes = await query('SELECT role, department FROM users WHERE id = $1', [req.user.userId]);
        if (userRes.rows.length === 0) {
          return sendError(res, 'User not found', 404);
        }
        role = userRes.rows[0].role as TravelRole;
        req.user.role = role;
        req.user.department = userRes.rows[0].department;
      }

      if (!allowedRoles.includes(role)) {
        return sendError(
          res,
          `Access forbidden: requires role [${allowedRoles.join(', ')}]. Current role: ${role}`,
          403
        );
      }

      next();
    } catch (err: any) {
      return sendError(res, `Role verification failed: ${err.message}`, 500);
    }
  };
}
