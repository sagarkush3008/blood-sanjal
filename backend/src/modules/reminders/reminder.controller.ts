import { Request, Response, NextFunction } from 'express';
import { ReminderService } from './reminder.service';
import { SuccessResponse } from '../../core/http/result';

export class ReminderController {
  static async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await ReminderService.getConfig();
      res.status(200).json(SuccessResponse(config, req.id));
    } catch (error) { next(error); }
  }

  static async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await ReminderService.updateConfig(req.body);
      res.status(200).json(SuccessResponse(config.value, req.id));
    } catch (error) { next(error); }
  }

  static async triggerJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const targetDate = req.body.targetDate ? new Date(req.body.targetDate) : undefined;
      const count = await ReminderService.processReminders(targetDate);
      res.status(200).json(SuccessResponse({ processedCount: count }, req.id));
    } catch (error) { next(error); }
  }
}
