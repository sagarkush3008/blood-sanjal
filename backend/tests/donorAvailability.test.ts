import request from 'supertest';
import app from '../src/app';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { AuditLog } from '../src/modules/audit/auditLog.model';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

jest.setTimeout(30000);

describe('B2 - Donor Availability tests', () => {
  let donorId: string;
  let token: string;
  
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blood-sanjal', {
        serverSelectionTimeoutMS: 5000
      });
    }
    // Clean up
    await User.deleteMany({});
    await DonorProfile.deleteMany({});
    
    // Create donor
    const user = await User.create({
      name: 'Test Donor',
      email: 'donor@test.com',
      passwordHash: 'hashed',
      phone: '9800000000',
      role: 'USER',
      status: 'ACTIVE'
    });
    donorId = user._id.toString();
    token = jwt.sign({ userId: donorId, role: 'USER' }, process.env.JWT_ACCESS_SECRET || 'supersecret_access');
    
    await DonorProfile.create({
      userId: donorId,
      bloodGroup: 'A+',
      donorStatus: 'INACTIVE'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('Test 1: Authenticated donor: INACTIVE -> ACTIVE returns success and persists ACTIVE', async () => {
    const res = await request(app)
      .patch('/api/v1/donors/me/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });
      
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACTIVE');
    
    const profile = await DonorProfile.findOne({ userId: donorId });
    expect(profile?.donorStatus).toBe('ACTIVE');
  });

  it('Test 2: Authenticated donor: ACTIVE -> INACTIVE returns success and persists INACTIVE', async () => {
    const res = await request(app)
      .patch('/api/v1/donors/me/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INACTIVE' });
      
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('INACTIVE');
    
    const profile = await DonorProfile.findOne({ userId: donorId });
    expect(profile?.donorStatus).toBe('INACTIVE');
  });

  it('Test 3: Invalid values ONLINE, AVAILABLE, true, null and empty string are rejected', async () => {
    const invalidStatuses = ['ONLINE', 'AVAILABLE', true, null, ''];
    for (const status of invalidStatuses) {
      const res = await request(app)
        .patch('/api/v1/donors/me/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status });
      expect(res.status).toBe(400);
    }
  });

  it('Test 4: Unauthenticated status change returns 401', async () => {
    const res = await request(app)
      .patch('/api/v1/donors/me/status')
      .send({ status: 'ACTIVE' });
    expect(res.status).toBe(401);
  });
  
  it('Test 16: Every status transition creates the expected audit event', async () => {
    await request(app)
      .patch('/api/v1/donors/me/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });
      
    const audit = await AuditLog.findOne({
      actorId: donorId,
      action: 'DONOR_STATUS_CHANGED'
    }).sort({ createdAt: -1 });
    
    expect(audit).toBeTruthy();
    expect(audit?.metadata?.newStatus).toBe('ACTIVE');
  });
});
