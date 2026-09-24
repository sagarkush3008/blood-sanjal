import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { SuccessResponse } from '../../core/http/result';
import { updateProfileSchema } from './user.validation';
import { AppError } from '../../core/errors/appError';

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const profile = await UserService.getProfile(req.user.userId);
      res.status(200).json(SuccessResponse(profile, req.id));
    } catch (error) { next(error); }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      
      const parsedData = updateProfileSchema.safeParse(req.body);
      if (!parsedData.success) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Invalid data', parsedData.error.errors);
      }

      const updated = await UserService.updateProfile(req.user.userId, parsedData.data as any);
      res.status(200).json(SuccessResponse(updated, req.id));
    } catch (error) { next(error); }
  }
}
