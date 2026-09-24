import request from 'supertest';
import app from '../src/app';
import { Location } from '../src/modules/locations/location.model';
import { User } from '../src/modules/users/user.model';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/locations/location.model');
jest.mock('../src/modules/users/user.model');

describe('Location & Discovery Geography', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const generateAdminToken = () => jwt.sign({ userId: 'admin1', role: 'ADMIN' }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

  describe('POST /api/v1/locations (Admin)', () => {
    it('should reject invalid parent-child combinations', async () => {
      (Location.findById as jest.Mock).mockResolvedValue({ _id: 'prov1', type: 'PROVINCE' });
      
      const token = generateAdminToken();
      const res = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Area X', code: 'AREA_X', type: 'AREA', parentId: 'prov1' });
        
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_HIERARCHY');
    });

    it('should allow valid parent-child combinations', async () => {
      (Location.findById as jest.Mock).mockResolvedValue({ _id: 'dist1', type: 'DISTRICT' });
      (Location.create as jest.Mock).mockResolvedValue({ _id: 'mun1', type: 'MUNICIPALITY' });
      
      const token = generateAdminToken();
      const res = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Municipality X', code: 'MUN_X', type: 'MUNICIPALITY', parentId: 'dist1' });
        
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/locations', () => {
    it('should filter out archived locations implicitly', async () => {
      (Location.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ name: 'Active Province', status: 'ACTIVE' }])
      });

      const res = await request(app).get('/api/v1/locations');
      expect(res.status).toBe(200);
      
      // Ensure the query passed to Location.find includes status: 'ACTIVE'
      expect((Location.find as jest.Mock).mock.calls[0][0].status).toBe('ACTIVE');
    });
  });

  describe('GET /api/v1/locations/donors/search', () => {
    it('should strip exact coordinates if privacy restricts it', async () => {
      const mockUsers = [{
        name: 'Donor A',
        privacySettings: { approximateLocationSharing: false },
        locationCoordinates: { type: 'Point', coordinates: [85.3, 27.7] },
        toObject: function() { return { ...this }; }
      }];

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers)
      });

      const res = await request(app).get('/api/v1/locations/donors/search?lon=85.3&lat=27.7&distance=5000');
      
      expect(res.status).toBe(200);
      // locationCoordinates should be deleted because approximateLocationSharing is false
      expect(res.body.data[0].locationCoordinates).toBeUndefined();
    });
  });
});
