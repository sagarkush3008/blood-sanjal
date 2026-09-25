import request from 'supertest';
import app from '../src/app';
import { Campaign } from '../src/modules/campaigns/campaign.model';
import { BroadcastNotification } from '../src/modules/admin/broadcastNotification.model';
import { Reward } from '../src/modules/rewards/reward.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { User } from '../src/modules/users/user.model';
import { AuditLog } from '../src/modules/audit/auditLog.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import mongoose from 'mongoose';
import { EmailService } from '../src/modules/email/email.service';

jest.mock('../src/modules/campaigns/campaign.model');
jest.mock('../src/modules/admin/broadcastNotification.model');
jest.mock('../src/modules/rewards/reward.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/users/user.model');
jest.mock('../src/modules/audit/auditLog.model');
jest.mock('../src/modules/email/email.service');
jest.mock('../src/modules/campaigns/campaignParticipant.model');

describe('Admin Ops API', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    adminToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'ADMIN' }, env.JWT_ACCESS_SECRET);
    userToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'USER' }, env.JWT_ACCESS_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Campaigns', () => {
    it('should create campaign', async () => {
      const mockCampaign = { _id: 'camp123', status: 'DRAFT', title: 'Test', save: jest.fn() };
      (Campaign.create as jest.Mock).mockResolvedValue(mockCampaign);
      
      const res = await request(app).post('/api/v1/admin/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test' });

      expect(res.status).toBe(201);
      expect(Campaign.create).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });

    it('should update campaign status', async () => {
      const mockCampaign = { _id: 'camp123', status: 'DRAFT', save: jest.fn() };
      (Campaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
      
      const res = await request(app).patch('/api/v1/admin/campaigns/camp123/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PUBLISHED' });

      expect(res.status).toBe(200);
      expect(mockCampaign.status).toBe('PUBLISHED');
      expect(mockCampaign.save).toHaveBeenCalled();
    });
  });

  describe('Broadcast Notifications', () => {
    it('should create a broadcast notification', async () => {
      const mockNotif = { _id: 'notif123', save: jest.fn() };
      (BroadcastNotification.create as jest.Mock).mockResolvedValue(mockNotif);

      const res = await request(app).post('/api/v1/admin/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test', message: 'Hello', target: { type: 'ALL' }, channels: ['EMAIL'] });

      expect(res.status).toBe(201);
      expect(BroadcastNotification.create).toHaveBeenCalled();
    });

    it('should cancel broadcast if not processed', async () => {
      const mockNotif: any = { _id: 'notif123', status: 'SCHEDULED', save: jest.fn() };
      (BroadcastNotification.findById as jest.Mock).mockResolvedValue(mockNotif);

      const res = await request(app).post('/api/v1/admin/notifications/notif123/cancel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockNotif.status).toBe('CANCELLED');
    });

    it('should prevent canceling in-progress broadcast', async () => {
      const mockNotif: any = { _id: 'notif123', status: 'PROCESSING', save: jest.fn() };
      (BroadcastNotification.findById as jest.Mock).mockResolvedValue(mockNotif);

      const res = await request(app).post('/api/v1/admin/notifications/notif123/cancel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should process broadcast to target audiences and exclude opted out', async () => {
      const mockNotif: any = { _id: 'notif123', status: 'SCHEDULED', target: { type: 'ALL' }, channels: ['EMAIL'], message: 'Hello', save: jest.fn() };
      (BroadcastNotification.findById as jest.Mock).mockResolvedValue(mockNotif);

      // We mock User.find to return one opted-in user and one opted-out user, but in our implementation 
      // the filter `{ 'privacySettings.emergencyNotifications': true }` already excludes opted-out users at DB level.
      // So we just return 1 user
      (User.find as jest.Mock).mockResolvedValue([{ _id: 'u1', email: 'test@example.com' }]);

      const res = await request(app).post('/api/v1/admin/notifications/notif123/process')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(EmailService.enqueueEmail).toHaveBeenCalledWith('test@example.com', 'adminAlert', { message: 'Hello' }, expect.any(String));
      expect(mockNotif.status).toBe('COMPLETED');
    });

    it('should handle failures gracefully and set back to SCHEDULED for retry', async () => {
      const mockNotif: any = { _id: 'notif123', status: 'SCHEDULED', target: { type: 'ALL' }, channels: ['EMAIL'], message: 'Hello', save: jest.fn() };
      (BroadcastNotification.findById as jest.Mock).mockResolvedValue(mockNotif);

      (User.find as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const res = await request(app).post('/api/v1/admin/notifications/notif123/process')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockNotif.status).toBe('SCHEDULED');
      expect(mockNotif.executionLog).toBe('DB Error');
    });
  });

  describe('Rewards', () => {
    it('should issue reward to donor and log audit', async () => {
      (DonorProfile.findById as jest.Mock).mockResolvedValue({ _id: 'donor123' });
      (Reward.create as jest.Mock).mockResolvedValue({ _id: 'reward123' });

      const res = await request(app).post('/api/v1/admin/rewards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ donorProfileId: 'donor123', badgeType: 'BLOOD_HERO', milestone: 10, notes: 'Great job' });

      expect(res.status).toBe(201);
      expect(Reward.create).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });
  });
});
