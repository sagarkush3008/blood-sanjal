import { User } from '../users/user.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { BloodRequest } from '../requests/bloodRequest.model';
import { DonationRecord } from '../donors/donationRecord.model';
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
    return { data: users, total, page, limit };
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
    if (query.isVerified !== undefined) filter.isVerified = query.isVerified === 'true';

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const donors = await DonorProfile.find(filter)
      .populate('userId', 'name email phone status locationCoordinates')
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await DonorProfile.countDocuments(filter);
    return { data: donors, total, page, limit };
  }

  // --- REQUEST MANAGEMENT ---
  static async listRequests(query: any) {
    const filter: any = { deletedAt: { $exists: false } };
    if (query.status) filter.status = query.status;
    if (query.urgency) filter.urgency = query.urgency;
    if (query.bloodGroup) filter.bloodGroup = query.bloodGroup;

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const requests = await BloodRequest.find(filter)
      .populate('requesterId', 'name email phone')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ requiredDate: 1 });
    const total = await BloodRequest.countDocuments(filter);
    return { data: requests, total, page, limit };
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

  // --- DONATION MANAGEMENT ---
  static async listDonations(query: any) {
    const filter: any = { deletedAt: { $exists: false } };
    if (query.status) filter.verificationStatus = query.status;
    if (query.campaignId) filter.campaignId = query.campaignId;

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const donations = await DonationRecord.find(filter)
      .populate({
        path: 'donorProfileId',
        populate: { path: 'userId', select: 'name email bloodGroup' }
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ donationDate: -1 });
    const total = await DonationRecord.countDocuments(filter);
    return { data: donations, total, page, limit };
  }

  static async verifyDonation(donationId: string, status: 'VERIFIED' | 'REJECTED', reason: string | undefined, actorId: string) {
    const donation = await DonationRecord.findById(donationId);
    if (!donation || donation.deletedAt) throw new AppError(404, 'NOT_FOUND', 'Donation not found');
    
    donation.verificationStatus = status;
    donation.verifiedBy = new mongoose.Types.ObjectId(actorId);
    if (reason) donation.rejectionReason = reason;

    await donation.save();

    // Update total donations count if verified
    if (status === 'VERIFIED') {
      const donor = await DonorProfile.findById(donation.donorProfileId);
      if (donor) {
        donor.totalDonations = (donor.totalDonations || 0) + 1;
        donor.lastDonationDate = donation.donationDate;
        await donor.save();
      }
    }

    await this.logAudit(actorId, `VERIFY_DONATION_${status}`, 'DONATION_RECORD', donationId);
    return donation;
  }
}
