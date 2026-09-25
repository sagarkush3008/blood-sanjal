import request from 'supertest';
import app from '../src/app';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { BloodRequest } from '../src/modules/requests/bloodRequest.model';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';
import { PaymentTransaction } from '../src/modules/payments/payment.model';
import { ReportJob } from '../src/modules/admin/reportJob.model';
import { AuditLog } from '../src/modules/audit/auditLog.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';

jest.mock('../src/modules/users/user.model');
jest.mock('../src/modules/donors/donorProfile.model');
jest.mock('../src/modules/requests/bloodRequest.model');
jest.mock('../src/modules/donors/donationRecord.model');
jest.mock('../src/modules/payments/payment.model');
jest.mock('../src/modules/admin/reportJob.model');
jest.mock('../src/modules/audit/auditLog.model');
jest.mock('cloudinary');

describe('Admin Reports API', () => {
  let adminToken: string;

  beforeAll(() => {
    adminToken = jwt.sign({ userId: new mongoose.Types.ObjectId().toString(), role: 'ADMIN' }, env.JWT_ACCESS_SECRET);
    cloudinary.v2.uploader.upload_stream = jest.fn().mockImplementation((opts, cb) => {
      // Mock stream behavior
      const stream = require('stream');
      const ws = new stream.Writable({
        write(chunk: any, encoding: any, callback: any) {
          callback();
        }
      });
      ws.on('finish', () => cb(null, { secure_url: 'https://cloudinary.com/test.csv' }));
      return ws;
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard KPIs', () => {
    it('should return combined KPIs', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(100);
      (DonorProfile.countDocuments as jest.Mock).mockResolvedValue(50);
      (BloodRequest.countDocuments as jest.Mock).mockResolvedValue(20);
      (DonationRecord.countDocuments as jest.Mock).mockResolvedValue(10);
      (PaymentTransaction.aggregate as jest.Mock).mockResolvedValue([{ totalRevenueMinor: 500000, count: 50 }]);

      const res = await request(app).get('/api/v1/admin/reports/kpis')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBe(100);
      expect(res.body.data.searchRevenueMinor).toBe(500000);
    });
  });

  describe('Aggregations', () => {
    it('should return aggregation results for bloodGroupDemand', async () => {
      (BloodRequest.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'O+', count: 10, unitsRequired: 20 },
        { _id: 'A+', count: 5, unitsRequired: 10 }
      ]);

      const res = await request(app).get('/api/v1/admin/reports/aggregations/bloodGroupDemand')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]._id).toBe('O+');
    });

    it('should return 400 for unknown aggregation type', async () => {
      const res = await request(app).get('/api/v1/admin/reports/aggregations/unknownType')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Exports', () => {
    it('should request an export job', async () => {
      const mockJob = { _id: 'job123', reportType: 'DONORS', status: 'PENDING' };
      (ReportJob.create as jest.Mock).mockResolvedValue(mockJob);

      const res = await request(app).post('/api/v1/admin/reports/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reportType: 'DONORS', query: { bloodGroup: 'O+' } });

      expect(res.status).toBe(202);
      expect(ReportJob.create).toHaveBeenCalled();
      expect(AuditLog.create).toHaveBeenCalled();
    });

    it('should process export job and generate CSV', async () => {
      const mockJob: any = { _id: 'job123', reportType: 'DONORS', status: 'PENDING', queryFilters: {}, save: jest.fn() };
      (ReportJob.findById as jest.Mock).mockResolvedValue(mockJob);

      const mockDonors = [
        { _id: 'd1', bloodGroup: 'O+', donorStatus: 'ACTIVE', totalDonations: 2, userId: { name: 'John', email: 'john@test.com' } }
      ];
      (DonorProfile.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockDonors)
        })
      });

      const res = await request(app).post('/api/v1/admin/reports/export/job123/process')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockJob.status).toBe('COMPLETED');
      expect(mockJob.fileUrl).toBe('https://cloudinary.com/test.csv');
      expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should set job to COMPLETED with empty fileUrl if no data', async () => {
      const mockJob: any = { _id: 'job123', reportType: 'USERS', status: 'PENDING', queryFilters: {}, save: jest.fn() };
      (ReportJob.findById as jest.Mock).mockResolvedValue(mockJob);

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      const res = await request(app).post('/api/v1/admin/reports/export/job123/process')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockJob.status).toBe('COMPLETED');
      expect(mockJob.fileUrl).toBe('empty');
    });
  });
});
