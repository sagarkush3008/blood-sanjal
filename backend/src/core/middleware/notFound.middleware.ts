import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appError';

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.originalUrl} not found`));
};
