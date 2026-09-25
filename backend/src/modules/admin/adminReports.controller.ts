import { Request, Response } from 'express';
import { AdminReportsService } from './adminReports.service';
import { SuccessResponse } from '../../core/http/result';

export class AdminReportsController {
  static async getDashboardKPIs(req: Request, res: Response, next: any) {
    try {
      const result = await AdminReportsService.getDashboardKPIs();
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getAggregations(req: Request, res: Response, next: any) {
    try {
      const result = await AdminReportsService.getAggregations(req.params.type as string, req.query);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async requestExport(req: Request, res: Response, next: any) {
    try {
      const { reportType, query } = req.body;
      const result = await AdminReportsService.requestExport(reportType, query, req.user!.userId);
      res.status(202).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async processExportSync(req: Request, res: Response, next: any) {
    try {
      await AdminReportsService.processExportJob(req.params.jobId as string);
      res.json(SuccessResponse({ message: 'Processed' }, req.id));
    } catch (error) { next(error); }
  }
}
