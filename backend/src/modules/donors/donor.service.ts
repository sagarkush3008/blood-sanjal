import { DonorProfile } from './donorProfile.model';
import { DonationRecord } from './donationRecord.model';
import { User } from '../users/user.model';
import { toPublicDonorDTO } from './donor.dto';
import { AppError } from '../../core/errors/appError';
import { activeStatusService } from '../activeStatus/activeStatus.service';

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
    let profile = await DonorProfile.findOne({ userId });
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
      if (user.bloodGroup) {
        profile = await DonorProfile.create({
          userId,
          bloodGroup: user.bloodGroup,
          donorStatus: 'INACTIVE',
        });
      } else {
        throw new AppError(404, 'NOT_FOUND', 'Donor profile not found. Please set your blood group first.');
      }
    }
    return profile;
  }

  static async updateAvailability(userId: string, data: { status: 'ACTIVE' | 'INACTIVE', durationHours?: number, durationDays?: number, reason?: string }) {
    let profile = await DonorProfile.findOne({ userId });
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
      if (!user.bloodGroup) throw new AppError(400, 'VALIDATION_ERROR', 'You must set your blood group before managing donor availability.');
      profile = await DonorProfile.create({
        userId,
        bloodGroup: user.bloodGroup,
        donorStatus: 'INACTIVE',
      });
    }

    const now = new Date();
    profile.lastStatusChangedAt = now;
    profile.lastStatusChangedBy = profile.userId;

    if (data.status === 'ACTIVE') {
      profile.donorStatus = 'ACTIVE';
      profile.availabilityMode = 'AVAILABLE';
      profile.inactiveUntil = null;
      profile.inactiveReason = null;
      profile.inactiveUnit = null;
      profile.inactiveDuration = null;
      profile.inactiveStartedAt = null;
    } else if (data.status === 'INACTIVE') {
      profile.donorStatus = 'INACTIVE';
      profile.inactiveStartedAt = now;
      
      if (data.reason) profile.inactiveReason = data.reason;
      else profile.inactiveReason = null;
      
      let inactiveUntil = null;
      if (data.durationHours !== undefined || data.durationDays !== undefined) {
        profile.availabilityMode = 'TEMPORARY_INACTIVE';
        if (data.durationHours !== undefined) {
          if (data.durationHours < 1 || data.durationHours > 72) throw new AppError(400, 'VALIDATION_ERROR', 'durationHours must be between 1 and 72');
          profile.inactiveUnit = 'HOURS';
          profile.inactiveDuration = data.durationHours;
          const target = new Date(now);
          target.setHours(target.getHours() + data.durationHours);
          inactiveUntil = target;
        } else if (data.durationDays !== undefined) {
          if (data.durationDays < 1 || data.durationDays > 90) throw new AppError(400, 'VALIDATION_ERROR', 'durationDays must be between 1 and 90');
          profile.inactiveUnit = 'DAYS';
          profile.inactiveDuration = data.durationDays;
          const target = new Date(now);
          target.setDate(target.getDate() + data.durationDays);
          inactiveUntil = target;
        }
      } else {
        profile.availabilityMode = 'INDEFINITE_INACTIVE';
        profile.inactiveUnit = null;
        profile.inactiveDuration = null;
      }
      profile.inactiveUntil = inactiveUntil;
    } else {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status. Must be ACTIVE or INACTIVE.');
    }
    
    await profile.save();

    // Sync with real-time active status service
    try {
      activeStatusService.updateDonorStatus(userId, {
        status: data.status,
        inactiveHours: data.durationHours,
        inactiveDays: data.durationDays,
        inactiveReason: data.reason,
        changedBy: userId
      });
    } catch (e) {
      console.error("Failed to sync donor status to activeStatusService:", e);
    }

    const { AuditLog } = await import('../audit/auditLog.model');
    await AuditLog.create({
      actorId: userId,
      action: data.status === 'ACTIVE' ? 'DONOR_AVAILABLE' : 'DONOR_UNAVAILABLE',
      entityType: 'DonorProfile',
      entityId: profile._id.toString(),
      metadata: { 
        status: data.status,
        durationHours: data.durationHours,
        durationDays: data.durationDays,
        reason: data.reason ? 'REDACTED' : undefined 
      }
    });

    return profile;
  }

  static async updateStatus(userId: string, data: { status: 'ACTIVE' | 'INACTIVE' }) {
    let profile = await DonorProfile.findOne({ userId });
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
      if (!user.bloodGroup) throw new AppError(400, 'VALIDATION_ERROR', 'You must set your blood group before managing donor status.');
      profile = await DonorProfile.create({
        userId,
        bloodGroup: user.bloodGroup,
        donorStatus: 'INACTIVE',
      });
    }

    const oldStatus = profile.donorStatus;
    const now = new Date();
    profile.lastStatusChangedAt = now;
    profile.lastStatusChangedBy = profile.userId;

    if (data.status === 'ACTIVE') {
      profile.donorStatus = 'ACTIVE';
      profile.availabilityMode = 'AVAILABLE';
      profile.inactiveUntil = null;
      profile.inactiveReason = null;
      profile.inactiveUnit = null;
      profile.inactiveDuration = null;
      profile.inactiveStartedAt = null;
    } else if (data.status === 'INACTIVE') {
      profile.donorStatus = 'INACTIVE';
      profile.availabilityMode = 'INDEFINITE_INACTIVE';
      profile.inactiveStartedAt = now;
      profile.inactiveUntil = null;
      profile.inactiveReason = null;
      profile.inactiveUnit = null;
      profile.inactiveDuration = null;
    }
    
    await profile.save();

    // Sync with real-time active status service
    try {
      activeStatusService.updateDonorStatus(userId, {
        status: data.status,
        changedBy: userId
      });
    } catch (e) {
      console.error("Failed to sync donor status to activeStatusService:", e);
    }

    const { AuditLog } = await import('../audit/auditLog.model');
    await AuditLog.create({
      actorId: userId,
      action: 'DONOR_STATUS_CHANGED',
      entityType: 'DonorProfile',
      entityId: profile._id.toString(),
      metadata: { 
        oldStatus,
        newStatus: data.status,
        timestamp: now
      }
    });

    return profile;
  }


  static async processAutoExpirations() {
    const expiredDonors = await DonorProfile.find({
      donorStatus: 'INACTIVE',
      inactiveUntil: { $lt: new Date() }
    });

    if (expiredDonors.length === 0) return 0;

    const now = new Date();
    const { AuditLog } = await import('../audit/auditLog.model');

    for (const donor of expiredDonors) {
      const oldStatus = donor.donorStatus;
      const oldReason = donor.inactiveReason;

      donor.donorStatus = 'ACTIVE';
      donor.availabilityMode = 'AVAILABLE';
      donor.inactiveUntil = null as any;
      donor.inactiveReason = null as any;
      donor.inactiveUnit = null as any;
      donor.inactiveDuration = null as any;
      donor.lastStatusChangedAt = now;
      donor.lastStatusChangedBy = donor.userId;

      await donor.save();

      await AuditLog.create({
        actorId: donor.userId,
        action: 'DONOR_AVAILABLE',
        entityType: 'DonorProfile',
        entityId: donor._id.toString(),
        metadata: {
          oldStatus,
          newStatus: 'ACTIVE',
          reason: `Auto-restored to Active after scheduled pause elapsed (${oldReason || 'Timed snooze completed'})`,
          timestamp: now
        }
      });

      try {
        activeStatusService.updateDonorStatus(donor.userId.toString(), {
          status: 'ACTIVE',
          changedBy: 'auto_engine'
        });
      } catch (e) {
        console.error("Failed to sync auto-expiration to activeStatusService:", e);
      }
    }

    return expiredDonors.length;
  }

  static async searchPublicDonors(filters: any) {
    const profileQuery: any = {
      $or: [
        { donorStatus: 'ACTIVE' },
        { donorStatus: 'INACTIVE', inactiveUntil: { $lt: new Date() } },
        { availabilityMode: 'TEMPORARY_INACTIVE', inactiveUntil: { $gt: new Date() } }
      ]
    };
    if (filters.bloodGroup) profileQuery.bloodGroup = filters.bloodGroup;

    const userQuery: any = { 
      status: { $in: ['ACTIVE', 'UNVERIFIED'] },
      'privacySettings.donorSearchVisibility': { $ne: false } 
    };
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
      if (user.privacySettings && user.privacySettings.donorSearchVisibility === false) return null;
      return toPublicDonorDTO(donor, user);
    }).filter(Boolean);

    return { results, pagination: { page, limit, count: results.length } };
  }
}
