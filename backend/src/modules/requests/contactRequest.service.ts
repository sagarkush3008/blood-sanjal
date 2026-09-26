import { ContactRequest } from './contactRequest.model';
import { User } from '../users/user.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { AppError } from '../../core/errors/appError';
import { AuditLog } from '../audit/auditLog.model';
import { EmailService } from '../email/email.service';

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
      const requesterUser = await User.findById(requesterId);
      if (donorUser.email) {
        EmailService.enqueueEmail(
          donorUser.email,
          'contactRequest',
          { donorName: donorUser.name, requesterName: requesterUser?.name || 'A Recipient' },
          `contact_req_${req._id}`
        ).catch(() => {});
      }
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

    const requesterUser = await User.findById(req.requesterId);
    if (requesterUser?.email) {
      EmailService.enqueueEmail(
        requesterUser.email,
        'contactReveal',
        {
          requesterName: requesterUser.name,
          donorName: donorUser.name,
          phone: req.revealedContactInfo?.phone,
          email: req.revealedContactInfo?.email
        },
        `contact_acc_${req._id}`
      ).catch(() => {});
    }

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

  static async listMyRequests(userId: string, query: any = {}) {
    const filter: any = {
      $or: [{ requesterId: userId }, { donorId: userId }]
    };
    if (query.status) filter.status = query.status;

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const requests = await ContactRequest.find(filter)
      .populate('requesterId', 'name email bloodGroup')
      .populate('donorId', 'name email bloodGroup')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ContactRequest.countDocuments(filter);
    return { data: requests, items: requests, results: requests, total, page, limit };
  }

  static async getRequestById(requestId: string, userId: string, isAdmin = false) {
    const req = await ContactRequest.findById(requestId)
      .populate('requesterId', 'name email phone')
      .populate('donorId', 'name email phone bloodGroup');
    if (!req) throw new AppError(404, 'NOT_FOUND', 'Contact request not found');

    const reqUser = req.requesterId as any;
    const donorUser = req.donorId as any;

    if (!isAdmin && reqUser?._id?.toString() !== userId && donorUser?._id?.toString() !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied to this contact request');
    }

    return req;
  }

  static async cancelRequest(requestId: string, requesterId: string) {
    const req = await ContactRequest.findById(requestId);
    if (!req) throw new AppError(404, 'NOT_FOUND', 'Contact request not found');
    if (req.requesterId.toString() !== requesterId) throw new AppError(403, 'FORBIDDEN', 'Only the requester can cancel');
    if (req.status !== 'PENDING') throw new AppError(400, 'BAD_REQUEST', `Cannot cancel request in status ${req.status}`);

    req.status = 'DECLINED';
    await req.save();

    await AuditLog.create({
      actorId: requesterId,
      action: 'CONTACT_REQUEST_CANCELLED',
      entityType: 'ContactRequest',
      entityId: req._id.toString()
    });

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
