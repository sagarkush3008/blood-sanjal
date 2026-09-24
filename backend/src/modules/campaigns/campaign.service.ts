import { Campaign } from './campaign.model';
import { CampaignParticipant } from './campaignParticipant.model';
import { AppError } from '../../core/errors/appError';
import { DonorProfile } from '../donors/donorProfile.model';
import { logger } from '../../config/logger.config';
import { AuditLog } from '../audit/auditLog.model';

export class CampaignService {
  static async createCampaign(adminId: string, data: any) {
    if (new Date(data.date) < new Date(new Date().setHours(0,0,0,0))) {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot create campaign with a past date');
    }
    
    const campaign = await Campaign.create({
      ...data,
      createdBy: adminId,
      status: 'DRAFT'
    });
    
    return campaign;
  }
  
  static async updateCampaignStatus(campaignId: string, adminId: string, status: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    
    if (campaign.status === 'ARCHIVED' || campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') {
       throw new AppError(400, 'BAD_REQUEST', `Cannot change status of a ${campaign.status} campaign`);
    }
    
    const validStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
       throw new AppError(400, 'BAD_REQUEST', 'Invalid status');
    }

    campaign.status = status as any;
    await campaign.save();
    
    await AuditLog.create({
      actorId: adminId,
      action: `CAMPAIGN_${status}`,
      entityType: 'Campaign',
      entityId: campaign._id.toString()
    });
    
    return campaign;
  }
  
  static async notifyTargetUsers(campaignId: string, adminId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    if (campaign.status !== 'PUBLISHED') throw new AppError(400, 'BAD_REQUEST', 'Only PUBLISHED campaigns can notify users');
    
    const profiles = await DonorProfile.find({
       bloodGroup: { $in: campaign.bloodGroupsNeeded },
       donorStatus: 'ACTIVE',
       notificationPreference: 'ALL'
    }).populate('userId');
    
    let sent = 0;
    for (const profile of profiles) {
       const user = profile.userId as any;
       if (user && user.email) {
          logger.info(`[MAIL_MOCK] Sending campaign invitation to ${user.email} for ${campaign.title}`);
          sent++;
       }
    }
    return sent;
  }
  
  static async deleteCampaign(campaignId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    
    if (campaign.status !== 'DRAFT') {
      campaign.status = 'ARCHIVED';
      await campaign.save();
      return { message: 'Campaign archived instead of hard-deleted due to status' };
    }
    
    await CampaignParticipant.deleteMany({ campaignId });
    await Campaign.findByIdAndDelete(campaignId);
    return { message: 'Campaign deleted' };
  }

  static async listPublicCampaigns(filters: any) {
    const query: any = { status: { $in: ['SCHEDULED', 'PUBLISHED', 'COMPLETED'] } };
    if (filters.bloodGroup) {
       query.bloodGroupsNeeded = filters.bloodGroup;
    }
    const campaigns = await Campaign.find(query).sort({ date: 1 });
    return campaigns;
  }

  static async getCampaignDetails(campaignId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    if (['DRAFT', 'ARCHIVED', 'CANCELLED'].includes(campaign.status)) {
       throw new AppError(403, 'FORBIDDEN', 'Campaign is not publicly available');
    }
    return campaign;
  }
  
  static async registerForCampaign(campaignId: string, userId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    if (campaign.status !== 'PUBLISHED' && campaign.status !== 'SCHEDULED') {
       throw new AppError(400, 'BAD_REQUEST', 'Campaign is not open for registration');
    }
    if (new Date(campaign.date) < new Date(new Date().setHours(0,0,0,0))) {
       throw new AppError(400, 'BAD_REQUEST', 'Campaign date has already passed');
    }
    
    const existing = await CampaignParticipant.findOne({ campaignId, userId });
    if (existing) {
       if (existing.status === 'CANCELLED') {
         existing.status = 'REGISTERED';
         await existing.save();
         return existing;
       }
       throw new AppError(409, 'CONFLICT', 'You are already registered for this campaign');
    }
    
    const participant = await CampaignParticipant.create({
      campaignId,
      userId,
      status: 'REGISTERED'
    });
    
    return participant;
  }
}
