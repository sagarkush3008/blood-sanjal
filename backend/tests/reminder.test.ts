import request from 'supertest';
import app from '../src/app';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { ReminderJob } from '../src/modules/reminders/reminderJob.model';
import { SystemConfig } from '../src/modules/admin/systemConfig.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/reminders/reminderJob.model');
jest.mock('../src/modules/admin/systemConfig.model');

describe('Donation Reminders & Scheduled Checks', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string, role = 'ADMIN') => jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('POST /api/v1/reminders/trigger', () => {
    it('should generate reminders for due donors', async () => {
      (SystemConfig.findOne as jest.Mock).mockResolvedValue({ value: { enabled: true, daysAfterDonation: 90 } });
      
      const mockDonor = {
        _id: 'donor1',
        reminderDate: new Date('2024-01-01'),
        userId: { name: 'John', email: 'john@test.com' }
      };

      (DonorProfile.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockDonor])
      });

      (ReminderJob.findOne as jest.Mock).mockResolvedValue(null);
      (ReminderJob.create as jest.Mock).mockResolvedValue({ save: jest.fn() });

      const res = await request(app)
        .post('/api/v1/reminders/trigger')
        .set('Authorization', `Bearer ${generateToken('admin1')}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.processedCount).toBe(1);
      expect(ReminderJob.create).toHaveBeenCalledWith(expect.objectContaining({
        donorProfileId: 'donor1',
        reminderType: 'ELIGIBILITY'
      }));
    });

    it('should skip processing if disabled in config', async () => {
      (SystemConfig.findOne as jest.Mock).mockResolvedValue({ value: { enabled: false } });

      const res = await request(app)
        .post('/api/v1/reminders/trigger')
        .set('Authorization', `Bearer ${generateToken('admin1')}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.processedCount).toBe(0);
      expect(DonorProfile.find).not.toHaveBeenCalled();
    });

    it('should be idempotent and not send duplicates', async () => {
      (SystemConfig.findOne as jest.Mock).mockResolvedValue({ value: { enabled: true } });
      
      const mockDonor = {
        _id: 'donor1',
        reminderDate: new Date('2024-01-01'),
        userId: { name: 'John', email: 'john@test.com' }
      };

      (DonorProfile.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockDonor])
      });

      // Mock existing job
      (ReminderJob.findOne as jest.Mock).mockResolvedValue({ _id: 'job1' });

      const res = await request(app)
        .post('/api/v1/reminders/trigger')
        .set('Authorization', `Bearer ${generateToken('admin1')}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.processedCount).toBe(0);
      expect(ReminderJob.create).not.toHaveBeenCalled();
    });
  });
});
