import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class PaymentController {
  static async initiateSearchFee(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await PaymentService.initiateSearchFee(req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { gatewayTxId } = req.body;
      
      if (!gatewayTxId) {
        throw new AppError(400, 'BAD_REQUEST', 'Missing gateway transaction details');
      }

      const result = await PaymentService.handleWebhook(gatewayTxId);
      res.status(200).json(SuccessResponse({ status: result.status }, req.id));
    } catch (error) { next(error); }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await PaymentService.getUserPaymentHistory(req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getAdminReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query;
      const result = await PaymentService.getAdminPaymentReport(filters);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
