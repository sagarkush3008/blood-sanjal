import { DonationRecord } from './donationRecord.model';
import { DonorProfile } from './donorProfile.model';
import { User } from '../users/user.model';
import { AppError } from '../../core/errors/appError';
import { AuditLog } from '../audit/auditLog.model';
import { SystemConfig } from '../admin/systemConfig.model';

export class DonationService {
  static async submitDonation(userId: string, data: any) {
    const profile = await DonorProfile.findOne({ userId });
    if (!profile) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');

    if (new Date(data.donationDate) > new Date()) {
      throw new AppError(400, 'BAD_REQUEST', 'Donation date cannot be in the future');
    }

    const existing = await DonationRecord.findOne({ 
      donorProfileId: profile._id, 
      donationDate: new Date(data.donationDate) 
    });
    
    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Donation already submitted for this date');
    }

    const record = await DonationRecord.create({
      donorProfileId: profile._id,
      donationDate: data.donationDate,
      location: data.location,
      hospitalName: data.hospitalName,
      campaignId: data.campaignId,
      notes: data.notes,
      evidenceAssetId: data.evidenceAssetId,
      verificationStatus: 'PENDING'
    });

    return record;
  }

  static async verifyDonation(recordId: string, verifierId: string, action: 'VERIFIED' | 'REJECTED', reason?: string) {
    const record = await DonationRecord.findById(recordId);
    if (!record) throw new AppError(404, 'NOT_FOUND', 'Donation record not found');
    
    if (record.verificationStatus !== 'PENDING') {
      throw new AppError(400, 'BAD_REQUEST', `Cannot verify record in ${record.verificationStatus} state`);
    }

    record.verificationStatus = action;
    record.verifiedBy = verifierId as any;
    if (action === 'REJECTED') {
      record.rejectionReason = reason;
    }

    await record.save();

    if (action === 'VERIFIED') {
      const profile = await DonorProfile.findById(record.donorProfileId);
      if (profile) {
        const total = await DonationRecord.countDocuments({ donorProfileId: profile._id, verificationStatus: 'VERIFIED' });
        profile.totalDonations = total;
        
        if (!profile.lastDonationDate || new Date(record.donationDate) > profile.lastDonationDate) {
          profile.lastDonationDate = record.donationDate;
          
          let offset = 90;
          try {
            const config = await SystemConfig.findOne({ key: 'REMINDER_POLICY' });
            if (config && config.value && config.value.daysAfterDonation) {
              offset = config.value.daysAfterDonation;
            }
          } catch(e) {}
          
          const reminder = new Date(record.donationDate);
          reminder.setDate(reminder.getDate() + offset);
          profile.reminderDate = reminder;
        }
        await profile.save();
      }
    }

    await AuditLog.create({
      actorId: verifierId,
      action: `DONATION_${action}`,
      entityType: 'DonationRecord',
      entityId: record._id.toString()
    });

    return record;
  }

  static async getHistory(filters: any) {
    const query: any = {};
    if (filters.donorProfileId) query.donorProfileId = filters.donorProfileId;
    if (filters.location) query.location = { $regex: filters.location, $options: 'i' };
    if (filters.hospitalName) query.hospitalName = { $regex: filters.hospitalName, $options: 'i' };
    if (filters.campaignId) query.campaignId = filters.campaignId;
    if (filters.verificationStatus) query.verificationStatus = filters.verificationStatus;

    if (filters.startDate && filters.endDate) {
      query.donationDate = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }

    if (filters.bloodGroup) {
       const profiles = await DonorProfile.find({ bloodGroup: filters.bloodGroup }).select('_id');
       const profileIds = profiles.map(p => p._id);
       query.donorProfileId = { $in: profileIds };
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const records = await DonationRecord.find(query)
      .sort({ donationDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'donorProfileId', select: 'bloodGroup userId' });

    const total = await DonationRecord.countDocuments(query);

    return { results: records, pagination: { page, limit, count: records.length, total } };
  }

  static async getDetail(recordId: string) {
    const record = await DonationRecord.findById(recordId).populate('donorProfileId').populate('verifiedBy', 'name role');
    if (!record) throw new AppError(404, 'NOT_FOUND', 'Record not found');
    return record;
  }
}
