import { Request, Response, NextFunction } from 'express';
import { DonationService } from './donation.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class DonationController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await DonationService.submitDonation(req.user.userId, req.body);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const { action, reason } = req.body;
      const result = await DonationService.verifyDonation(req.params.id as string, req.user.userId, action, reason);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query;
      const result = await DonationService.getHistory(filters);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonationService.getDetail(req.params.id as string);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
