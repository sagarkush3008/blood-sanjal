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

  static async logDonation(userId: string, data: any) {
    const profile = await DonorProfile.findOne({ userId });
    if (!profile) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');

    const record = await DonationRecord.create({
      donorProfileId: profile._id,
      donationDate: data.donationDate,
      hospitalName: data.hospitalName,
      verified: true // In production this would require admin/hospital verification flow
    });

    const total = await DonationRecord.countDocuments({ donorProfileId: profile._id, verified: true });
    
    // Simple logic for lastDonationDate, ideally find max date
    profile.totalDonations = total;
    if (!profile.lastDonationDate || new Date(data.donationDate) > profile.lastDonationDate) {
      profile.lastDonationDate = data.donationDate;
    }
    await profile.save();

    return record;
  }

  static async searchPublicDonors(filters: any) {
    // Always restrict to ACTIVE profiles
    const profileQuery: any = { donorStatus: 'ACTIVE' };
    if (filters.bloodGroup) {
      profileQuery.bloodGroup = filters.bloodGroup;
    }

    const donors = await DonorProfile.find(profileQuery).populate('userId');

    return donors.map(donor => {
      const user = (donor as any).userId;
      if (!user) return null;

      // Honor user's base privacy settings
      if (user.privacySettings?.donorSearchVisibility === false) {
        return null;
      }

      return toPublicDonorDTO(donor, user);
    }).filter(Boolean);
  }
}
