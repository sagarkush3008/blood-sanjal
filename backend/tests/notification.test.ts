import request from 'supertest';
import app from '../src/app';
import { Notification } from '../src/modules/notifications/notification.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { User } from '../src/modules/users/user.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import { NotificationService } from '../src/modules/notifications/notification.service';

jest.mock('../src/modules/notifications/notification.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/users/user.model');
jest.mock('../src/config/logger.config');

describe('Notifications & Preference Engine', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string, role = 'USER') => jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('Service: NotificationService.dispatch', () => {
    it('should respect user opt-out preference', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user1', email: 'test@test.com' });
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({ notificationPreference: 'NONE' });

      const result = await NotificationService.dispatch({
        userId: 'user1',
        type: 'SYSTEM',
        title: 'Test',
        message: 'Test',
        dedupeKey: 'key1'
      });

      expect(result).toBeUndefined();
      expect(Notification.create).not.toHaveBeenCalled();
    });

    it('should be idempotent and not dispatch duplicates', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user1', email: 'test@test.com' });
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({ notificationPreference: 'ALL' });
      (Notification.findOne as jest.Mock).mockResolvedValue({ _id: 'notif1', dedupeKey: 'key1' }); // already exists

      const result = await NotificationService.dispatch({
        userId: 'user1',
        type: 'SYSTEM',
        title: 'Test',
        message: 'Test',
        dedupeKey: 'key1'
      });

      expect(result).toBeDefined();
      expect(Notification.create).not.toHaveBeenCalled();
    });

    it('should handle mock email failure without blocking', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user1', email: 'test@test.com' });
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({ notificationPreference: 'ALL', contactPreference: 'EMAIL' });
      (Notification.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockNotif: any = { _id: 'notif1', save: jest.fn() };
      (Notification.create as jest.Mock).mockResolvedValue(mockNotif);
      (Notification.findById as jest.Mock).mockResolvedValue(mockNotif);

      // Trigger fail branch in mock sender
      await expect(
        NotificationService.dispatch({
          userId: 'user1',
          type: 'SYSTEM',
          title: 'FAIL_EMAIL',
          message: 'Test',
          dedupeKey: 'key2'
        })
      ).resolves.not.toThrow();

      // Ensure mock job was called and saved failed state
      // Note: Because it's fire-and-forget in dispatch, we can just test sendEmail directly
      await expect(NotificationService.sendEmail('notif1', 'test@test.com', 'FAIL_EMAIL', 'test')).rejects.toThrow();
      expect(mockNotif.emailStatus).toBe('FAILED');
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('should list user notifications', async () => {
      (Notification.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ title: 'Hello' }]) }) })
      });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${generateToken('user1')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark as read', async () => {
      (Notification.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'notif1', isRead: true });

      const res = await request(app)
        .patch('/api/v1/notifications/notif1/read')
        .set('Authorization', `Bearer ${generateToken('user1')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });
  });
});
