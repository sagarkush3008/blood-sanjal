import { Request, Response, NextFunction } from 'express';
import { BloodRequestService } from './bloodRequest.service';
import { SuccessResponse } from '../../core/http/result';
import { createBloodRequestSchema, updateBloodRequestSchema } from './bloodRequest.validation';
import { AppError } from '../../core/errors/appError';

export class BloodRequestController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const parsedData = createBloodRequestSchema.safeParse(req.body);
      if (!parsedData.success) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Invalid data', parsedData.error.issues);
      }

      const result = await BloodRequestService.createRequest(req.user.userId, parsedData.data);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const parsedData = updateBloodRequestSchema.safeParse(req.body);
      if (!parsedData.success) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Invalid data', parsedData.error.issues);
      }

      const result = await BloodRequestService.updateRequest(req.params.id as string, req.user.userId, parsedData.data);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await BloodRequestService.cancelRequest(req.params.id as string, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const { activate } = req.body;
      const result = await BloodRequestService.verifyRequest(req.params.id as string, req.user.userId, activate);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async fulfill(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const { units } = req.body;
      if (!units || units < 1) throw new AppError(400, 'BAD_REQUEST', 'Invalid units');
      
      const result = await BloodRequestService.fulfillUnits(req.params.id as string, units, req.user.userId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
