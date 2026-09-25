import request from 'supertest';
import app from '../src/app';
import { PaymentTransaction } from '../src/modules/payments/payment.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import { feeConfig } from '../src/config/fee.config';

jest.mock('../src/modules/payments/payment.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('Payment API', () => {
  let userToken: string;
  let adminToken: string;

  beforeAll(() => {
    userToken = jwt.sign({ userId: 'user123', role: 'USER' }, env.JWT_ACCESS_SECRET);
    adminToken = jwt.sign({ userId: 'admin123', role: 'SUPER_ADMIN' }, env.JWT_ACCESS_SECRET);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/payments/search-fee/initiate', () => {
    it('should initiate a payment with PENDING status and ignore forged status', async () => {
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(null);
      const mockTx = {
        _id: 'tx123',
        amountMinor: 5000,
        currency: 'NPR',
        purpose: 'SEARCH_PLATFORM_FEE',
        status: 'PENDING',
        save: jest.fn().mockResolvedValue(true)
      };
      (PaymentTransaction.create as jest.Mock).mockResolvedValue(mockTx);

      const res = await request(app)
        .post('/api/v1/payments/search-fee/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'SUCCESS' }); // Trying to forge status

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PENDING'); // Cannot be forged
      expect(res.body.data.amountMinor).toBe(5000); // 50 * 100
      expect(PaymentTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        purpose: 'SEARCH_PLATFORM_FEE'
      }));
      expect(PaymentTransaction.create).not.toHaveBeenCalledWith(expect.objectContaining({
        status: expect.anything()
      }));
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should handle webhook replay idempotently', async () => {
      const mockTx = {
        _id: 'tx123',
        status: 'SUCCESS', // Already success
        save: jest.fn()
      };
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(mockTx);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ gatewayTxId: 'MOCK-TX-123' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUCCESS');
      expect(mockTx.save).not.toHaveBeenCalled(); // No save on replay
    });

    it('should handle failed gateway response', async () => {
      const mockTx = {
        _id: 'tx123',
        amountMinor: 5000,
        status: 'PENDING',
        save: jest.fn()
      };
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(mockTx);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ gatewayTxId: 'MOCK-TX-FAIL-123' });

      expect(res.status).toBe(200);
      expect(mockTx.status).toBe('FAILED');
      expect(mockTx.save).toHaveBeenCalled();
    });

    it('should handle cancelled payment', async () => {
      const mockTx = {
        _id: 'tx123',
        amountMinor: 5000,
        status: 'PENDING',
        save: jest.fn()
      };
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(mockTx);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ gatewayTxId: 'MOCK-TX-CANCEL-123' });

      expect(res.status).toBe(200);
      expect(mockTx.status).toBe('CANCELLED');
    });

    it('should handle amount mismatch as FAILED', async () => {
      const mockTx = {
        _id: 'tx123',
        amountMinor: 5000,
        status: 'PENDING',
        save: jest.fn()
      };
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(mockTx);

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ gatewayTxId: 'MOCK-TX-MISMATCH-123' });

      expect(res.status).toBe(200);
      expect(mockTx.status).toBe('FAILED');
      expect(mockTx.save).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/payments/history', () => {
    it('should fetch user history without metadata for privacy', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ _id: 'tx123', amountMinor: 5000 }])
        })
      });
      (PaymentTransaction.find as unknown as jest.Mock) = mockFind;

      const res = await request(app)
        .get('/api/v1/payments/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(mockFind().sort().select).toHaveBeenCalledWith('-metadata');
    });
  });

  describe('GET /api/v1/payments/admin/report', () => {
    it('should fetch report for admin and populate user', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([{ _id: 'tx123', amountMinor: 5000, userId: { name: 'Test' } }])
        })
      });
      (PaymentTransaction.find as unknown as jest.Mock) = mockFind;

      const res = await request(app)
        .get('/api/v1/payments/admin/report')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(mockFind().sort().populate).toHaveBeenCalledWith('userId', 'name email phone');
    });

    it('should forbid non-admin from fetching report', async () => {
      const res = await request(app)
        .get('/api/v1/payments/admin/report')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
