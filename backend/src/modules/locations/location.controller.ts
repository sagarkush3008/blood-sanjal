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
          name: 'Nepal Red Cross Society Blood Transfusion Center',
          type: 'District Central Blood Bank',
          address: 'Power House Chowk, Birgunj, Parsa',
          distance: '0.8 km away',
          phone: '+97751522194',
          hours: 'Open 24 Hours / 7 Days',
          status: 'AMPLE',
          availableGroups: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'],
        },
        {
          id: '2',
          name: 'Narayani Hospital Blood Bank',
          type: 'Government Regional Hospital',
          address: 'Hospital Road, Birgunj, Parsa',
          distance: '1.2 km away',
          phone: '+97751521993',
          hours: 'Open 24 Hours / 7 Days',
          status: 'AMPLE',
          availableGroups: ['A+', 'B+', 'O+', 'AB+'],
        },
        {
          id: '3',
          name: 'National Medical College & Teaching Hospital Blood Bank',
          type: 'Teaching Hospital Center',
          address: 'Bhediyahi, Birgunj, Parsa',
          distance: '3.5 km away',
          phone: '+97751532261',
          hours: 'Open 24 Hours / 7 Days',
          status: 'MODERATE',
          availableGroups: ['A+', 'B+', 'O+', 'AB+', 'B-'],
        },
        {
          id: '4',
          name: 'Medicity Vayodha Hospital Blood Bank',
          type: 'Private Super Speciality Hospital',
          address: 'Gandak Bypass, Birgunj, Parsa',
          distance: '2.4 km away',
          phone: '+97751580123',
          hours: 'Open 24 Hours / 7 Days',
          status: 'AMPLE',
          availableGroups: ['A+', 'B+', 'O+', 'AB+'],
        },
        {
          id: '5',
          name: 'Ashok Vatika Hospital & Research Center Blood Storage',
          type: 'Emergency Hospital Unit',
          address: 'Maisthan, Birgunj, Parsa',
          distance: '1.6 km away',
          phone: '+97751527788',
          hours: 'Open 24 Hours / 7 Days',
          status: 'URGENT',
          availableGroups: ['B+', 'O+'],
        },
        {
          id: '6',
          name: 'Birgunj Heart & Trauma Center Blood Unit',
          type: 'Specialized Trauma Center',
          address: 'Pipra Chowk, Birgunj, Parsa',
          distance: '2.8 km away',
          phone: '+97751524455',
          hours: 'Open 24 Hours / 7 Days',
          status: 'URGENT',
          availableGroups: ['O+', 'AB-', 'A+'],
        },
      ];
      res.status(200).json(SuccessResponse(banks, req.id));
    } catch (error) { next(error); }
  }
}
