import { ContactRequest } from './contactRequest.model';
import { User } from '../users/user.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { AppError } from '../../core/errors/appError';
import { AuditLog } from '../audit/auditLog.model';

export class ContactRequestService {
  static async createRequest(requesterId: string, donorId: string, message?: string) {
    if (requesterId === donorId) throw new AppError(400, 'BAD_REQUEST', 'Cannot contact yourself');
    
    const donorUser = await User.findById(donorId);
    if (!donorUser) throw new AppError(404, 'NOT_FOUND', 'Donor not found');
    
    if (donorUser.privacySettings?.contactRevealPolicy === 'HIDDEN') {
      throw new AppError(403, 'FORBIDDEN', 'This donor does not accept contact requests');
    }

    const openRequest = await ContactRequest.findOne({
      requesterId,
      donorId,
      status: { $in: ['PENDING', 'ACCEPTED'] }
    });

    if (openRequest) {
      throw new AppError(409, 'CONFLICT', 'You already have an open contact request with this donor');
    }

    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48h
    const req = await ContactRequest.create({
      requesterId,
      donorId,
      message,
      status: donorUser.privacySettings?.contactRevealPolicy === 'DIRECT' ? 'ACCEPTED' : 'PENDING',
      expiresAt
    });

    if (req.status === 'ACCEPTED') {
      await this.revealContactInfo(req, donorUser);
    } else {
      // Logic to trigger system notification queue to notify donor goes here
    }

    return req;
  }

  static async acceptRequest(requestId: string, donorId: string) {
    const req = await ContactRequest.findById(requestId);
    if (!req) throw new AppError(404, 'NOT_FOUND', 'Request not found');
    if (req.donorId.toString() !== donorId) throw new AppError(403, 'FORBIDDEN', 'Not authorized');
    if (req.status !== 'PENDING') throw new AppError(400, 'BAD_REQUEST', `Cannot accept request in status ${req.status}`);
    
    if (new Date() > req.expiresAt) {
      req.status = 'EXPIRED';
      await req.save();
      throw new AppError(400, 'BAD_REQUEST', 'Request has expired');
    }

    const donorUser = await User.findById(donorId);
    if (!donorUser) throw new AppError(404, 'NOT_FOUND', 'Donor user not found');
    
    req.status = 'ACCEPTED';
    await this.revealContactInfo(req, donorUser);
    
    await AuditLog.create({
      actorId: donorId,
      action: 'CONTACT_REQUEST_ACCEPTED',
      entityType: 'ContactRequest',
      entityId: req._id.toString()
    });

    return req;
  }

  static async declineRequest(requestId: string, donorId: string) {
    const req = await ContactRequest.findById(requestId);
    if (!req) throw new AppError(404, 'NOT_FOUND', 'Request not found');
    if (req.donorId.toString() !== donorId) throw new AppError(403, 'FORBIDDEN', 'Not authorized');
    if (req.status !== 'PENDING') throw new AppError(400, 'BAD_REQUEST', `Cannot decline request in status ${req.status}`);

    req.status = 'DECLINED';
    await req.save();
    return req;
  }

  private static async revealContactInfo(req: any, donorUser: any) {
    const donorProfile = await DonorProfile.findOne({ userId: donorUser._id });
    
    const pref = donorProfile?.contactPreference || 'SYSTEM_ONLY';
    const revealed: any = {};
    
    if (pref === 'PHONE' || pref === 'WHATSAPP') {
      if (donorUser.phone) revealed.phone = donorUser.phone;
    }
    if (pref === 'EMAIL') {
      if (donorUser.email) revealed.email = donorUser.email;
    }
    
    req.revealedContactInfo = revealed;
    await req.save();
  }
}
