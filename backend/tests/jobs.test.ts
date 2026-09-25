import { emailProcessor } from '../src/modules/email/email.worker';
import { exportProcessor } from '../src/modules/admin/export.worker';
import { cleanupProcessor } from '../src/modules/jobs/cleanup.worker';
import { EmailService } from '../src/modules/email/email.service';
import { AdminReportsService } from '../src/modules/admin/adminReports.service';
import { FileAsset } from '../src/modules/media/fileAsset.model';
import cloudinary from 'cloudinary';

jest.mock('../src/modules/email/email.service');
jest.mock('../src/modules/admin/adminReports.service');
jest.mock('../src/modules/media/fileAsset.model');
jest.mock('cloudinary');

describe('Background Jobs', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Worker', () => {
    it('should process email job', async () => {
      const mockJob: any = {
        data: { eventId: 'event123', text: 'Hello', html: '<b>Hello</b>' }
      };

      await emailProcessor(mockJob);
      expect(EmailService.processEmail).toHaveBeenCalledWith('event123', 'Hello', '<b>Hello</b>');
    });
  });

  describe('Export Worker', () => {
    it('should process export job', async () => {
      const mockJob: any = {
        data: { jobId: 'job123' }
      };

      await exportProcessor(mockJob);
      expect(AdminReportsService.processExportJob).toHaveBeenCalledWith('job123');
    });
  });

  describe('Cleanup Worker', () => {
    it('should delete orphan cloudinary assets and file records', async () => {
      const mockJob: any = { name: 'orphanAssets' };
      
      const mockOrphan = {
        publicId: 'cloud_public_id_123',
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      (FileAsset.find as jest.Mock).mockResolvedValue([mockOrphan]);
      cloudinary.v2.uploader.destroy = jest.fn().mockResolvedValue(true);

      await cleanupProcessor(mockJob);

      expect(FileAsset.find).toHaveBeenCalled();
      expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('cloud_public_id_123');
      expect(mockOrphan.deleteOne).toHaveBeenCalled();
    });

    it('should handle cloudinary failure during cleanup safely', async () => {
      const mockJob: any = { name: 'orphanAssets' };
      
      const mockOrphan = {
        publicId: 'cloud_public_id_123',
        deleteOne: jest.fn()
      };

      (FileAsset.find as jest.Mock).mockResolvedValue([mockOrphan]);
      cloudinary.v2.uploader.destroy = jest.fn().mockRejectedValue(new Error('API Error'));

      await cleanupProcessor(mockJob);

      expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('cloud_public_id_123');
      // Should not call deleteOne if destroy failed
      expect(mockOrphan.deleteOne).not.toHaveBeenCalled();
    });
  });
});
