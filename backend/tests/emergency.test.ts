import request from 'supertest';
import app from '../src/app';
import { BloodRequest } from '../src/modules/requests/bloodRequest.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { NotificationJob } from '../src/modules/notifications/notificationQueue.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/requests/bloodRequest.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/notifications/notificationQueue.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('Emergency Blood Request & Broadcast', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateAdminToken = () => jwt.sign({ userId: 'admin1', role: 'ADMIN' }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('POST /api/v1/requests/:id/broadcast', () => {
    it('should reject broadcast before approval (ACTIVE status)', async () => {
      (BloodRequest.findById as jest.Mock).mockResolvedValue({
        _id: 'req1',
        urgency: 'EMERGENCY',
        status: 'PENDING_VERIFICATION',
      });

      const res = await request(app)
        .post('/api/v1/requests/req1/broadcast')
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/ACTIVE/i);
      expect(NotificationJob.insertMany).not.toHaveBeenCalled();
    });

    it('should reject non-emergency requests', async () => {
      (BloodRequest.findById as jest.Mock).mockResolvedValue({
        _id: 'req1',
        urgency: 'NORMAL',
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/v1/requests/req1/broadcast')
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/EMERGENCY/);
    });

    it('should prevent duplicate broadcasts', async () => {
      (BloodRequest.findById as jest.Mock).mockResolvedValue({
        _id: 'req1',
        urgency: 'EMERGENCY',
        status: 'ACTIVE',
        broadcastedAt: new Date()
      });

      const res = await request(app)
        .post('/api/v1/requests/req1/broadcast')
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send();

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should queue notifications for matching safe donors', async () => {
      const mockRequest = {
        _id: 'req1',
        urgency: 'EMERGENCY',
        status: 'ACTIVE',
        bloodGroup: 'B+',
        hospitalName: 'General Hospital',
        unitsRequired: 2,
        save: jest.fn()
      };
      (BloodRequest.findById as jest.Mock).mockResolvedValue(mockRequest);

      const mockDonors = [
        {
          userId: { _id: 'user1', email: 'donor1@mail.com', privacySettings: { donorSearchVisibility: true } }
        },
        {
          userId: { _id: 'user2', email: 'donor2@mail.com', privacySettings: { donorSearchVisibility: false } }
        },
        {
          userId: { _id: 'user3', email: null, privacySettings: { donorSearchVisibility: true } }
        }
      ];

      (DonorProfile.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDonors)
      });

      const res = await request(app)
        .post('/api/v1/requests/req1/broadcast')
        .set('Authorization', `Bearer ${generateAdminToken()}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.matched).toBe(1);
      
      const queuedJobs = (NotificationJob.insertMany as jest.Mock).mock.calls[0][0];
      expect(queuedJobs.length).toBe(1);
      expect(queuedJobs[0].recipientEmail).toBe('donor1@mail.com');
      
      expect(queuedJobs[0].content).not.toMatch(/phone|number|contact/i);
    });
  });
});
