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

  static async initiate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const { amountMinor, purpose, currency, gateway, idempotencyKey, metadata } = req.body;
      const result = await PaymentService.initiatePayment({
        userId: req.user.userId,
        amountMinor: Number(amountMinor),
        purpose,
        currency,
        gateway,
        idempotencyKey,
        metadata
      });
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.id as string;
      const result = await PaymentService.getPaymentById(paymentId, req.user?.userId, req.user?.role);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getAdminSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.getAdminPaymentSummary();
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

  static async getAdminPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.id as string;
      const result = await PaymentService.getPaymentById(paymentId, req.user?.userId, req.user?.role || 'ADMIN');
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async adminRefund(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const paymentId = req.params.id as string;
      const { reason } = req.body;
      const result = await PaymentService.refundPayment(paymentId, req.user.userId, reason);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}



