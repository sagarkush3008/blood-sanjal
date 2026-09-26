import { Certificate } from './certificate.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { AppError } from '../../core/errors/appError';
import { AuditLog } from '../audit/auditLog.model';
import { NotificationService } from '../notifications/notification.service';
import crypto from 'crypto';
import { User } from '../users/user.model';

export class CertificateService {
  static async issueCertificate(adminId: string, data: any) {
    const profile = await DonorProfile.findById(data.donorProfileId).populate('userId');
    if (!profile) throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');

    const year = new Date().getFullYear();
    const count = await Certificate.countDocuments();
    const certificateNumber = `BS-CERT-${year}-${(count + 1).toString().padStart(5, '0')}`;
    const verificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    const cert = await Certificate.create({
      donorProfileId: profile._id,
      certificateType: data.certificateType,
      certificateNumber,
      verificationCode,
      assetUrl: data.assetUrl
    });

    await AuditLog.create({
      actorId: adminId,
      action: 'CERTIFICATE_ISSUED',
      entityType: 'Certificate',
      entityId: cert._id.toString()
    });

    await NotificationService.dispatch({
      userId: profile.userId._id.toString(),
      type: 'CERTIFICATE',
      title: 'New Certificate Issued',
      message: `You have been issued a ${data.certificateType} certificate. Verification Code: ${verificationCode}`,
      dedupeKey: `cert_issued_${cert._id}`
    });

    return cert;
  }

  static async revokeCertificate(adminId: string, certId: string, reason: string) {
    const cert = await Certificate.findById(certId);
    if (!cert) throw new AppError(404, 'NOT_FOUND', 'Certificate not found');
    if (cert.status === 'REVOKED') throw new AppError(400, 'BAD_REQUEST', 'Already revoked');

    cert.status = 'REVOKED';
    cert.revokedAt = new Date();
    cert.revokedReason = reason;
    await cert.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'CERTIFICATE_REVOKED',
      entityType: 'Certificate',
      entityId: cert._id.toString()
    });

    return cert;
  }

  static async verifyPublic(code: string) {
    const cert = await Certificate.findOne({
      $or: [{ verificationCode: code }, { certificateNumber: code }]
    }).populate({
      path: 'donorProfileId',
      populate: { path: 'userId', select: 'firstName lastName name' },
      select: 'bloodGroup'
    });

    if (!cert) throw new AppError(404, 'NOT_FOUND', 'Invalid verification code');

    const donorProfile: any = cert.donorProfileId;
    const user: any = donorProfile?.userId;
    let donorPublicName = 'Anonymous';
    if (user) {
      if (user.firstName && user.lastName) {
        donorPublicName = `${user.firstName} ${user.lastName.charAt(0)}.`;
      } else if (user.name) {
        const parts = user.name.split(' ');
        donorPublicName = parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : parts[0];
      }
    }

    return {
      certificateNumber: cert.certificateNumber,
      certificateCode: cert.verificationCode,
      verificationCode: cert.verificationCode,
      certificateType: cert.certificateType,
      issueDate: cert.issueDate,
      status: cert.status,
      assetUrl: cert.assetUrl,
      recipientName: donorPublicName,
      bloodGroup: donorProfile?.bloodGroup
    };
  }

  static async getCertificateById(certId: string, userId: string, role?: string) {
    const cert = await Certificate.findById(certId).populate({
      path: 'donorProfileId',
      populate: { path: 'userId', select: 'name firstName lastName email' }
    });
    if (!cert) throw new AppError(404, 'NOT_FOUND', 'Certificate not found');

    const isStaffOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO'].includes(role || '');
    if (!isStaffOrAdmin) {
      const profile: any = cert.donorProfileId;
      const ownerId = profile?.userId?._id?.toString() || profile?.userId?.toString();
      if (ownerId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Access denied to this certificate');
      }
    }

    return cert;
  }

  static async getUserCertificates(userId: string) {
    const profile = await DonorProfile.findOne({ userId });
    if (!profile) return [];
    return Certificate.find({ donorProfileId: profile._id }).sort({ issueDate: -1 });
  }

  static async getAllCertificates(filters: any) {
    const limit = parseInt(filters.limit) || 20;
    const page = parseInt(filters.page) || 1;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.certificateType) query.certificateType = filters.certificateType;

    const certs = await Certificate.find(query)
      .populate({ path: 'donorProfileId', select: 'bloodGroup userId' })
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Certificate.countDocuments(query);
    return { data: certs, items: certs, results: certs, total, page, limit };
  }
}
