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

  static async getBloodBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const banks = [
        {
          id: '1',
          name: 'Central Blood Transfusion Service (Nepal Red Cross)',
          type: 'National Central Bank',
          address: 'Exhibition Road, Bhrikutimandap, Kathmandu',
          distance: '1.2 km away',
          phone: '+97714225344',
          hours: 'Open 24 Hours / 7 Days',
          status: 'AMPLE',
          availableGroups: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'],
        },
        {
          id: '2',
          name: 'TU Teaching Hospital Blood Bank',
          type: 'Government Teaching Hospital',
          address: 'Maharajgunj, Kathmandu',
          distance: '3.8 km away',
          phone: '+97714412303',
          hours: 'Open 24 Hours / 7 Days',
          status: 'MODERATE',
          availableGroups: ['A+', 'B+', 'O+', 'AB+'],
        },
        {
          id: '3',
          name: 'Patan Hospital Blood Transfusion Center',
          type: 'Community Hospital Center',
          address: 'Lagankhel, Lalitpur',
          distance: '4.5 km away',
          phone: '+97715522266',
          hours: 'Open 24 Hours / 7 Days',
          status: 'URGENT',
          availableGroups: ['B+', 'O-'],
        },
        {
          id: '4',
          name: 'Bir Hospital Emergency Blood Storage',
          type: 'Central Government Hospital',
          address: 'Kanti Path, Kathmandu',
          distance: '2.1 km away',
          phone: '+97714221119',
          hours: 'Open 24 Hours / 7 Days',
          status: 'AMPLE',
          availableGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'AB+'],
        },
        {
          id: '5',
          name: 'Bhaktapur Cancer Hospital Blood Bank',
          type: 'Specialized Oncology Center',
          address: 'Dudhpati, Bhaktapur',
          distance: '12.4 km away',
          phone: '+97716611532',
          hours: 'Open 24 Hours / 7 Days',
          status: 'URGENT',
          availableGroups: ['O+', 'AB-'],
        },
      ];
      res.status(200).json(SuccessResponse(banks, req.id));
    } catch (error) { next(error); }
  }
}
