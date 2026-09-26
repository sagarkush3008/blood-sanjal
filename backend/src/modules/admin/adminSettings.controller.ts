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

  static async getSettingByKey(req: Request, res: Response, next: any) {
    try {
      const result = await SettingsService.getSettingByKey(req.params.key as string);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateSettingByKey(req: Request, res: Response, next: any) {
    try {
      const { value } = req.body;
      const result = await SettingsService.updateSettingByKey(req.params.key as string, value, req.user!.userId, req);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getAuditLogs(req: Request, res: Response, next: any) {
    try {
      const result = await AuditService.getLogs(req.query);
      const items = result.data || [];
      res.json(SuccessResponse({ ...result, items, results: items }, req.id));
    } catch (error) { next(error); }
  }
}
