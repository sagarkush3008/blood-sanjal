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

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.updateCampaign(req.params.id as string, req.body, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const { status } = req.body;
      const result = await CampaignService.updateCampaignStatus(req.params.id as string, req.user.userId, status);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async notifyUsers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.notifyTargetUsers(req.params.id as string, req.user.userId);
      res.status(200).json(SuccessResponse({ notifiedCount: result }, req.id));
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CampaignService.deleteCampaign(req.params.id as string);
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

  static async listMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.listMyCampaigns(req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CampaignService.getCampaignDetails(req.params.id as string, req.user?.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.registerForCampaign(req.params.id as string, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.withdrawFromCampaign(req.params.id as string, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async setReminder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.scheduleCampaignReminder(req.params.id as string, req.user.userId, req.body);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getParticipants(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CampaignService.getCampaignParticipants(req.params.id as string, req.query);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await CampaignService.updateParticipantStatus(
        req.params.id as string,
        req.params.participantId as string,
        req.body.status,
        req.user.userId
      );
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
