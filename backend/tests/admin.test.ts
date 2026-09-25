import request from 'supertest';
import app from '../src/app';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { BloodRequest } from '../src/modules/requests/bloodRequest.model';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';
import { AuditLog } from '../src/modules/audit/auditLog.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import mongoose from 'mongoose';

jest.mock('../src/modules/users/user.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/requests/bloodRequest.model');
jest.mock('../src/modules/donors/donationRecord.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('Admin API', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    adminToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'ADMIN' }, env.JWT_ACCESS_SECRET);
    userToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'USER' }, env.JWT_ACCESS_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RBAC', () => {
    it('should reject USER from accessing admin routes', async () => {
      const res = await request(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to access admin routes', async () => {
      (User.find as jest.Mock).mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) }) });
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      const res = await request(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('User Management', () => {
    it('should verify/activate user and log audit', async () => {
      const mockUser = { _id: 'user123', status: 'UNVERIFIED', save: jest.fn() };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const res = await request(app).patch('/api/v1/admin/users/user123/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(mockUser.status).toBe('ACTIVE');
      expect(mockUser.save).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE_USER_STATUS_ACTIVE',
        entityType: 'USER',
        entityId: 'user123'
      }));
    });

    it('should soft-delete user', async () => {
      const mockUser = { _id: 'user123', status: 'ACTIVE', deletedAt: undefined, save: jest.fn() };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const res = await request(app).delete('/api/v1/admin/users/user123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockUser.status).toBe('SUSPENDED');
      expect(mockUser.deletedAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('Request Management', () => {
    it('should update request status', async () => {
      const mockReq = { _id: 'req123', status: 'PENDING_VERIFICATION', urgency: 'NORMAL', save: jest.fn() };
      (BloodRequest.findById as jest.Mock).mockResolvedValue(mockReq);

      const res = await request(app).patch('/api/v1/admin/requests/req123/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE', urgency: 'EMERGENCY' });

      expect(res.status).toBe(200);
      expect(mockReq.status).toBe('ACTIVE');
      expect(mockReq.urgency).toBe('EMERGENCY');
    });
  });

  describe('Donation Management', () => {
    it('should verify donation, update count and log audit', async () => {
      const mockDonation = { _id: 'don123', donorProfileId: 'profile123', verificationStatus: 'PENDING', donationDate: new Date(), save: jest.fn() };
      const mockDonor = { _id: 'profile123', totalDonations: 1, save: jest.fn() };
      
      (DonationRecord.findById as jest.Mock).mockResolvedValue(mockDonation);
      (DonorProfile.findById as jest.Mock).mockResolvedValue(mockDonor);

      const res = await request(app).patch('/api/v1/admin/donations/don123/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ verificationStatus: 'VERIFIED' });

      expect(res.status).toBe(200);
      expect(mockDonation.verificationStatus).toBe('VERIFIED');
      expect(mockDonor.totalDonations).toBe(2);
      expect(mockDonor.save).toHaveBeenCalled();
    });
  });
});
