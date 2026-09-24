import request from 'supertest';
import app from '../src/app';
import { Campaign } from '../src/modules/campaigns/campaign.model';
import { CampaignParticipant } from '../src/modules/campaigns/campaignParticipant.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/campaigns/campaign.model');
jest.mock('../src/modules/campaigns/campaignParticipant.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('Campaigns & Participants', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string, role = 'USER') => jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('POST /api/v1/campaigns', () => {
    it('should reject past dates for campaign creation', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      
      const res = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${generateToken('admin1', 'ADMIN')}`)
        .send({
          title: 'Test', organizer: 'NGO', location: 'KTM', date: pastDate.toISOString(), startTime: '10:00', endTime: '16:00', description: 'desc'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/past date/i);
    });

    it('should create campaign with future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      
      (Campaign.create as jest.Mock).mockResolvedValue({ _id: 'camp1', status: 'DRAFT' });

      const res = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${generateToken('admin1', 'ADMIN')}`)
        .send({
          title: 'Test', organizer: 'NGO', location: 'KTM', date: futureDate.toISOString(), startTime: '10:00', endTime: '16:00', description: 'desc'
        });

      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/v1/campaigns/:id/register', () => {
    it('should allow user to register for published campaign', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      (Campaign.findById as jest.Mock).mockResolvedValue({ _id: 'camp1', status: 'PUBLISHED', date: futureDate });
      (CampaignParticipant.findOne as jest.Mock).mockResolvedValue(null);
      (CampaignParticipant.create as jest.Mock).mockResolvedValue({ status: 'REGISTERED' });

      const res = await request(app)
        .post('/api/v1/campaigns/camp1/register')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({});

      expect(res.status).toBe(200);
      expect(CampaignParticipant.create).toHaveBeenCalled();
    });

    it('should prevent duplicate registration', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      (Campaign.findById as jest.Mock).mockResolvedValue({ _id: 'camp1', status: 'PUBLISHED', date: futureDate });
      (CampaignParticipant.findOne as jest.Mock).mockResolvedValue({ status: 'REGISTERED' });

      const res = await request(app)
        .post('/api/v1/campaigns/camp1/register')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({});

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/v1/campaigns/:id/status', () => {
    it('should prevent updating status of archived campaigns', async () => {
      (Campaign.findById as jest.Mock).mockResolvedValue({ _id: 'camp1', status: 'ARCHIVED' });
      
      const res = await request(app)
        .patch('/api/v1/campaigns/camp1/status')
        .set('Authorization', `Bearer ${generateToken('admin1', 'ADMIN')}`)
        .send({ status: 'PUBLISHED' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Cannot change status of a ARCHIVED/i);
    });
  });
});
