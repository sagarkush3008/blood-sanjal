import request from 'supertest';
import app from '../src/app';
import { ContactRequest } from '../src/modules/requests/contactRequest.model';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/requests/contactRequest.model');
jest.mock('../src/modules/users/user.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('Contact Request & Privacy Reveal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string) => jwt.sign({ userId, role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('POST /api/v1/contact-requests', () => {
    it('should create a pending request and prevent duplicates', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ 
        _id: 'donor1', 
        privacySettings: { contactRevealPolicy: 'CONSENT_REQUIRED' } 
      });
      (ContactRequest.findOne as jest.Mock).mockResolvedValue(null);
      (ContactRequest.create as jest.Mock).mockResolvedValue({ _id: 'req1', status: 'PENDING' });

      const res = await request(app)
        .post('/api/v1/contact-requests')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ donorId: 'donor1' });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should prevent duplicates', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ 
        _id: 'donor1', 
        privacySettings: { contactRevealPolicy: 'CONSENT_REQUIRED' } 
      });
      (ContactRequest.findOne as jest.Mock).mockResolvedValue({ _id: 'req1' });

      const res = await request(app)
        .post('/api/v1/contact-requests')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ donorId: 'donor1' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/open contact request/i);
    });

    it('should block if donor is HIDDEN', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ 
        _id: 'donor1', 
        privacySettings: { contactRevealPolicy: 'HIDDEN' } 
      });

      const res = await request(app)
        .post('/api/v1/contact-requests')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ donorId: 'donor1' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/contact-requests/:id/accept', () => {
    it('should accept and reveal specific allowed contact info', async () => {
      const mockReq = {
        _id: 'req1',
        donorId: 'donor1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 10000),
        save: jest.fn()
      };
      (ContactRequest.findById as jest.Mock).mockResolvedValue(mockReq);
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'donor1',
        email: 'donor@mail.com',
        phone: '123456'
      });
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({
        contactPreference: 'PHONE' // Only phone is revealed
      });

      const res = await request(app)
        .post('/api/v1/contact-requests/req1/accept')
        .set('Authorization', `Bearer ${generateToken('donor1')}`);

      expect(res.status).toBe(200);
      expect(mockReq.status).toBe('ACCEPTED');
      expect((mockReq as any).revealedContactInfo).toBeDefined();
      expect((mockReq as any).revealedContactInfo.phone).toBe('123456');
      expect((mockReq as any).revealedContactInfo.email).toBeUndefined(); // Email not revealed
    });
  });

  describe('POST /api/v1/contact-requests/:id/decline', () => {
    it('should decline the request', async () => {
      const mockReq = {
        _id: 'req1',
        donorId: 'donor1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 10000),
        save: jest.fn()
      };
      (ContactRequest.findById as jest.Mock).mockResolvedValue(mockReq);

      const res = await request(app)
        .post('/api/v1/contact-requests/req1/decline')
        .set('Authorization', `Bearer ${generateToken('donor1')}`);

      expect(res.status).toBe(200);
      expect(mockReq.status).toBe('DECLINED');
    });
  });
});
