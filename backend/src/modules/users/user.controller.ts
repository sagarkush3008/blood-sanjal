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
        throw new AppError(422, 'VALIDATION_ERROR', 'Invalid data', parsedData.error.issues);
      }

      const updated = await UserService.updateProfile(req.user.userId, parsedData.data as any);
      res.status(200).json(SuccessResponse(updated, req.id));
    } catch (error) { next(error); }
  }

  static async getPrivacy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const privacy = await UserService.getPrivacy(req.user.userId);
      res.status(200).json(SuccessResponse(privacy, req.id));
    } catch (error) { next(error); }
  }

  static async updatePrivacy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const updated = await UserService.updatePrivacy(req.user.userId, req.body);
      res.status(200).json(SuccessResponse(updated, req.id));
    } catch (error) { next(error); }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      
      const file = req.file;
      if (!file) {
        throw new AppError(400, 'VALIDATION_ERROR', 'No image file provided');
      }

      const cloudinary = require('cloudinary').v2;
      const User = require('./user.model').User;

      console.log(`Starting Cloudinary upload for user: ${req.user.userId}`);
      
      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'blood_sanjal/avatars', width: 400, height: 400, crop: 'fill' },
          (error: any, result: any) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(file.buffer);
      });

      const avatarUrl = uploadResult.secure_url;
      console.log(`Cloudinary upload success: ${avatarUrl}`);

      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { avatar_url: avatarUrl },
        { new: true }
      ).select('-passwordHash');

      if (!updatedUser) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      }

      res.status(200).json(SuccessResponse(updatedUser, req.id));
    } catch (error: any) {
      console.error('Backend avatar upload crashed:', error.message || error);
      next(error);
    }
  }
}
