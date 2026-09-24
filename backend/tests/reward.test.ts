import request from 'supertest';
import app from '../src/app';
import { Reward } from '../src/modules/rewards/reward.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { SystemConfig } from '../src/modules/admin/systemConfig.model';
import { NotificationService } from '../src/modules/notifications/notification.service';
import { RewardService } from '../src/modules/rewards/reward.service';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/rewards/reward.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/admin/systemConfig.model');
jest.mock('../src/modules/notifications/notification.service');

describe('Rewards & Recognition', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string, role = 'USER') => jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('Service: checkAndIssueRewards', () => {
    it('should issue FIRST_SAVER badge exactly once for a donor with 1 verified donation', async () => {
      (SystemConfig.findOne as jest.Mock).mockResolvedValue({
        value: [{ badgeType: 'FIRST_SAVER', count: 1, name: 'First Saver' }]
      });

      (DonorProfile.findById as jest.Mock).mockResolvedValue({
        _id: 'profile1',
        userId: 'user1',
        totalDonations: 1
      });

      (Reward.findOne as jest.Mock).mockResolvedValue(null);
      (Reward.create as jest.Mock).mockResolvedValue({ badgeType: 'FIRST_SAVER' });

      const newRewards = await RewardService.checkAndIssueRewards('profile1');
      
      expect(Reward.findOne).toHaveBeenCalledWith(expect.objectContaining({ badgeType: 'FIRST_SAVER', milestone: 1 }));
      expect(Reward.create).toHaveBeenCalled();
      expect(NotificationService.dispatch).toHaveBeenCalled();
      expect(newRewards?.length).toBe(1);
    });

    it('should skip issuance if donor does not meet milestone', async () => {
      (SystemConfig.findOne as jest.Mock).mockResolvedValue({
        value: [{ badgeType: 'REGULAR_SAVER', count: 3, name: 'Regular Saver' }]
      });

      (DonorProfile.findById as jest.Mock).mockResolvedValue({
        _id: 'profile1',
        userId: 'user1',
        totalDonations: 2
      });

      const newRewards = await RewardService.checkAndIssueRewards('profile1');
      expect(Reward.create).not.toHaveBeenCalled();
      expect(newRewards?.length).toBe(0);
    });

    it('should prevent duplicate issuance if badge already exists', async () => {
      (SystemConfig.findOne as jest.Mock).mockResolvedValue({
        value: [{ badgeType: 'FIRST_SAVER', count: 1, name: 'First Saver' }]
      });

      (DonorProfile.findById as jest.Mock).mockResolvedValue({
        _id: 'profile1',
        userId: 'user1',
        totalDonations: 1
      });

      (Reward.findOne as jest.Mock).mockResolvedValue({ _id: 'reward1' }); // Already issued

      const newRewards = await RewardService.checkAndIssueRewards('profile1');
      expect(Reward.create).not.toHaveBeenCalled();
      expect(newRewards?.length).toBe(0);
    });
  });

  describe('API Endpoints', () => {
    it('GET /api/v1/rewards/me should list my rewards', async () => {
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({ _id: 'profile1' });
      (Reward.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([{ badgeType: 'FIRST_SAVER' }]) });

      const res = await request(app)
        .get('/api/v1/rewards/me')
        .set('Authorization', `Bearer ${generateToken('user1')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });
});
