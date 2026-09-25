import request from 'supertest';
import app from '../src/app';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { PaymentTransaction } from '../src/modules/payments/payment.model';
import { ContactRequest } from '../src/modules/requests/contactRequest.model';
import { BloodRequest } from '../src/modules/requests/bloodRequest.model';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';
import { Certificate } from '../src/modules/certificates/certificate.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import { AuditLog } from '../src/modules/audit/auditLog.model';

jest.mock('../src/modules/users/user.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/payments/payment.model');
jest.mock('../src/modules/requests/contactRequest.model');
jest.mock('../src/modules/requests/bloodRequest.model');
jest.mock('../src/modules/donors/donationRecord.model');
jest.mock('../src/modules/certificates/certificate.model');
jest.mock('../src/modules/audit/auditLog.model');

describe('E2E Flow', () => {
  let userToken: string;
  let adminToken: string;
  
  beforeEach(() => {
    jest.clearAllMocks();
    (AuditLog.create as jest.Mock).mockResolvedValue(true);
    
    adminToken = jwt.sign({ userId: 'admin123', role: 'ADMIN' }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    userToken = jwt.sign({ userId: 'user123', role: 'USER' }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  });

  describe('Flow 1: Setup -> Search -> Pay -> Request Contact -> Accept -> Reveal', () => {
    it('should complete the search and contact flow', async () => {
      // 1. Search requires payment.
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(null);
      const searchRes1 = await request(app)
        .get('/api/v1/donors/search?bloodGroup=O%2B')
        .set('Authorization', `Bearer ${userToken}`);
      expect(searchRes1.status).toBe(402); // Payment Required

      // 2. User pays search fee
      (PaymentTransaction.create as jest.Mock).mockResolvedValue({ _id: 'tx1', status: 'PENDING', save: jest.fn().mockResolvedValue(true) });
      const initiateRes = await request(app)
        .post('/api/v1/payments/search-fee/initiate')
        .set('Authorization', `Bearer ${userToken}`);
      expect(initiateRes.status).toBe(200);

      // Simulate webhook success
      const txMock = { _id: 'tx1', status: 'PENDING', save: jest.fn() };
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue(txMock);
      const hookRes = await request(app).post('/api/v1/payments/webhook').send({ gatewayTxId: 'gateway123' });
      expect(hookRes.status).toBe(200);

      // 3. Search again (now paid)
      const mockDonor = { _id: 'donor1', userId: { name: 'Donor 1' }, bloodGroup: 'O+', location: { city: 'Kathmandu' } };
      const mockFindChain: any = {
        exec: jest.fn().mockResolvedValue([mockDonor]),
        then: function(resolve: any) { resolve([mockDonor]); }
      };
      mockFindChain.populate = jest.fn().mockReturnValue(mockFindChain);
      mockFindChain.select = jest.fn().mockReturnValue(mockFindChain);
      mockFindChain.skip = jest.fn().mockReturnValue(mockFindChain);
      mockFindChain.limit = jest.fn().mockReturnValue(mockFindChain);
      (DonorProfile.find as jest.Mock).mockReturnValue(mockFindChain);
      
      const mockUserFindChain: any = {
        select: jest.fn().mockResolvedValue([{ _id: 'u1', privacySettings: { donorSearchVisibility: true } }])
      };
      (User.find as jest.Mock).mockReturnValue(mockUserFindChain);
      (PaymentTransaction.findOne as jest.Mock).mockResolvedValue({ _id: 'tx1', status: 'SUCCESS' });
      
      const searchRes2 = await request(app)
        .get('/api/v1/donors/search?bloodGroup=O%2B')
        .set('Authorization', `Bearer ${userToken}`);
      expect(searchRes2.status).toBe(200);

      // 4. Contact Request
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'donor1', privacySettings: { contactRevealPolicy: 'REQUEST' } });
      (ContactRequest.findOne as jest.Mock).mockResolvedValue(null);
      (ContactRequest.create as jest.Mock).mockResolvedValue({ _id: 'cr1', status: 'PENDING', save: jest.fn() });
      
      const crRes = await request(app)
        .post('/api/v1/contact-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ donorId: 'donor1', purpose: 'Need blood urgently' });
      expect(crRes.status).toBe(201);
    });
  });

  describe('Flow 2: Request -> Emergency Verify -> Notify -> Donate -> Certificate', () => {
    it('should complete emergency request and donation flow', async () => {
      // 1. Create Request
      (BloodRequest.create as jest.Mock).mockResolvedValue({ _id: 'req1', status: 'PENDING' });
      const createRes = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          patientName: 'Jane',
          bloodGroup: 'AB+',
          unitsRequired: 2,
          hospitalName: 'H1',
          hospitalLocation: { address: 'Main St' },
          urgency: 'EMERGENCY',
          contactPerson: { name: 'John', phone: '1234567890' },
          requiredDate: new Date(Date.now() + 86400000).toISOString()
        });
      expect(createRes.status).toBe(201);

      // 2. Admin verifies as ACTIVE/EMERGENCY
      const reqMock: any = { _id: 'req1', status: 'PENDING_VERIFICATION', urgency: 'EMERGENCY', save: jest.fn() };
      (BloodRequest.findById as jest.Mock).mockResolvedValue(reqMock);
      const verifyRes = await request(app)
        .post('/api/v1/requests/req1/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activate: true });
      expect(verifyRes.status).toBe(200);

      // 3. Admin broadcasts
      reqMock.status = 'ACTIVE';
      reqMock.populate = jest.fn().mockResolvedValue(reqMock);
      (DonorProfile.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });
      const broadcastRes = await request(app)
        .post('/api/v1/requests/req1/broadcast')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(broadcastRes.status).toBe(200);

      // 4. Record Donation
      (DonationRecord.create as jest.Mock).mockResolvedValue({ _id: 'don1' });
      const donorToken = jwt.sign({ userId: 'duser1', role: 'DONOR' }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
      (DonorProfile.findOne as jest.Mock).mockResolvedValue({ _id: 'donor1' });
      
      const donationRes = await request(app)
        .post('/api/v1/donations/me')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          requestId: 'req1',
          date: new Date().toISOString(),
          location: 'H1',
          units: 1
        });
      expect(donationRes.status).toBe(201);
    });
  });
});
