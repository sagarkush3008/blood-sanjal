import request from 'supertest';
import app from '../src/app';
import { Certificate } from '../src/modules/certificates/certificate.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { AuditLog } from '../src/modules/audit/auditLog.model';
import { NotificationService } from '../src/modules/notifications/notification.service';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import { CertificateService } from '../src/modules/certificates/certificate.service';

jest.mock('../src/modules/certificates/certificate.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/audit/auditLog.model');
jest.mock('../src/modules/notifications/notification.service');

describe('Certificates & Public Verification', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string, role = 'USER') => jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('Service: issueCertificate', () => {
    it('should generate deterministic certificate with correct metadata', async () => {
      (DonorProfile.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'profile1', userId: { _id: 'user1' } })
      });
      (Certificate.countDocuments as jest.Mock).mockResolvedValue(42);
      (Certificate.create as jest.Mock).mockResolvedValue({ _id: 'cert1', certificateNumber: 'BS-CERT-2026-00043' });

      await CertificateService.issueCertificate('admin1', { donorProfileId: 'profile1', certificateType: 'GOLD' });

      expect(Certificate.create).toHaveBeenCalledWith(expect.objectContaining({
        certificateType: 'GOLD',
        certificateNumber: expect.stringMatching(/BS-CERT-\d{4}-00043/)
      }));
      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'CERTIFICATE_ISSUED' }));
      expect(NotificationService.dispatch).toHaveBeenCalled();
    });
  });

  describe('Service: verifyPublic', () => {
    it('should return safe public DTO for valid code', async () => {
      (Certificate.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          certificateNumber: 'BS-CERT-001',
          certificateType: 'GOLD',
          issueDate: new Date(),
          status: 'ISSUED',
          donorProfileId: { bloodGroup: 'A+', userId: { firstName: 'John', lastName: 'Doe' } }
        })
      });

      const res = await CertificateService.verifyPublic('VALID_CODE');
      expect(res.recipientName).toBe('John D.');
      expect(res.bloodGroup).toBe('A+');
      expect((res as any).donorProfileId).toBeUndefined(); // no raw profile exposed
    });

    it('should throw NOT_FOUND for invalid code', async () => {
      (Certificate.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      await expect(CertificateService.verifyPublic('INVALID_CODE')).rejects.toThrow('Invalid verification code');
    });
  });

  describe('API Endpoints', () => {
    it('GET /api/v1/certificates/verify?code=123 should return public cert', async () => {
      (Certificate.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          certificateNumber: 'BS-CERT-001',
          certificateType: 'SILVER',
          status: 'ISSUED',
          donorProfileId: { bloodGroup: 'B+', userId: { firstName: 'Jane', lastName: 'Smith' } }
        })
      });

      const res = await request(app).get('/api/v1/certificates/verify?code=123');
      expect(res.status).toBe(200);
      expect(res.body.data.recipientName).toBe('Jane S.');
    });

    it('PATCH /api/v1/certificates/:id/revoke should revoke by admin', async () => {
      (Certificate.findById as jest.Mock).mockResolvedValue({ _id: 'cert1', status: 'ISSUED', save: jest.fn() });

      const res = await request(app)
        .patch('/api/v1/certificates/cert1/revoke')
        .set('Authorization', `Bearer ${generateToken('admin1', 'ADMIN')}`)
        .send({ reason: 'Fraudulent' });

      expect(res.status).toBe(200);
      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'CERTIFICATE_REVOKED' }));
    });
  });
});
