import request from 'supertest';
import app from '../src/app';
import { PaymentTransaction } from '../src/modules/payments/payment.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/payments/payment.model');
jest.mock('../src/modules/audit/auditLog.model');
jest.mock('../src/modules/users/user.model');

describe('Donor Search & Fee Workflow', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateToken = (userId: string) => jwt.sign({ userId, role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('POST /api/v1/payments/search-fee/initiate', () => {
    it('should create a new pending fee if not paid', async () => {
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(null);
      (PaymentTransaction.create as jest.Mock).mockResolvedValue({ _id: 'tx1', amountMinor: 5000, currency: 'NPR', purpose: 'SEARCH_PLATFORM_FEE', save: jest.fn().mockResolvedValue(true) });

      const res = await request(app)
        .post('/api/v1/payments/search-fee/initiate')
        .set('Authorization', `Bearer ${generateToken('user1')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.transactionId).toBe('tx1');
    });

    it('should return already paid if a valid fee exists', async () => {
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue({ _id: 'tx1' });

      const res = await request(app)
        .post('/api/v1/payments/search-fee/initiate')
        .set('Authorization', `Bearer ${generateToken('user1')}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ALREADY_PAID');
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should ignore duplicate webhooks for already completed transactions', async () => {
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'tx1', 
        status: 'SUCCESS',
        userId: 'user1',
        amountMinor: 5000,
        save: jest.fn()
      });

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ gatewayTxId: 'gateway123' });

      expect(res.status).toBe(200); // Idempotent
    });

    it('should process a valid webhook to SUCCESS', async () => {
      const mockSave = jest.fn();
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'tx1', 
        status: 'PENDING',
        userId: 'user1',
        amountMinor: 5000,
        save: mockSave
      });

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ gatewayTxId: 'gateway123' }); // Not containing FAIL or CANCEL

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUCCESS');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should process a failed payment webhook to FAILED', async () => {
      const mockSave = jest.fn();
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'tx1', 
        status: 'PENDING',
        userId: 'user1',
        amountMinor: 5000,
        save: mockSave
      });

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ gatewayTxId: 'gateway-FAIL-123' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('FAILED');
    });

    it('should process a mismatched amount webhook to FAILED', async () => {
      const mockSave = jest.fn();
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'tx1', 
        status: 'PENDING',
        userId: 'user1',
        amountMinor: 5000,
        save: mockSave
      });

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ gatewayTxId: 'gateway-MISMATCH' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('FAILED');
    });
  });

  describe('GET /api/v1/donors/search (Gate)', () => {
    it('should block unpaid users', async () => {
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/donors/search')
        .set('Authorization', `Bearer ${generateToken('user1')}`);

      expect(res.status).toBe(402);
    });
  });
});
