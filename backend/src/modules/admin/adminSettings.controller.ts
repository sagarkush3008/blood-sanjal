import { Request, Response } from 'express';
import { SettingsService } from './settings.service';
import { SuccessResponse } from '../../core/http/result';
import { AuditService } from '../audit/audit.service';

export class AdminSettingsController {
  static async getSettings(req: Request, res: Response, next: any) {
    try {
      const result = await SettingsService.getSettings();
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateSettings(req: Request, res: Response, next: any) {
    try {
      const result = await SettingsService.updateSettings(req.body, req.user!.userId, req);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getAuditLogs(req: Request, res: Response, next: any) {
    try {
      const result = await AuditService.getLogs(req.query);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
