import { Reward, BadgeType } from './reward.model';
import { SystemConfig } from '../admin/systemConfig.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { NotificationService } from '../notifications/notification.service';
import { logger } from '../../config/logger.config';
import mongoose from 'mongoose';

const DEFAULT_MILESTONES = [
  { badgeType: 'FIRST_SAVER', count: 1, name: 'First Saver' },
  { badgeType: 'REGULAR_SAVER', count: 3, name: 'Regular Saver' },
  { badgeType: 'BLOOD_HERO', count: 5, name: 'Blood Hero' },
  { badgeType: 'ACTIVE_LIFE_SAVER', count: 10, name: 'Active Life Saver' },
  { badgeType: 'COMMUNITY_CHAMPION', count: 25, name: 'Community Champion' }
];

export class RewardService {
  static async getConfig() {
    let config = await SystemConfig.findOne({ key: 'REWARD_MILESTONES' });
    if (!config || !Array.isArray(config.value)) {
      if (!config) {
        config = await SystemConfig.create({
          key: 'REWARD_MILESTONES',
          value: DEFAULT_MILESTONES
        });
      }
      return DEFAULT_MILESTONES;
    }
    return config.value;
  }

  static async updateConfig(value: any) {
    return SystemConfig.findOneAndUpdate(
      { key: 'REWARD_MILESTONES' },
      { value },
      { upsert: true, new: true }
    );
  }

  static async checkAndIssueRewards(donorProfileId: string) {
    const profile = await DonorProfile.findById(donorProfileId);
    if (!profile) return;

    const milestones = await this.getConfig();
    const verifiedCount = profile.totalDonations;

    const newRewards = [];

    for (const rule of milestones) {
      if (verifiedCount >= rule.count) {
        // Attempt to create. Uniqueness constraint prevents duplicates
        const existing = await Reward.findOne({
          donorProfileId: profile._id,
          badgeType: rule.badgeType,
          milestone: rule.count
        });

        if (!existing) {
          const reward = await Reward.create({
            donorProfileId: profile._id,
            badgeType: rule.badgeType,
            milestone: rule.count,
            notes: `Recognized for reaching ${rule.count} verified donations as a ${rule.name}. Thank you for your continued community support.`
          });
          newRewards.push(reward);

          // Notify user
          await NotificationService.dispatch({
            userId: profile.userId.toString(),
            type: 'REWARD',
            title: `New Recognition: ${rule.name}`,
            message: `You have been recognized as a ${rule.name} for reaching ${rule.count} verified donations. This is a community recognition badge and holds no medical or financial value.`,
            dedupeKey: `reward_${profile._id}_${rule.badgeType}_${rule.count}`
          });
        }
      }
    }

    return newRewards;
  }

  static async getUserRewards(donorProfileId: string) {
    return Reward.find({ donorProfileId }).sort({ milestone: -1 });
  }

  static async getAllRewards(filters: any) {
    const limit = parseInt(filters.limit) || 20;
    const page = parseInt(filters.page) || 1;
    const skip = (page - 1) * limit;

    const rewards = await Reward.find().populate({ path: 'donorProfileId', select: 'bloodGroup' }).sort({ issuedAt: -1 }).skip(skip).limit(limit);
    return rewards;
  }
}
