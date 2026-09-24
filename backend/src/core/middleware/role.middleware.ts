import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appError';

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'User not authenticated'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource'));
    }

    next();
  };
};

export const requireAdmin = requireRoles(['ADMIN']);
