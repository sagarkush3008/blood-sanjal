import request from 'supertest';
import app from '../src/app';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import { PaymentService } from '../src/modules/payments/payment.service';

jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/donors/donationRecord.model');
jest.mock('../src/modules/payments/payment.service');
jest.mock('../src/modules/users/user.model');

describe('Donor Profile & Availability', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string) => jwt.sign({ userId, role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('GET /api/v1/donors/search', () => {
    it('should return safe DTO and exclude private fields', async () => {
      const mockDonors = [
        {
          _id: 'donor1',
          bloodGroup: 'A+',
          donorStatus: 'ACTIVE',
          totalDonations: 2,
          userId: {
            _id: 'user1',
            name: 'John Safe',
            email: 'hidden@email.com',
            phone: '1234567890',
            locationCoordinates: { type: 'Point', coordinates: [85, 27] },
            privacySettings: { donorSearchVisibility: true }
          }
        },
        {
          _id: 'donor2',
          bloodGroup: 'O+',
          donorStatus: 'ACTIVE', // Even if active, user visibility is false
          userId: {
            _id: 'user2',
            privacySettings: { donorSearchVisibility: false }
          }
        }
      ];

      (DonorProfile.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockDonors)
          })
        })
      });

      PaymentService.hasValidSearchFee = jest.fn().mockResolvedValue(true);
      const { User } = require('../src/modules/users/user.model');
      User.find = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'user1' }, { _id: 'user2' }]) });

      const res = await request(app)
        .get('/api/v1/donors/search?bloodGroup=A+')
        .set('Authorization', `Bearer ${generateToken('user1')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results.length).toBe(1);
      
      const safeDonor = res.body.data.results[0];
      expect(safeDonor.name).toBe('John Safe');
      expect(safeDonor.email).toBeUndefined();
      expect(safeDonor.phone).toBeUndefined();
      expect(safeDonor.locationCoordinates).toBeUndefined(); // DTO strictly ignores this
    });
  });



  describe('POST /api/v1/donors/me/profile', () => {
    it('should ignore forced updates to totalDonations', async () => {
      (DonorProfile.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: 'donor1' });

      const res = await request(app)
        .post('/api/v1/donors/me/profile')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ bloodGroup: 'B+', totalDonations: 999 });

      expect(res.status).toBe(200);
      const updateData = (DonorProfile.findOneAndUpdate as jest.Mock).mock.calls[0][1].$set;
      expect(updateData.totalDonations).toBeUndefined();
    });
  });

  describe('PATCH /api/v1/donors/me/availability', () => {
    it('should set donor as inactive for specified hours', async () => {
      const mockProfile: any = { _id: 'donor1', userId: 'user1', save: jest.fn().mockResolvedValue(true) };
      (DonorProfile.findOne as jest.Mock).mockResolvedValue(mockProfile);

      const res = await request(app)
        .patch('/api/v1/donors/me/availability')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ status: 'INACTIVE', durationHours: 24, reason: 'Travel' });

      expect(res.status).toBe(200);
      expect(mockProfile.donorStatus).toBe('INACTIVE');
      expect(mockProfile.inactiveReason).toBe('Travel');
      expect(mockProfile.inactiveUntil).toBeDefined();
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it('should set donor back to active and remove inactive fields', async () => {
      const mockProfile: any = { _id: 'donor1', userId: 'user1', donorStatus: 'INACTIVE', inactiveUntil: new Date(), inactiveReason: 'Travel', save: jest.fn().mockResolvedValue(true) };
      (DonorProfile.findOne as jest.Mock).mockResolvedValue(mockProfile);

      const res = await request(app)
        .patch('/api/v1/donors/me/availability')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(mockProfile.donorStatus).toBe('ACTIVE');
      expect(mockProfile.inactiveReason).toBeUndefined();
      expect(mockProfile.inactiveUntil).toBeUndefined();
      expect(mockProfile.save).toHaveBeenCalled();
    });
  });
});
