import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Unhandled Application Error:', err);
  return sendError(res, err.message || 'Internal Server Error', 500);
}
