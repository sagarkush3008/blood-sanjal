import { Request, Response, NextFunction } from 'express';
import { RewardService } from './reward.service';
import { SuccessResponse } from '../../core/http/result';
import { DonorProfile } from '../donors/donorProfile.model';
import { AppError } from '../../core/errors/appError';

export class RewardController {
  static async getMyRewards(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const profile = await DonorProfile.findOne({ userId: req.user.userId });
      if (!profile) return res.status(200).json(SuccessResponse([], req.id));

      const rewards = await RewardService.getUserRewards(profile._id.toString());
      res.status(200).json(SuccessResponse(rewards, req.id));
    } catch (error) { next(error); }
  }

  static async getUserRewards(req: Request, res: Response, next: NextFunction) {
    try {
      const rewards = await RewardService.getUserRewards(req.params.profileId);
      res.status(200).json(SuccessResponse(rewards, req.id));
    } catch (error) { next(error); }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const rewards = await RewardService.getAllRewards(req.query);
      res.status(200).json(SuccessResponse(rewards, req.id));
    } catch (error) { next(error); }
  }

  static async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await RewardService.getConfig();
      res.status(200).json(SuccessResponse(config, req.id));
    } catch (error) { next(error); }
  }

  static async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await RewardService.updateConfig(req.body);
      res.status(200).json(SuccessResponse(config.value, req.id));
    } catch (error) { next(error); }
  }
}
