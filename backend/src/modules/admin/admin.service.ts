import { User } from '../users/user.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { BloodRequest } from '../requests/bloodRequest.model';
import { BloodRequestService } from '../requests/bloodRequest.service';
import { DonationRecord } from '../donors/donationRecord.model';
import { DonationService } from '../donors/donation.service';
import { Certificate } from '../certificates/certificate.model';
import { CertificateService } from '../certificates/certificate.service';
import { ReminderService } from '../reminders/reminder.service';
import { Campaign } from '../campaigns/campaign.model';
import { PaymentTransaction } from '../payments/payment.model';
import { NotificationJob } from '../notifications/notificationQueue.model';
import { ContactRequest } from '../requests/contactRequest.model';
import { EmailEvent } from '../email/emailEvent.model';
import { AuditLog } from '../audit/auditLog.model';
import { AuditService } from '../audit/audit.service';
import { AppError } from '../../core/errors/appError';
import mongoose from 'mongoose';

export class AdminService {
  /**
   * Log audit for sensitive admin actions
   */
  static async logAudit(actorId: string, action: string, entityType: string, entityId: string, ipHash?: string, userAgent?: string) {
    await AuditService.logAction(actorId, action, entityType, entityId, null, ipHash, userAgent);
  }

  // --- DASHBOARD SUMMARY ---
  static async getDashboardSummary() {
    const [
      totalUsers,
      activeUsers,
      totalDonors,
      activeDonors,
      totalRequests,
      activeRequests,
      pendingEmergencies,
      totalDonations,
      verifiedDonations,
      campaignsCount,
      paymentsSummary,
      recentAudit
    ] = await Promise.all([
      User.countDocuments({ deletedAt: { $exists: false } }).catch(() => 0),
      User.countDocuments({ status: 'ACTIVE', deletedAt: { $exists: false } }).catch(() => 0),
      DonorProfile.countDocuments({ deletedAt: { $exists: false } }).catch(() => 0),
      DonorProfile.countDocuments({ donorStatus: 'ACTIVE', deletedAt: { $exists: false } }).catch(() => 0),
      BloodRequest.countDocuments({ deletedAt: { $exists: false } }).catch(() => 0),
      BloodRequest.countDocuments({ status: { $in: ['ACTIVE', 'PARTIALLY_FULFILLED', 'VERIFIED'] }, deletedAt: { $exists: false } }).catch(() => 0),
      BloodRequest.countDocuments({ urgency: 'EMERGENCY', status: 'PENDING_VERIFICATION', deletedAt: { $exists: false } }).catch(() => 0),
      DonationRecord.countDocuments({ deletedAt: { $exists: false } }).catch(() => 0),
      DonationRecord.countDocuments({ verificationStatus: 'VERIFIED', deletedAt: { $exists: false } }).catch(() => 0),
      Campaign.countDocuments({ deletedAt: { $exists: false } }).catch(() => 0),
      PaymentTransaction.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, totalRevenueMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }
      ]).catch(() => []),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).catch(() => [])
    ]);

    const revenueMinor = paymentsSummary[0]?.totalRevenueMinor || 0;

    return {
      users: totalUsers,
      activeUsers,
      donors: totalDonors,
      activeDonors,
      requests: totalRequests,
      activeRequests,
      pendingEmergencies,
      donations: verifiedDonations,
      totalDonations,
      campaigns: campaignsCount,
      revenueNPR: Math.round(revenueMinor / 100),
      recentActivity: recentAudit
    };
  }

  // --- USER MANAGEMENT ---
  static async listUsers(query: any) {
    const filter: any = { deletedAt: { $exists: false } };
    if (query.status) filter.status = query.status;
    if (query.role) filter.role = query.role;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } }
      ];
    }
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    
    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(filter);
    return { data: users, items: users, results: users, total, page, limit };
  }

  static async getUserDetails(userId: string) {
    const user = await User.findById(userId);
    if (!user || user.deletedAt) throw new AppError(404, 'NOT_FOUND', 'User not found');
    const donorProfile = await DonorProfile.findOne({ userId });
    return { user, donorProfile };
  }

  static async updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'UNVERIFIED', actorId: string) {
    const user = await User.findById(userId);
    if (!user || user.deletedAt) throw new AppError(404, 'NOT_FOUND', 'User not found');
    user.status = status;
    if (status === 'ACTIVE' && !user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
    }
    await user.save();
    await this.logAudit(actorId, `UPDATE_USER_STATUS_${status}`, 'USER', userId);
    return user;
  }

  static async softDeleteUser(userId: string, actorId: string) {
    const user = await User.findById(userId);
    if (!user || user.deletedAt) throw new AppError(404, 'NOT_FOUND', 'User not found');
    user.deletedAt = new Date();
    user.status = 'SUSPENDED'; // also suspend them
    await user.save();
    await this.logAudit(actorId, 'SOFT_DELETE_USER', 'USER', userId);
    return user;
  }

  // --- DONOR MANAGEMENT ---
  static async updateDonorStatus(userId: string, donorStatus: 'ACTIVE' | 'UNAVAILABLE' | 'HIDDEN', isVerified: boolean, actorId: string) {
    const donor = await DonorProfile.findOne({ userId });
    if (!donor) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');
    donor.donorStatus = donorStatus;
    donor.isVerified = isVerified;
    await donor.save();
    await this.logAudit(actorId, `UPDATE_DONOR_${donorStatus}`, 'DONOR_PROFILE', donor._id.toString());
    return donor;
  }

  static async getDonors(query: any) {
    const filter: any = {};
    if (query.bloodGroup) filter.bloodGroup = query.bloodGroup;
    if (query.donorStatus) filter.donorStatus = query.donorStatus;
    if (query.isVerified !== undefined) filter.isVerified = query.isVerified === 'true' || query.isVerified === true;

    // Search by user name/email/phone or filter by location
    const userFilter: any = {};
    if (query.provinceId) userFilter.provinceId = query.provinceId;
    if (query.districtId) userFilter.districtId = query.districtId;
    if (query.cityId) userFilter.cityId = query.cityId;
    if (query.search) {
      userFilter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } }
      ];
    }

    if (Object.keys(userFilter).length > 0) {
      const matchedUsers = await User.find(userFilter).select('_id');
      const matchedIds = matchedUsers.map(u => u._id);
      filter.userId = { $in: matchedIds };
    }

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const donors = await DonorProfile.find(filter)
      .populate('userId', 'name email phone status locationCoordinates provinceId districtId cityId areaId')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await DonorProfile.countDocuments(filter);
    return { data: donors, items: donors, results: donors, total, page, limit };
  }

  static async getDonorDetails(donorIdOrUserId: string) {
    let donor = await DonorProfile.findById(donorIdOrUserId).populate('userId', '-passwordHash');
    if (!donor) {
      donor = await DonorProfile.findOne({ userId: donorIdOrUserId }).populate('userId', '-passwordHash');
    }
    if (!donor) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');

    const recentDonations = await DonationRecord.find({ donorProfileId: donor._id })
      .sort({ donationDate: -1 })
      .limit(10);

    return {
      donor,
      user: donor.userId,
      recentDonations
    };
  }

  static async verifyDonor(donorIdOrUserId: string, isVerified: boolean, actorId: string) {
    let donor = await DonorProfile.findById(donorIdOrUserId);
    if (!donor) {
      donor = await DonorProfile.findOne({ userId: donorIdOrUserId });
    }
    if (!donor) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');

    donor.isVerified = isVerified;
    await donor.save();

    await this.logAudit(actorId, isVerified ? 'VERIFY_DONOR' : 'UNVERIFY_DONOR', 'DONOR_PROFILE', donor._id.toString());
    return donor;
  }

  // --- REQUEST MANAGEMENT ---
  static async listRequests(query: any) {
    const filter: any = { deletedAt: { $exists: false } };
    if (query.status) filter.status = query.status;
    if (query.urgency) filter.urgency = query.urgency;
    if (query.bloodGroup) filter.bloodGroup = query.bloodGroup;

    if (query.search) {
      filter.$or = [
        { patientName: { $regex: query.search, $options: 'i' } },
        { hospitalName: { $regex: query.search, $options: 'i' } }
      ];
    }

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const requests = await BloodRequest.find(filter)
      .populate('requesterId', 'name email phone')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await BloodRequest.countDocuments(filter);
    return { data: requests, items: requests, results: requests, total, page, limit };
  }

  static async getRequestDetails(requestId: string) {
    const request = await BloodRequest.findById(requestId).populate('requesterId', '-passwordHash');
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Blood request not found');

    const COMPATIBLE_DONOR_MAP: Record<string, string[]> = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['AB-', 'A-', 'B-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };

    const compatibleGroups = COMPATIBLE_DONOR_MAP[request.bloodGroup] || [request.bloodGroup];
    const compatibleDonorsCount = await DonorProfile.countDocuments({
      donorStatus: 'ACTIVE',
      bloodGroup: { $in: compatibleGroups }
    });

    const timeline = await AuditLog.find({
      entityType: 'BloodRequest',
      entityId: requestId
    }).sort({ createdAt: 1 });

    return {
      request,
      requester: request.requesterId,
      compatibility: {
        requestedGroup: request.bloodGroup,
        compatibleGroups,
        availableDonorsCount: compatibleDonorsCount
      },
      timeline
    };
  }

  static async getMatchingDonorsForRequest(requestId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Blood request not found');

    const COMPATIBLE_DONOR_MAP: Record<string, string[]> = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['AB-', 'A-', 'B-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };

    const compatibleGroups = COMPATIBLE_DONOR_MAP[request.bloodGroup] || [request.bloodGroup];

    const donors = await DonorProfile.find({
      donorStatus: 'ACTIVE',
      bloodGroup: { $in: compatibleGroups }
    })
      .populate('userId', 'name provinceId districtId cityId areaId')
      .limit(50);

    const safeDonors = donors.map(donor => {
      const u = donor.userId as any;
      return {
        donorId: donor._id,
        bloodGroup: donor.bloodGroup,
        donorStatus: donor.donorStatus,
        isVerified: donor.isVerified,
        totalDonations: donor.totalDonations,
        lastDonationDate: donor.lastDonationDate,
        name: u?.name || 'Anonymous Donor',
        location: {
          provinceId: u?.provinceId,
          districtId: u?.districtId,
          cityId: u?.cityId
        }
      };
    });

    return {
      requestId: request._id,
      bloodGroup: request.bloodGroup,
      compatibleGroups,
      matchingDonors: safeDonors,
      totalMatched: safeDonors.length
    };
  }

  static async fulfillRequestUnits(requestId: string, units: number, actorId: string) {
    const request = await BloodRequestService.fulfillUnits(requestId, units, actorId);
    await this.logAudit(actorId, 'ADMIN_FULFILL_UNITS', 'BLOOD_REQUEST', requestId);
    return request;
  }

  static async updateRequestStatus(requestId: string, status: string, urgency: string, actorId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Request not found');
    if (status) request.status = status as any;
    if (urgency) request.urgency = urgency as any;
    
    await request.save();
    await this.logAudit(actorId, `UPDATE_REQUEST_STATUS`, 'BLOOD_REQUEST', requestId);
    return request;
  }

  static async softDeleteRequest(requestId: string, actorId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Request not found');
    request.deletedAt = new Date();
    request.status = 'CANCELLED';
    await request.save();
    await this.logAudit(actorId, 'SOFT_DELETE_REQUEST', 'BLOOD_REQUEST', requestId);
    return request;
  }

  // --- EMERGENCY REQUEST MANAGEMENT ---
  static async listEmergencyRequests(query: any) {
    const filter: any = { urgency: 'EMERGENCY', deletedAt: { $exists: false } };
    if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = 'PENDING_VERIFICATION';
    }

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const requests = await BloodRequest.find(filter)
      .populate('requesterId', 'name email phone')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await BloodRequest.countDocuments(filter);
    return { data: requests, items: requests, results: requests, total, page, limit };
  }

  static async approveEmergencyRequest(requestId: string, actorId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Emergency request not found');

    if (request.status === 'PENDING_VERIFICATION') {
      await BloodRequestService.verifyRequest(requestId, actorId, true);
    }

    if (!request.broadcastedAt) {
      try {
        await BloodRequestService.broadcastEmergency(requestId, actorId);
      } catch (err: any) {
        // If already broadcasted or conflict, continue
      }
    }

    await this.logAudit(actorId, 'APPROVE_EMERGENCY_BROADCAST', 'BLOOD_REQUEST', requestId);
    const updated = await BloodRequest.findById(requestId);
    return updated;
  }

  static async rejectEmergencyRequest(requestId: string, reason: string | undefined, actorId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Emergency request not found');

    request.status = 'CANCELLED';
    if (reason) request.additionalInfo = (request.additionalInfo ? request.additionalInfo + ' | ' : '') + `Rejection: ${reason}`;
    await request.save();

    await this.logAudit(actorId, 'REJECT_EMERGENCY_REQUEST', 'BLOOD_REQUEST', requestId);
    return request;
  }

  static async getEmergencyRequestDetails(requestId: string) {
    const request = await BloodRequest.findById(requestId).populate('requesterId', '-passwordHash');
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Emergency request not found');

    const jobs = await NotificationJob.find({ bloodRequestId: requestId });
    const totalJobs = jobs.length;
    const sentJobs = jobs.filter(j => j.status === 'SENT').length;
    const pendingJobs = jobs.filter(j => j.status === 'PENDING').length;
    const failedJobs = jobs.filter(j => j.status === 'FAILED').length;

    const timeline = await AuditLog.find({
      entityType: 'BloodRequest',
      entityId: requestId
    }).sort({ createdAt: 1 });

    return {
      request,
      requester: request.requesterId,
      broadcast: {
        isBroadcasted: !!request.broadcastedAt,
        broadcastedAt: request.broadcastedAt || null,
        totalJobs,
        sentJobs,
        pendingJobs,
        failedJobs
      },
      timeline
    };
  }

  static async getEmergencyResponses(requestId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Emergency request not found');

    const jobs = await NotificationJob.find({ bloodRequestId: requestId })
      .populate('recipientId', 'name provinceId districtId cityId')
      .sort({ createdAt: -1 });

    const safeJobs = jobs.map(j => {
      const u = j.recipientId as any;
      return {
        jobId: j._id,
        recipientName: u?.name || 'Anonymous Donor',
        recipientLocation: {
          provinceId: u?.provinceId,
          districtId: u?.districtId,
          cityId: u?.cityId
        },
        status: j.status,
        createdAt: (j as any).createdAt
      };
    });

    return {
      requestId: request._id,
      bloodGroup: request.bloodGroup,
      totalNotified: jobs.length,
      recipients: safeJobs
    };
  }

  static async triggerBroadcast(requestId: string, actorId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Emergency request not found');

    if (request.status !== 'ACTIVE') {
      await BloodRequestService.verifyRequest(requestId, actorId, true);
    }

    const broadcastResult = await BloodRequestService.broadcastEmergency(requestId, actorId);
    await this.logAudit(actorId, 'TRIGGER_EMERGENCY_BROADCAST', 'BLOOD_REQUEST', requestId);
    return { success: true, ...broadcastResult };
  }

  static async closeEmergencyRequest(requestId: string, reason: string | undefined, actorId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Emergency request not found');

    request.status = 'FULFILLED';
    if (reason) {
      request.additionalInfo = (request.additionalInfo ? request.additionalInfo + ' | ' : '') + `Closed: ${reason}`;
    }
    await request.save();

    await NotificationJob.updateMany(
      { bloodRequestId: requestId, status: 'PENDING' },
      { $set: { status: 'CANCELLED' } }
    );

    await this.logAudit(actorId, 'CLOSE_EMERGENCY_REQUEST', 'BLOOD_REQUEST', requestId);
    return request;
  }

  static async verifyBloodRequest(requestId: string, activate: boolean, actorId: string) {
    const request = await BloodRequestService.verifyRequest(requestId, actorId, activate);
    await this.logAudit(actorId, activate ? 'ACTIVATE_BLOOD_REQUEST' : 'VERIFY_BLOOD_REQUEST', 'BLOOD_REQUEST', requestId);
    return request;
  }

  // --- DONATION MANAGEMENT ---
  static async listDonations(query: any) {
    const filter: any = { deletedAt: { $exists: false } };
    if (query.status) filter.verificationStatus = query.status;
    if (query.campaignId) filter.campaignId = query.campaignId;
    if (query.donorProfileId) filter.donorProfileId = query.donorProfileId;

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const donations = await DonationRecord.find(filter)
      .populate({
        path: 'donorProfileId',
        populate: { path: 'userId', select: 'name email bloodGroup phone' }
      })
      .populate('verifiedBy', 'name role')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ donationDate: -1 });
    const total = await DonationRecord.countDocuments(filter);
    return { data: donations, items: donations, results: donations, total, page, limit };
  }

  static async getDonationDetails(donationId: string) {
    const donation = await DonationRecord.findById(donationId)
      .populate({
        path: 'donorProfileId',
        populate: { path: 'userId', select: 'name email bloodGroup phone' }
      })
      .populate('verifiedBy', 'name role');
    if (!donation || donation.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Donation not found');

    const timeline = await AuditLog.find({
      entityType: 'DonationRecord',
      entityId: donationId
    }).sort({ createdAt: 1 });

    const certificate = await Certificate.findOne({
      donorProfileId: donation.donorProfileId,
      certificateType: 'DONATION'
    });

    return {
      donation,
      timeline,
      certificate
    };
  }

  static async verifyDonation(donationId: string, status: 'VERIFIED' | 'REJECTED', reason: string | undefined, actorId: string) {
    const donation = await DonationService.verifyDonation(donationId, actorId, status, reason);
    await this.logAudit(actorId, `ADMIN_VERIFY_DONATION_${status}`, 'DONATION_RECORD', donationId);
    return donation;
  }

  static async issueDonationCertificate(donationId: string, actorId: string) {
    const donation = await DonationRecord.findById(donationId);
    if (!donation || donation.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Donation not found');
    if (donation.verificationStatus !== 'VERIFIED') {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot issue certificate for unverified donation');
    }

    const cert = await CertificateService.issueCertificate(actorId, {
      donorProfileId: donation.donorProfileId.toString(),
      certificateType: 'DONATION',
      assetUrl: donation.evidenceAssetId
    });

    await this.logAudit(actorId, 'ISSUE_DONATION_CERTIFICATE', 'DONATION_RECORD', donationId);
    return cert;
  }

  // --- REMINDERS & ELIGIBILITY POLICY ---
  static async getReminderConfig() {
    return ReminderService.getConfig();
  }

  static async updateReminderConfig(value: any, actorId: string) {
    const updated = await ReminderService.updateConfig(value);
    await this.logAudit(actorId, 'UPDATE_REMINDER_POLICY', 'SYSTEM_CONFIG', 'REMINDER_POLICY');
    return updated.value;
  }

  static async triggerReminders(targetDate?: string, actorId?: string) {
    const parsedDate = targetDate ? new Date(targetDate) : undefined;
    const processedCount = await ReminderService.processReminders(parsedDate);
    if (actorId) {
      await this.logAudit(actorId, 'TRIGGER_REMINDERS', 'REMINDER_POLICY', 'MANUAL_TRIGGER');
    }
    return { processedCount };
  }

  // --- CONTACT REQUEST MANAGEMENT ---
  static async listContactRequests(query: any) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.requesterId) filter.requesterId = query.requesterId;
    if (query.donorId) filter.donorId = query.donorId;

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const requests = await ContactRequest.find(filter)
      .populate('requesterId', 'name email phone')
      .populate('donorId', 'name email phone bloodGroup')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ContactRequest.countDocuments(filter);
    return { data: requests, items: requests, results: requests, total, page, limit };
  }

  static async getContactRequestDetails(requestId: string) {
    const req = await ContactRequest.findById(requestId)
      .populate('requesterId', 'name email phone')
      .populate('donorId', 'name email phone bloodGroup');
    if (!req) throw new AppError(404, 'NOT_FOUND', 'Contact request not found');

    const timeline = await AuditLog.find({
      entityType: 'ContactRequest',
      entityId: requestId
    }).sort({ createdAt: 1 });

    return {
      request: req,
      requester: req.requesterId,
      donor: req.donorId,
      timeline
    };
  }

  // --- EMAIL AUDIT LOGS ---
  static async getEmailLogs(query: any) {
    const filter: any = {};
    if (query.to) filter.to = { $regex: query.to, $options: 'i' };
    if (query.template) filter.template = query.template;
    if (query.status) filter.status = query.status;

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');

    const logs = await EmailEvent.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await EmailEvent.countDocuments(filter);
    return { data: logs, items: logs, results: logs, total, page, limit };
  }
}
