import { Request, Response, NextFunction } from 'express';
import { CampaignService } from './campaign.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class CampaignController {
  // Admin Methods
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.createCampaign(req.user.userId, req.body);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const { status } = req.body;
      const result = await CampaignService.updateCampaignStatus(req.params.id, req.user.userId, status);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async notifyUsers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.notifyTargetUsers(req.params.id, req.user.userId);
      res.status(200).json(SuccessResponse({ notifiedCount: result }, req.id));
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CampaignService.deleteCampaign(req.params.id);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  // Public/User Methods
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CampaignService.listPublicCampaigns(req.query);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CampaignService.getCampaignDetails(req.params.id);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.registerForCampaign(req.params.id, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
