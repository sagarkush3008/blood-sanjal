import { DonorProfile } from './donorProfile.model';
import { DonationRecord } from './donationRecord.model';
import { User } from '../users/user.model';
import { toPublicDonorDTO } from './donor.dto';
import { AppError } from '../../core/errors/appError';

export class DonorService {
  static async upsertProfile(userId: string, data: any) {
    // Prevent forced selection of protected aggregate fields
    delete data.totalDonations; 
    delete data.isVerified;

    const profile = await DonorProfile.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );
    return profile;
  }

  static async getProfile(userId: string) {
    const profile = await DonorProfile.findOne({ userId });
    if (!profile) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');
    return profile;
  }

  static async updateAvailability(userId: string, data: { status: 'ACTIVE' | 'INACTIVE', durationHours?: number, durationDays?: number, reason?: string }) {
    const profile = await DonorProfile.findOne({ userId });
    if (!profile) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');

    if (data.status === 'ACTIVE') {
      profile.donorStatus = 'ACTIVE';
      profile.inactiveUntil = undefined;
      profile.inactiveReason = undefined;
    } else if (data.status === 'INACTIVE') {
      profile.donorStatus = 'INACTIVE';
      if (data.reason) profile.inactiveReason = data.reason;
      
      let inactiveUntil = undefined;
      if (data.durationHours || data.durationDays) {
        const now = new Date();
        if (data.durationHours) now.setHours(now.getHours() + data.durationHours);
        if (data.durationDays) now.setDate(now.getDate() + data.durationDays);
        inactiveUntil = now;
      }
      profile.inactiveUntil = inactiveUntil;
    } else {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status. Must be ACTIVE or INACTIVE.');
    }
    
    await profile.save();

    const { AuditLog } = await import('../audit/auditLog.model');
    await AuditLog.create({
      actorId: userId,
      action: data.status === 'ACTIVE' ? 'DONOR_AVAILABLE' : 'DONOR_UNAVAILABLE',
      entityType: 'DonorProfile',
      entityId: profile._id,
      metadata: { 
        status: data.status,
        durationHours: data.durationHours,
        durationDays: data.durationDays,
        reason: data.reason ? 'REDACTED' : undefined 
      }
    });

    return profile;
  }


  static async searchPublicDonors(filters: any) {
    const profileQuery: any = {
      $or: [
        { donorStatus: 'ACTIVE' },
        { donorStatus: 'INACTIVE', inactiveUntil: { $lt: new Date() } }
      ]
    };
    if (filters.bloodGroup) profileQuery.bloodGroup = filters.bloodGroup;

    const userQuery: any = { status: 'ACTIVE', 'privacySettings.donorSearchVisibility': true };
    if (filters.provinceId) userQuery.provinceId = filters.provinceId;
    if (filters.districtId) userQuery.districtId = filters.districtId;
    if (filters.cityId) userQuery.cityId = filters.cityId;
    if (filters.areaId) userQuery.areaId = filters.areaId;

    if (filters.lon && filters.lat) {
       userQuery.locationCoordinates = {
         $near: {
           $geometry: { type: 'Point', coordinates: [parseFloat(filters.lon), parseFloat(filters.lat)] },
           $maxDistance: parseInt(filters.distance) || 5000,
         }
       };
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find(userQuery).select('_id name provinceId districtId cityId areaId email phone locationCoordinates privacySettings');
    const userIds = users.map(u => u._id);

    profileQuery.userId = { $in: userIds };

    const donors = await DonorProfile.find(profileQuery)
      .skip(skip)
      .limit(limit)
      .populate('userId');

    const results = donors.map(donor => {
      const user = (donor as any).userId;
      if (!user) return null;
      if (user.privacySettings?.donorSearchVisibility === false) return null;
      return toPublicDonorDTO(donor, user);
    }).filter(Boolean);

    return { results, pagination: { page, limit, count: results.length } };
  }
}
