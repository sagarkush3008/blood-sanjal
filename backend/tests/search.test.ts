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
      (PaymentTransaction.create as jest.Mock).mockResolvedValue({ _id: 'tx1', amount: 50, currency: 'NPR' });

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

  describe('POST /api/v1/payments/verify', () => {
    it('should prevent replay attacks for already completed transactions', async () => {
      (PaymentTransaction.findById as jest.Mock).mockResolvedValue({ 
        _id: 'tx1', 
        status: 'COMPLETED',
        userId: 'user1'
      });

      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ transactionId: 'tx1', gatewayTxId: 'gateway123' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/completed/i);
    });

    it('should prevent duplicate gateway transaction IDs', async () => {
      (PaymentTransaction.findById as jest.Mock).mockResolvedValue({ 
        _id: 'tx1', 
        status: 'PENDING',
        userId: 'user1'
      });
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue({ _id: 'tx2' });

      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${generateToken('user1')}`)
        .send({ transactionId: 'tx1', gatewayTxId: 'gateway123' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already used/i);
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
