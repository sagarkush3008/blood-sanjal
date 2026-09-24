import { Request, Response, NextFunction } from 'express';
import { LocationService } from './location.service';
import { SuccessResponse } from '../../core/http/result';

export class LocationController {
  static async getHierarchy(req: Request, res: Response, next: NextFunction) {
    try {
      const parentId = req.query.parentId as string | undefined;
      const result = await LocationService.getHierarchy(parentId);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async createLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LocationService.createLocation(req.body);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async searchDonors(req: Request, res: Response, next: NextFunction) {
    try {
      const lon = parseFloat(req.query.lon as string);
      const lat = parseFloat(req.query.lat as string);
      const maxDistance = parseInt(req.query.distance as string) || 5000;

      if (isNaN(lon) || isNaN(lat)) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'lon and lat required' } });
      }

      const result = await LocationService.searchDonorsByProximity(lon, lat, maxDistance);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
