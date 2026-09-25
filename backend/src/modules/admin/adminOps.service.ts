import { Campaign } from '../campaigns/campaign.model';
import { BroadcastNotification } from './broadcastNotification.model';
import { Reward } from '../rewards/reward.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { User } from '../users/user.model';
import { AppError } from '../../core/errors/appError';
import { EmailService } from '../email/email.service';
import { AdminService } from './admin.service';
import mongoose from 'mongoose';
import { CampaignParticipant } from '../campaigns/campaignParticipant.model';

export class AdminOpsService {
  // --- CAMPAIGNS ---
  static async createCampaign(data: any, adminId: string) {
    const campaign = await Campaign.create({ ...data, createdBy: new mongoose.Types.ObjectId(adminId) });
    await AdminService.logAudit(adminId, 'CREATE_CAMPAIGN', 'CAMPAIGN', campaign._id.toString());
    return campaign;
  }

  static async updateCampaign(id: string, data: any, adminId: string) {
    const campaign = await Campaign.findByIdAndUpdate(id, data, { new: true });
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    await AdminService.logAudit(adminId, 'UPDATE_CAMPAIGN', 'CAMPAIGN', id);
    return campaign;
  }

  static async updateCampaignStatus(id: string, status: string, adminId: string) {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    campaign.status = status as any;
    await campaign.save();
    await AdminService.logAudit(adminId, `CAMPAIGN_STATUS_${status}`, 'CAMPAIGN', id);
    return campaign;
  }

  // --- NOTIFICATIONS ---
  static async createBroadcast(data: any, adminId: string) {
    const notification = await BroadcastNotification.create({ ...data, createdBy: new mongoose.Types.ObjectId(adminId) });
    await AdminService.logAudit(adminId, 'CREATE_BROADCAST', 'BROADCAST_NOTIFICATION', notification._id.toString());
    return notification;
  }

  static async cancelBroadcast(id: string, adminId: string) {
    const notification = await BroadcastNotification.findById(id);
    if (!notification) throw new AppError(404, 'NOT_FOUND', 'Notification not found');
    if (notification.status === 'PROCESSING' || notification.status === 'COMPLETED') {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot cancel a notification in progress or already completed');
    }
    notification.status = 'CANCELLED';
    await notification.save();
    await AdminService.logAudit(adminId, 'CANCEL_BROADCAST', 'BROADCAST_NOTIFICATION', id);
    return notification;
  }

  static async processBroadcast(id: string) {
    const notification = await BroadcastNotification.findById(id);
    if (!notification || (notification.status !== 'SCHEDULED' && notification.status !== 'FAILED')) return;

    notification.status = 'PROCESSING';
    await notification.save();

    try {
      let users: any[] = [];
      const target = notification.target;

      if (target.type === 'ALL') {
        users = await User.find({ status: 'ACTIVE', 'privacySettings.emergencyNotifications': true });
      } else if (target.type === 'PROVINCE') {
        users = await User.find({ provinceId: target.value, status: 'ACTIVE', 'privacySettings.emergencyNotifications': true });
      } else if (target.type === 'DISTRICT') {
        users = await User.find({ districtId: target.value, status: 'ACTIVE', 'privacySettings.emergencyNotifications': true });
      } else if (target.type === 'CITY') {
        users = await User.find({ cityId: target.value, status: 'ACTIVE', 'privacySettings.emergencyNotifications': true });
      } else if (target.type === 'BLOOD_GROUP') {
        users = await User.find({ bloodGroup: target.value, status: 'ACTIVE', 'privacySettings.emergencyNotifications': true });
      } else if (target.type === 'DONOR_STATUS') {
        const donors = await DonorProfile.find({ donorStatus: target.value as any }).populate('userId');
        users = donors.map((d: any) => d.userId).filter((u: any) => u.status === 'ACTIVE' && u.privacySettings?.emergencyNotifications);
      } else if (target.type === 'CAMPAIGN') {
        const participants = await CampaignParticipant.find({ campaignId: target.value }).populate('userId');
        users = participants.map(p => p.userId).filter((u: any) => u.status === 'ACTIVE' && u.privacySettings?.emergencyNotifications);
      }

      let count = 0;
      if (notification.channels.includes('EMAIL')) {
        for (const user of users) {
          if (user.email) {
            await EmailService.enqueueEmail(user.email, 'adminAlert', { message: notification.message }, `broadcast_${id}_${user._id}`);
            count++;
          }
        }
      }

      notification.status = 'COMPLETED';
      notification.executionLog = `Sent to ${count} users`;
      await notification.save();
    } catch (error: any) {
      notification.status = 'SCHEDULED'; // Allow retry
      notification.executionLog = error.message;
      await notification.save();
    }
  }

  // --- REWARDS ---
  static async issueReward(donorProfileId: string, badgeType: string, milestone: number, notes: string, adminId: string) {
    const donor = await DonorProfile.findById(donorProfileId);
    if (!donor) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');
    
    const reward = await Reward.create({
      donorProfileId,
      badgeType: badgeType as any,
      milestone,
      notes
    });

    await AdminService.logAudit(adminId, `ISSUE_REWARD_${badgeType}`, 'REWARD', reward._id.toString());
    return reward;
  }
}
