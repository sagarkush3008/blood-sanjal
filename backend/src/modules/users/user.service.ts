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
}
