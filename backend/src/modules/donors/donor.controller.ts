import { Request, Response, NextFunction } from 'express';
import { DonorService } from './donor.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class DonorController {
  static async upsertMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const profile = await DonorService.upsertProfile(req.user.userId, req.body);
      res.status(200).json(SuccessResponse(profile, req.id));
    } catch (error) { next(error); }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const profile = await DonorService.getProfile(req.user.userId);
      res.status(200).json(SuccessResponse(profile, req.id));
    } catch (error) { next(error); }
  }

  static async logDonation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await DonorService.logDonation(req.user.userId, req.body);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query;
      const result = await DonorService.searchPublicDonors(filters);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
