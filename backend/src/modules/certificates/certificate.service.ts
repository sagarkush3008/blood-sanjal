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

  static async verifyPublic(verificationCode: string) {
    const cert = await Certificate.findOne({ verificationCode }).populate({
      path: 'donorProfileId',
      populate: { path: 'userId', select: 'firstName lastName' },
      select: 'bloodGroup'
    });

    if (!cert) throw new AppError(404, 'NOT_FOUND', 'Invalid verification code');

    const donorProfile: any = cert.donorProfileId;
    const user: any = donorProfile.userId;
    const donorPublicName = user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Anonymous';

    return {
      certificateNumber: cert.certificateNumber,
      certificateType: cert.certificateType,
      issueDate: cert.issueDate,
      status: cert.status,
      assetUrl: cert.assetUrl,
      recipientName: donorPublicName,
      bloodGroup: donorProfile.bloodGroup
    };
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

    return Certificate.find().populate({ path: 'donorProfileId', select: 'bloodGroup' }).sort({ issueDate: -1 }).skip(skip).limit(limit);
  }
}
