import request from 'supertest';
import app from '../src/app';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/donors/donationRecord.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/audit/auditLog.model');
jest.mock('../src/modules/payments/payment.service');
jest.mock('../src/modules/admin/systemConfig.model');

describe('Donation Records & Verification', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string, role = 'USER') => jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('POST /api/v1/donations/me', () => {
    it('should submit a donation and set status to PENDING', async () => {
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({ _id: 'profile1' });
      (DonationRecord.findOne as jest.Mock).mockResolvedValue(null);
      (DonationRecord.create as jest.Mock).mockResolvedValue({ _id: 'rec1', verificationStatus: 'PENDING' });

      const res = await request(app)
        .post('/api/v1/donations/me')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ donationDate: new Date().toISOString(), hospitalName: 'GH' });

      expect(res.status).toBe(201);
      expect(res.body.data.verificationStatus).toBe('PENDING');
    });

    it('should prevent duplicate submission for same date', async () => {
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({ _id: 'profile1' });
      (DonationRecord.findOne as jest.Mock).mockResolvedValue({ _id: 'rec1' });

      const res = await request(app)
        .post('/api/v1/donations/me')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ donationDate: new Date().toISOString() });

      expect(res.status).toBe(409);
    });
    
    it('should prevent future dates', async () => {
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({ _id: 'profile1' });
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const res = await request(app)
        .post('/api/v1/donations/me')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ donationDate: futureDate.toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/future/i);
    });
  });

  describe('POST /api/v1/donations/:id/verify', () => {
    it('should reject unauthorized user', async () => {
      const res = await request(app)
        .post('/api/v1/donations/rec1/verify')
        .set('Authorization', `Bearer ${generateToken('user1', 'USER')}`) // not admin
        .send({ action: 'VERIFIED' });

      expect(res.status).toBe(403);
    });

    it('should verify and update profile counts', async () => {
      const mockRecord = {
        _id: 'rec1',
        donorProfileId: 'profile1',
        donationDate: new Date('2025-01-01'),
        verificationStatus: 'PENDING',
        save: jest.fn()
      };
      const mockProfile: any = {
        _id: 'profile1',
        save: jest.fn()
      };

      const { SystemConfig } = require('../src/modules/admin/systemConfig.model');
      SystemConfig.findOne.mockResolvedValue({ value: { daysAfterDonation: 90 } });

      (DonationRecord.findById as jest.Mock).mockResolvedValue(mockRecord);
      (DonorProfile.findById as jest.Mock).mockResolvedValue(mockProfile);
      (DonationRecord.countDocuments as jest.Mock).mockResolvedValue(5);

      const res = await request(app)
        .post('/api/v1/donations/rec1/verify')
        .set('Authorization', `Bearer ${generateToken('admin1', 'ADMIN')}`)
        .send({ action: 'VERIFIED' });

      expect(res.status).toBe(200);
      expect(mockRecord.verificationStatus).toBe('VERIFIED');
      expect(mockProfile.totalDonations).toBe(5);
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it('should not update counts if rejected', async () => {
      const mockRecord = {
        _id: 'rec1',
        donorProfileId: 'profile1',
        verificationStatus: 'PENDING',
        save: jest.fn()
      };

      (DonationRecord.findById as jest.Mock).mockResolvedValue(mockRecord);

      const res = await request(app)
        .post('/api/v1/donations/rec1/verify')
        .set('Authorization', `Bearer ${generateToken('admin1', 'ADMIN')}`)
        .send({ action: 'REJECTED', reason: 'Fake' });

      expect(res.status).toBe(200);
      expect(mockRecord.verificationStatus).toBe('REJECTED');
      expect((mockRecord as any).rejectionReason).toBe('Fake');
      expect(DonorProfile.findById).not.toHaveBeenCalled();
    });
  });
});
