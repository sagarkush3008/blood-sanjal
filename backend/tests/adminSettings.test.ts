import request from 'supertest';
import app from '../src/app';
import { SystemConfig } from '../src/modules/admin/systemConfig.model';
import { AuditLog } from '../src/modules/audit/auditLog.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import mongoose from 'mongoose';

jest.mock('../src/modules/admin/systemConfig.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('Admin Settings & Audit API', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    adminToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'ADMIN' }, env.JWT_ACCESS_SECRET);
    userToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'USER' }, env.JWT_ACCESS_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Settings', () => {
    it('should get settings', async () => {
      (SystemConfig.find as jest.Mock).mockResolvedValue([
        { key: 'platformFee', value: { amountMinor: 100, currency: 'NPR' } }
      ]);

      const res = await request(app).get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.platformFee.amountMinor).toBe(100);
    });

    it('should update settings and log audit', async () => {
      (SystemConfig.find as jest.Mock).mockResolvedValue([]);
      (SystemConfig.findOneAndUpdate as jest.Mock).mockResolvedValue({});
      (AuditLog.create as jest.Mock).mockResolvedValue({});

      const updates = {
        reminderPolicy: { donationIntervalDays: 90, maxRemindersPerMonth: 2 }
      };

      const res = await request(app).put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(SystemConfig.findOneAndUpdate).toHaveBeenCalledWith(
        { key: 'reminderPolicy' },
        { value: updates.reminderPolicy },
        { upsert: true }
      );
      expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE_SYSTEM_SETTINGS',
        entityType: 'SYSTEM_CONFIG'
      }));
    });

    it('should reject invalid settings format', async () => {
      (SystemConfig.find as jest.Mock).mockResolvedValue([]);

      const invalidUpdates = {
        reminderPolicy: { donationIntervalDays: 10, maxRemindersPerMonth: 2 } // min is 30
      };

      const res = await request(app).put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdates);

      expect(res.status).toBe(400);
      expect(SystemConfig.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should reject non-admin from updating settings', async () => {
      const res = await request(app).put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reminderPolicy: { donationIntervalDays: 90, maxRemindersPerMonth: 2 } });

      expect(res.status).toBe(403);
    });
  });

  describe('Audit Logs', () => {
    it('should return paginated audit logs', async () => {
      (AuditLog.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue([
                { action: 'UPDATE_SYSTEM_SETTINGS' }
              ])
            })
          })
        })
      });
      (AuditLog.countDocuments as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/v1/admin/audit?action=UPDATE_SYSTEM_SETTINGS')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBe(1);
    });
  });
});
