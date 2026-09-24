import request from 'supertest';
import app from '../src/app';
import { BloodRequest } from '../src/modules/requests/bloodRequest.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/requests/bloodRequest.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('Blood Request Workflow', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string, role = 'USER') => 
    jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  const validPayload = {
    bloodGroup: 'O+',
    unitsRequired: 2,
    hospitalName: 'City Hospital',
    hospitalLocation: { address: 'Main St' },
    requiredDate: new Date(Date.now() + 86400000).toISOString(),
    urgency: 'NORMAL',
    contactPerson: { name: 'John', phone: '1234567890' }
  };

  describe('POST /api/v1/requests', () => {
    it('should reject missing hospital', async () => {
      const payload = { ...validPayload, hospitalName: undefined };
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send(payload);

      expect(res.status).toBe(422);
    });

    it('should reject invalid blood group', async () => {
      const payload = { ...validPayload, bloodGroup: 'C+' };
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send(payload);

      expect(res.status).toBe(422);
    });

    it('should reject impossible unit quantities', async () => {
      const payload = { ...validPayload, unitsRequired: 100 };
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send(payload);

      expect(res.status).toBe(422);
    });

    it('should reject past required time', async () => {
      const payload = { ...validPayload, requiredDate: new Date(Date.now() - 86400000).toISOString() };
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send(payload);

      expect(res.status).toBe(422);
    });

    it('should reject duplicate active/pending submissions', async () => {
      (BloodRequest.findOne as jest.Mock).mockResolvedValue({ _id: 'existing123' });

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PATCH /api/v1/requests/:id', () => {
    it('should reject unauthorized edits on active requests', async () => {
      (BloodRequest.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'req1', 
        requesterId: 'user1', 
        status: 'ACTIVE' 
      });

      const res = await request(app)
        .patch('/api/v1/requests/req1')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ unitsRequired: 3 });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/requests/:id/verify', () => {
    it('should enforce verification gate (only PENDING can be activated)', async () => {
      (BloodRequest.findById as jest.Mock).mockResolvedValue({ 
        _id: 'req1', 
        status: 'DRAFT', 
        save: jest.fn() 
      });

      const res = await request(app)
        .post('/api/v1/requests/req1/verify')
        .set('Authorization', `Bearer ${generateToken('admin1', 'ADMIN')}`)
        .send({ activate: true });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/requests/:id/fulfill', () => {
    it('should support partial fulfillment', async () => {
      const mockRequest = { 
        _id: 'req1', 
        status: 'ACTIVE',
        unitsRequired: 4,
        unitsFulfilled: 1,
        save: jest.fn() 
      };
      (BloodRequest.findById as jest.Mock).mockResolvedValue(mockRequest);

      const res = await request(app)
        .post('/api/v1/requests/req1/fulfill')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ units: 2 });

      expect(res.status).toBe(200);
      expect(mockRequest.unitsFulfilled).toBe(3);
      expect(mockRequest.status).toBe('PARTIALLY_FULFILLED');
    });
    
    it('should close request when fully fulfilled', async () => {
      const mockRequest = { 
        _id: 'req1', 
        status: 'PARTIALLY_FULFILLED',
        unitsRequired: 4,
        unitsFulfilled: 3,
        save: jest.fn() 
      };
      (BloodRequest.findById as jest.Mock).mockResolvedValue(mockRequest);

      const res = await request(app)
        .post('/api/v1/requests/req1/fulfill')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ units: 1 });

      expect(res.status).toBe(200);
      expect(mockRequest.unitsFulfilled).toBe(4);
      expect(mockRequest.status).toBe('FULFILLED');
    });
  });
});
