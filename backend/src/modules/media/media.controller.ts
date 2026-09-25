import { Request, Response, NextFunction } from 'express';
import { MediaService } from './media.service';
import { FilePurpose } from './fileAsset.model';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class MediaController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'User not authenticated');
      
      const purpose = req.body.purpose as FilePurpose;
      const entityId = req.body.entityId as string;
      const file = req.file;

      if (!purpose || !entityId) {
        throw new AppError(400, 'BAD_REQUEST', 'Missing purpose or entityId');
      }

      if (!file) {
        throw new AppError(400, 'BAD_REQUEST', 'Missing file');
      }

      const asset = await MediaService.uploadFile(req.user.userId, file, purpose, entityId);
      res.status(201).json(SuccessResponse(asset, req.id));
    } catch (error) { next(error); }
  }

  static async getSignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'User not authenticated');
      
      const assetId = req.params.assetId as string;
      const url = await MediaService.getSignedUrl(req.user.userId, assetId);
      
      res.status(200).json(SuccessResponse({ url }, req.id));
    } catch (error) { next(error); }
  }

  static async deleteAsset(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'User not authenticated');
      
      const assetId = req.params.assetId as string;
      await MediaService.deleteAsset(req.user.userId, assetId);
      
      res.status(200).json(SuccessResponse({ success: true }, req.id));
    } catch (error) { next(error); }
  }
}
