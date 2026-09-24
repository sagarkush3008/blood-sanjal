import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appError';
import { ErrorResponse } from '../http/result';
import { logger } from '../../config/logger.config';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.id || 'unknown';

  if (err instanceof AppError) {
    logger.warn(`[${requestId}] AppError: ${err.message}`);
    return res.status(err.statusCode).json(ErrorResponse(err.code, err.message, err.details, requestId));
  }

  logger.error(`[${requestId}] Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json(ErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', [], requestId));
};
