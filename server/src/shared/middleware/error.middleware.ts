import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Unhandled Application Error:', err);
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please contact administrator.'
      : err.message || 'Internal Server Error';
  return sendError(res, message, 500);
}
