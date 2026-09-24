import request from 'supertest';
import app from '../src/app';
import { User } from '../src/modules/users/user.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/users/user.model');

describe('User Profile & RBAC', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string, role: string) => {
    return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  };

  describe('GET /api/v1/me', () => {
    it('should return user profile', async () => {
      const mockUser = { _id: 'user123', name: 'John Doe', role: 'USER' };
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const token = generateToken('user123', 'USER');
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('John Doe');
    });
  });

  describe('PATCH /api/v1/me', () => {
    it('should update user profile and prevent role escalation', async () => {
      const mockUpdatedUser = { _id: 'user123', name: 'Jane Doe', role: 'USER' };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      });

      const token = generateToken('user123', 'USER');
      const res = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Jane Doe', role: 'ADMIN', status: 'ACTIVE' }); // Attempting to force role/status

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Jane Doe');
      
      // Ensure role/status are not passed to findByIdAndUpdate
      const updatePayload = (User.findByIdAndUpdate as jest.Mock).mock.calls[0][1].$set;
      expect(updatePayload.role).toBeUndefined();
      expect(updatePayload.status).toBeUndefined();
    });
  });

  describe('RBAC Middleware', () => {
    it('should prevent regular user from accessing admin routes', async () => {
      const token = generateToken('user123', 'USER');
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow admin to access admin routes', async () => {
      const token = generateToken('admin123', 'ADMIN');
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Welcome Admin');
    });
  });
});
