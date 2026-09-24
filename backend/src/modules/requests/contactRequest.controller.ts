import { Request, Response, NextFunction } from 'express';
import { ContactRequestService } from './contactRequest.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class ContactRequestController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const { donorId, message } = req.body;
      const result = await ContactRequestService.createRequest(req.user.userId, donorId, message);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async accept(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await ContactRequestService.acceptRequest(req.params.id as string, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async decline(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await ContactRequestService.declineRequest(req.params.id as string, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
