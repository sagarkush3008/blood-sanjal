import request from 'supertest';
import app from '../src/app';
import { User } from '../src/modules/users/user.model';
import { OtpCode } from '../src/modules/auth/models/otpCode.model';
import { Session } from '../src/modules/auth/models/session.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../src/modules/users/user.model');
jest.mock('../src/modules/auth/models/otpCode.model');
jest.mock('../src/modules/auth/models/session.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and send OTP', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({ _id: 'user123', email: 'test@test.com' });
      (OtpCode.create as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test User', email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('OTP sent');
    });

    it('should reject duplicate email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ email: 'test@test.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test User', email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login and set httpOnly cookie', async () => {
      const mockHash = await bcrypt.hash('password123', 1);
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user123', email: 'test@test.com', passwordHash: mockHash, role: 'USER', save: jest.fn() });
      (Session.create as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
      expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });
});
