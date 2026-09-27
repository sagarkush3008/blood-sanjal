import { User, IUser } from './user.model';
import { AppError } from '../../core/errors/appError';

export class UserService {
  static async getProfile(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return user;
  }

  static async updateProfile(userId: string, updateData: Partial<IUser>) {
    // Security: Remove any attempts to escalate privileges
    delete updateData.role;
    delete updateData.status;
    delete updateData.emailVerifiedAt;
    delete updateData.passwordHash;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return user;
  }

  static async getPrivacy(userId: string) {
    const user = await User.findById(userId).select('privacySettings');
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return user.privacySettings || {
      donorSearchVisibility: true,
      contactRevealPolicy: 'CONSENT_REQUIRED',
      emergencyNotifications: true,
      approximateLocationSharing: true,
    };
  }

  static async updatePrivacy(userId: string, privacyData: any) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    user.privacySettings = {
      donorSearchVisibility: privacyData.donorSearchVisibility !== undefined ? privacyData.donorSearchVisibility : (user.privacySettings?.donorSearchVisibility ?? true),
      contactRevealPolicy: privacyData.contactRevealPolicy || user.privacySettings?.contactRevealPolicy || 'CONSENT_REQUIRED',
      emergencyNotifications: privacyData.emergencyNotifications !== undefined ? privacyData.emergencyNotifications : (user.privacySettings?.emergencyNotifications ?? true),
      approximateLocationSharing: privacyData.approximateLocationSharing !== undefined ? privacyData.approximateLocationSharing : (user.privacySettings?.approximateLocationSharing ?? true),
    };

    await user.save();
    return user.privacySettings;
  }
}
