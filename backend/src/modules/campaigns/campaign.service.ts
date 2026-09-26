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
      status: data.status || 'DRAFT'
    });

    await AuditLog.create({
      actorId: adminId,
      action: 'CREATE_CAMPAIGN',
      entityType: 'Campaign',
      entityId: campaign._id.toString()
    });
    
    return campaign;
  }

  static async updateCampaign(campaignId: string, data: any, adminId: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');

    if (data.date && new Date(data.date) < new Date(new Date().setHours(0,0,0,0))) {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot update campaign date to a past date');
    }

    Object.assign(campaign, data);
    await campaign.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'UPDATE_CAMPAIGN',
      entityType: 'Campaign',
      entityId: campaign._id.toString()
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
          logger.info(`Sending campaign invitation to ${user.email} for ${campaign.title}`);
          sent++;

          try {
            const { NotificationService } = await import('../notifications/notification.service');
            await NotificationService.dispatch({
              userId: user._id.toString(),
              type: 'BLOOD_CAMP',
              title: `Upcoming Blood Drive: ${campaign.title}`,
              message: `A new donation drive has been organized at ${campaign.location} on ${new Date(campaign.date).toLocaleDateString()}. Your blood group (${profile.bloodGroup}) is needed!`,
              dedupeKey: `camp_notif_${campaign._id}_${user._id}`
            });
          } catch(e) {}
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
    if (filters.status) {
       query.status = filters.status;
    }
    if (filters.search) {
       query.$or = [
         { title: { $regex: filters.search, $options: 'i' } },
         { location: { $regex: filters.search, $options: 'i' } },
         { organizer: { $regex: filters.search, $options: 'i' } }
       ];
    }
    const campaigns = await Campaign.find(query).sort({ date: 1 });
    return campaigns;
  }

  static async getCampaignDetails(campaignId: string, currentUserId?: string) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    if (['DRAFT', 'ARCHIVED', 'CANCELLED'].includes(campaign.status)) {
       throw new AppError(403, 'FORBIDDEN', 'Campaign is not publicly available');
    }

    const participantsCount = await CampaignParticipant.countDocuments({
      campaignId: campaign._id,
      status: { $ne: 'CANCELLED' }
    });

    let isRegistered = false;
    if (currentUserId) {
      const reg = await CampaignParticipant.findOne({
        campaignId: campaign._id,
        userId: currentUserId,
        status: 'REGISTERED'
      });
      isRegistered = !!reg;
    }

    const result = campaign.toObject ? campaign.toObject() : { ...campaign };
    (result as any).participantsCount = participantsCount;
    (result as any).isRegistered = isRegistered;

    return result;
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

    try {
      const { NotificationService } = await import('../notifications/notification.service');
      await NotificationService.dispatch({
        userId,
        type: 'BLOOD_CAMP',
        title: 'Campaign Registration Confirmed! 🩸',
        message: `You are registered for "${campaign.title}" on ${new Date(campaign.date).toLocaleDateString()} at ${campaign.location}. Thank you for supporting the cause!`,
        dedupeKey: `camp_reg_${campaign._id}_${userId}`
      });
    } catch (e) {}
    
    return participant;
  }

  static async withdrawFromCampaign(campaignId: string, userId: string) {
    const participant = await CampaignParticipant.findOne({ campaignId, userId });
    if (!participant || participant.status === 'CANCELLED') {
      throw new AppError(404, 'NOT_FOUND', 'No active registration found for this campaign');
    }

    participant.status = 'CANCELLED';
    await participant.save();

    await AuditLog.create({
      actorId: userId,
      action: 'CAMPAIGN_REGISTRATION_CANCELLED',
      entityType: 'CampaignParticipant',
      entityId: participant._id.toString()
    });

    return { message: 'Successfully withdrawn from campaign', participant };
  }

  static async scheduleCampaignReminder(campaignId: string, userId: string, data?: any) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');

    try {
      const { NotificationService } = await import('../notifications/notification.service');
      await NotificationService.dispatch({
        userId,
        type: 'BLOOD_CAMP',
        title: `Reminder: ${campaign.title} Drive`,
        message: `Don't forget! The ${campaign.title} blood drive is coming up on ${new Date(campaign.date).toLocaleDateString()} at ${campaign.location}.`,
        dedupeKey: `camp_reminder_${campaign._id}_${userId}`
      });
    } catch (e) {}

    return { message: 'Campaign reminder scheduled' };
  }

  static async listMyCampaigns(userId: string) {
    const registrations = await CampaignParticipant.find({
      userId,
      status: { $ne: 'CANCELLED' }
    }).populate('campaignId').sort({ createdAt: -1 });

    const campaigns = registrations
      .map(r => r.campaignId)
      .filter(c => !!c);

    return { items: campaigns, results: campaigns, data: campaigns, total: campaigns.length };
  }

  // --- ADMIN METHODS ---
  static async listAdminCampaigns(filters: any) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { location: { $regex: filters.search, $options: 'i' } },
        { organizer: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '20');

    const campaigns = await Campaign.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ date: -1 });

    const total = await Campaign.countDocuments(query);
    return { data: campaigns, items: campaigns, results: campaigns, total, page, limit };
  }

  static async getCampaignParticipants(campaignId: string, query: any = {}) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const filter: any = { campaignId };
    if (query.status) filter.status = query.status;

    const participants = await CampaignParticipant.find(filter)
      .populate('userId', 'name email phone bloodGroup')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await CampaignParticipant.countDocuments(filter);
    return { data: participants, items: participants, results: participants, total, page, limit };
  }

  static async updateParticipantStatus(campaignId: string, participantId: string, status: string, adminId: string) {
    const participant = await CampaignParticipant.findOne({ _id: participantId, campaignId });
    if (!participant) throw new AppError(404, 'NOT_FOUND', 'Participant not found');

    const validStatuses = ['REGISTERED', 'ATTENDED', 'CANCELLED'];
    if (!validStatuses.includes(status)) throw new AppError(400, 'BAD_REQUEST', 'Invalid participant status');

    participant.status = status as any;
    await participant.save();

    await AuditLog.create({
      actorId: adminId,
      action: `CAMPAIGN_PARTICIPANT_${status}`,
      entityType: 'CampaignParticipant',
      entityId: participantId
    });

    return participant;
  }
}
