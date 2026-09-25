import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import mongoose from 'mongoose';
import { BloodRequest } from '../src/modules/requests/bloodRequest.model';
import { User } from '../src/modules/users/user.model';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuditLog } from '../src/modules/audit/auditLog.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';

jest.mock('../src/modules/requests/bloodRequest.model');
jest.mock('../src/modules/users/user.model');
jest.mock('../src/modules/audit/audit.service');
jest.mock('../src/modules/audit/auditLog.model');
jest.mock('../src/modules/donors/donorProfile.model');

describe('Security, Privacy & Abuse Hardening', () => {
  let userToken: string;
  let adminToken: string;

  beforeAll(() => {
    userToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'USER' }, env.JWT_ACCESS_SECRET);
    adminToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'ADMIN' }, env.JWT_ACCESS_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NoSQL Injection Defense', () => {
    it('should reject requests with NoSQL operators due to schema validation (Zod)', async () => {
      const res = await request(app).post('/api/v1/auth/login')
        .send({ email: { $gt: "" }, password: "password123" });
      
      // Zod validation should fail because email should be a string, not an object
      console.log('Login error response:', res.body);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should block excessive auth requests', async () => {
      // Send 10 requests (limit is 10 per 15 min for auth routes)
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/v1/auth/login').send({ email: 'test@test.com', password: 'password123' });
      }
      
      // 11th request should be blocked
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@test.com', password: 'password123' });
      
      console.log('Rate limit response:', res.body);
      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('RBAC and Cross-User Protections', () => {
    it('should deny a regular user from marking a request as emergency (admin only)', async () => {
      const res = await request(app).post('/api/v1/requests/req123/broadcast')
        .set('Authorization', `Bearer ${userToken}`);
      
      console.log('RBAC user response:', res.body);
      expect(res.status).toBe(403);
    });

    it('should allow admin to perform broadcast/emergency actions', async () => {
      const mockReq: any = { _id: 'req123', status: 'ACTIVE', urgency: 'EMERGENCY', save: jest.fn() };
      mockReq.populate = jest.fn().mockResolvedValue(mockReq);
      (BloodRequest.findById as jest.Mock).mockResolvedValue(mockReq);
      (DonorProfile.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      const res = await request(app).post('/api/v1/requests/req123/broadcast')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Assuming it goes through the controller and hits our mock
      expect(res.status).toBe(200);
    });
  });
});
