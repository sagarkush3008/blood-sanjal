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
      const action = req.body.action || req.body.verificationStatus || (req.body.status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED');
      const reason = req.body.reason || req.body.rejectionReason;
      const result = await DonationService.verifyDonation(req.params.id as string, req.user.userId, action, reason);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query;
      const result = await DonationService.getHistory(filters, req.user?.userId, req.user?.role);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonationService.getDetail(req.params.id as string, req.user?.userId, req.user?.role);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
