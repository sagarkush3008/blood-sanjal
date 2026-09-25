import { Job } from 'bullmq';
import { FileAsset } from '../media/fileAsset.model';
import cloudinary from 'cloudinary';
import { logger } from '../../config/logger.config';

export const cleanupProcessor = async (job: Job) => {
  if (job.name === 'orphanAssets') {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orphans = await FileAsset.find({ 
      $or: [
        { linkedEntityId: { $exists: false } },
        { linkedEntityId: null }
      ],
      createdAt: { $lt: yesterday }
    });

    for (const orphan of orphans) {
      try {
        await cloudinary.v2.uploader.destroy(orphan.publicId);
        await orphan.deleteOne();
        logger.info(`Cleaned up orphan asset ${orphan.publicId}`);
      } catch (err: any) {
        logger.error(`Failed to delete orphan asset ${orphan.publicId}: ${err.message}`);
      }
    }
  }
};
