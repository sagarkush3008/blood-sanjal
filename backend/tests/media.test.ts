import request from 'supertest';
import app from '../src/app';
import { FileAsset } from '../src/modules/media/fileAsset.model';
import cloudinary from '../src/config/cloudinary.config';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/media/fileAsset.model');
jest.mock('../src/config/cloudinary.config', () => ({
  uploader: {
    upload_stream: jest.fn(),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' })
  },
  utils: {
    private_download_url: jest.fn().mockReturnValue('https://signed.url/123')
  }
}));

describe('Media API', () => {
  let userToken: string;
  let otherUserToken: string;
  let adminToken: string;

  beforeAll(() => {
    userToken = jwt.sign({ userId: '507f1f77bcf86cd799439011', role: 'USER' }, env.JWT_ACCESS_SECRET);
    otherUserToken = jwt.sign({ userId: '507f1f77bcf86cd799439022', role: 'USER' }, env.JWT_ACCESS_SECRET);
    adminToken = jwt.sign({ userId: '507f1f77bcf86cd799439033', role: 'SUPER_ADMIN' }, env.JWT_ACCESS_SECRET);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/media/upload', () => {
    it('should upload a valid file', async () => {
      // Mock Cloudinary success
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts, cb) => {
        cb(null, {
          public_id: 'test_public_id',
          secure_url: 'https://cloudinary.com/test.jpg',
          resource_type: 'image',
          format: 'jpg',
          bytes: 1024,
          width: 100,
          height: 100
        });
        const { PassThrough } = require('stream');
        return new PassThrough();
      });

      (FileAsset.findOne as jest.Mock).mockResolvedValue(null);
      (FileAsset.create as jest.Mock).mockResolvedValue({ _id: 'asset123' });

      const res = await request(app)
        .post('/api/v1/media/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('purpose', 'profile')
        .field('entityId', 'user123')
        .attach('file', Buffer.from('fake image data'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(FileAsset.create).toHaveBeenCalled();
    });

    it('should reject disallowed MIME type', async () => {
      const res = await request(app)
        .post('/api/v1/media/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('purpose', 'profile')
        .field('entityId', 'user123')
        .attach('file', Buffer.from('fake data'), { filename: 'test.txt', contentType: 'text/plain' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Disallowed MIME type/);
    });

    it('should reject mismatched extension', async () => {
      const res = await request(app)
        .post('/api/v1/media/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('purpose', 'profile')
        .field('entityId', 'user123')
        // MIME is image/jpeg but extension is pdf
        .attach('file', Buffer.from('fake image data'), { filename: 'test.pdf', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Mismatched extension/);
    });

    it('should reject oversized files', async () => {
      // 6MB > 5MB max for profile
      const buffer = Buffer.alloc(6 * 1024 * 1024);
      const res = await request(app)
        .post('/api/v1/media/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('purpose', 'profile')
        .field('entityId', 'user123')
        .attach('file', buffer, { filename: 'large.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/File too large/);
    });

    it('should reject duplicate uploads (same publicId)', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts, cb) => {
        cb(null, { public_id: 'test_public_id' });
        const { PassThrough } = require('stream');
        return new PassThrough();
      });
      (FileAsset.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      const res = await request(app)
        .post('/api/v1/media/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('purpose', 'profile')
        .field('entityId', 'user123')
        .attach('file', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/Asset already exists/);
      expect(FileAsset.create).not.toHaveBeenCalled();
    });

    it('should handle Cloudinary failures gracefully (safe error, no partial DB)', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts, cb) => {
        cb(new Error('Cloudinary down'), null);
        const { PassThrough } = require('stream');
        return new PassThrough();
      });

      const res = await request(app)
        .post('/api/v1/media/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('purpose', 'profile')
        .field('entityId', 'user123')
        .attach('file', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(500);
      expect(res.body.error.message).toBe('Cloudinary upload failed');
      expect(FileAsset.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/media/:assetId/signed-url', () => {
    it('should return signed URL for authorized owner', async () => {
      (FileAsset.findById as jest.Mock).mockResolvedValue({
        _id: 'asset123',
        userId: '507f1f77bcf86cd799439011',
        publicId: 'priv_test',
        purpose: 'certificate',
        metadata: { format: 'pdf' }
      });

      const res = await request(app)
        .get('/api/v1/media/asset123/signed-url')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBe('https://signed.url/123');
    });

    it('should reject unauthorized access for private files', async () => {
      (FileAsset.findById as jest.Mock).mockResolvedValue({
        _id: 'asset123',
        userId: '507f1f77bcf86cd799439011',
        publicId: 'priv_test',
        purpose: 'certificate'
      });

      const res = await request(app)
        .get('/api/v1/media/asset123/signed-url')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow public access to profile images regardless of owner', async () => {
      (FileAsset.findById as jest.Mock).mockResolvedValue({
        _id: 'asset123',
        userId: 'user123',
        publicId: 'pub_test',
        purpose: 'profile' // Public purpose
      });

      const res = await request(app)
        .get('/api/v1/media/asset123/signed-url')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/media/:assetId', () => {
    it('should delete asset if owner', async () => {
      (FileAsset.findById as jest.Mock).mockResolvedValue({
        _id: 'asset123',
        userId: '507f1f77bcf86cd799439011',
        publicId: 'test_pub'
      });
      (FileAsset.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .delete('/api/v1/media/asset123')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(cloudinary.uploader.destroy).toHaveBeenCalled();
      expect(FileAsset.findByIdAndDelete).toHaveBeenCalledWith('asset123');
    });

    it('should forbid deletion if not owner', async () => {
      (FileAsset.findById as jest.Mock).mockResolvedValue({
        _id: 'asset123',
        userId: '507f1f77bcf86cd799439011',
        publicId: 'test_pub'
      });

      const res = await request(app)
        .delete('/api/v1/media/asset123')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(FileAsset.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});
