import { Location, ILocation } from './location.model';
import { User } from '../users/user.model';
import { AppError } from '../../core/errors/appError';

export class LocationService {
  static async createLocation(data: Partial<ILocation>) {
    if (data.parentId) {
      const parent = await Location.findById(data.parentId);
      if (!parent) throw new AppError(404, 'NOT_FOUND', 'Parent location not found');
      
      const hierarchyRules: Record<string, string[]> = {
        'DISTRICT': ['PROVINCE'],
        'MUNICIPALITY': ['DISTRICT'],
        'AREA': ['MUNICIPALITY'],
        'PROVINCE': [] 
      };

      if (!data.type || !hierarchyRules[data.type].includes(parent.type)) {
        throw new AppError(400, 'INVALID_HIERARCHY', `A ${data.type} cannot have a ${parent.type} as a parent`);
      }
    } else if (data.type !== 'PROVINCE') {
      throw new AppError(400, 'INVALID_HIERARCHY', `${data.type} must have a parent location`);
    }

    return Location.create(data);
  }

  static async getHierarchy(parentId?: string) {
    const query: any = { status: 'ACTIVE' };
    if (parentId) query.parentId = parentId;
    else query.type = 'PROVINCE';
    return Location.find(query).sort({ name: 1 });
  }

  static async searchDonorsByProximity(lon: number, lat: number, maxDistanceMeters: number) {
    const users = await User.find({
      status: 'ACTIVE',
      'privacySettings.donorSearchVisibility': true,
      locationCoordinates: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: maxDistanceMeters,
        },
      },
    }).select('name bloodGroup provinceId districtId cityId areaId privacySettings locationCoordinates');

    // Filter output based on privacy settings
    return users.map(user => {
      const doc = user.toObject();
      if (!doc.privacySettings?.approximateLocationSharing) {
        delete doc.locationCoordinates;
      }
      return doc;
    });
  }
}
