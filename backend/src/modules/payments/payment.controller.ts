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

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const { transactionId, gatewayTxId } = req.body;
      
      if (!transactionId || !gatewayTxId) {
        throw new AppError(400, 'BAD_REQUEST', 'Missing transaction details');
      }

      const result = await PaymentService.verifyTransaction(transactionId, gatewayTxId, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
