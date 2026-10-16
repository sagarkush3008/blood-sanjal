import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appError';
import { ErrorResponse } from '../http/result';
import { logger } from '../../config/logger.config';
import { env } from '../../config/env.config';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.id || 'unknown';

  if (err instanceof AppError) {
    logger.warn(`[${requestId}] AppError: ${err.message}`);
    return res.status(err.statusCode).json(ErrorResponse(err.code, err.message, err.details, requestId));
  }

  if (err.name === 'ZodError') {
    logger.warn(`[${requestId}] ValidationError: ${err.message}`);
    return res.status(400).json(ErrorResponse('VALIDATION_ERROR', 'Invalid request data', (err as any).errors, requestId));
  }

  if (err.name === 'ValidationError') {
    logger.warn(`[${requestId}] Mongoose ValidationError: ${err.message}`);
    return res.status(400).json(ErrorResponse('VALIDATION_ERROR', err.message, [], requestId));
  }

  logger.error(`[${requestId}] Unhandled Error: ${err.message}`, { stack: err.stack });
  console.error(`[UNHANDLED ERROR ${requestId}]:`, err);
  const msg = env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : `Internal error: ${err.message}`;
  res.status(500).json(ErrorResponse('INTERNAL_ERROR', msg, [], requestId));
};
