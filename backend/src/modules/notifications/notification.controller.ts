import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await NotificationService.listUserNotifications(req.user.userId, req.query);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const count = await NotificationService.getUnreadCount(req.user.userId);
      res.status(200).json(SuccessResponse({ unreadCount: count }, req.id));
    } catch (error) { next(error); }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await NotificationService.markAsRead(req.params.id as string, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const count = await NotificationService.markAllAsRead(req.user.userId);
      res.status(200).json(SuccessResponse({ modifiedCount: count }, req.id));
    } catch (error) { next(error); }
  }
}
