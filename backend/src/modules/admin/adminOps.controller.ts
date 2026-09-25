import { Request, Response } from 'express';
import { AdminOpsService } from './adminOps.service';
import { SuccessResponse } from '../../core/http/result';

export class AdminOpsController {
  // Campaigns
  static async createCampaign(req: Request, res: Response, next: any) {
    try {
      const result = await AdminOpsService.createCampaign(req.body, req.user!.userId);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateCampaign(req: Request, res: Response, next: any) {
    try {
      const result = await AdminOpsService.updateCampaign(req.params.id as string, req.body, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateCampaignStatus(req: Request, res: Response, next: any) {
    try {
      const result = await AdminOpsService.updateCampaignStatus(req.params.id as string, req.body.status, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  // Notifications
  static async createBroadcast(req: Request, res: Response, next: any) {
    try {
      const result = await AdminOpsService.createBroadcast(req.body, req.user!.userId);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async cancelBroadcast(req: Request, res: Response, next: any) {
    try {
      const result = await AdminOpsService.cancelBroadcast(req.params.id as string, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async processBroadcastSync(req: Request, res: Response, next: any) {
    // Expose a manual trigger for testing or forced execution
    try {
      await AdminOpsService.processBroadcast(req.params.id as string);
      res.json(SuccessResponse({ message: 'Processed' }, req.id));
    } catch (error) { next(error); }
  }

  // Rewards
  static async issueReward(req: Request, res: Response, next: any) {
    try {
      const { donorProfileId, badgeType, milestone, notes } = req.body;
      const result = await AdminOpsService.issueReward(donorProfileId, badgeType, milestone, notes, req.user!.userId);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
