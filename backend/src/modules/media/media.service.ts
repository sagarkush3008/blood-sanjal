import cloudinary from '../../config/cloudinary.config';
import { FileAsset, FilePurpose } from './fileAsset.model';
import { AppError } from '../../core/errors/appError';
import streamifier from 'streamifier';
import mongoose from 'mongoose';

const ALLOWED_MIME_TYPES: Record<FilePurpose, string[]> = {
  profile: ['image/jpeg', 'image/png', 'image/webp'],
  campaign: ['image/jpeg', 'image/png', 'image/webp'],
  donation: ['image/jpeg', 'image/png', 'application/pdf'],
  certificate: ['image/jpeg', 'image/png', 'application/pdf'],
  request: ['image/jpeg', 'image/png', 'application/pdf']
};

const MAX_FILE_SIZES: Record<FilePurpose, number> = {
  profile: 5 * 1024 * 1024, // 5MB
  campaign: 10 * 1024 * 1024, // 10MB
  donation: 5 * 1024 * 1024,
  certificate: 5 * 1024 * 1024,
  request: 5 * 1024 * 1024
};

export class MediaService {
  static async uploadFile(
    userId: string,
    file: Express.Multer.File,
    purpose: FilePurpose,
    entityId: string
  ) {
    if (!file) throw new AppError(400, 'BAD_REQUEST', 'No file provided');

    // Validation
    const allowedMimes = ALLOWED_MIME_TYPES[purpose];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new AppError(400, 'BAD_REQUEST', `Disallowed MIME type. Allowed: ${allowedMimes.join(', ')}`);
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = allowedMimes.map(mime => mime.split('/')[1]);
    // simple check: if it's jpeg, allow jpg or jpeg. webp allow webp. pdf allow pdf.
    const isJpegOrJpg = (allowedExtensions.includes('jpeg') && (extension === 'jpg' || extension === 'jpeg'));
    if (!allowedExtensions.includes(extension) && !isJpegOrJpg) {
      throw new AppError(400, 'BAD_REQUEST', `Mismatched extension. Allowed: ${allowedExtensions.join(', ')}`);
    }

    const maxSize = MAX_FILE_SIZES[purpose];
    if (file.size > maxSize) {
      throw new AppError(400, 'BAD_REQUEST', `File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
    }

    // Determine folder
    const folder = `blood-sanjal/${purpose}s/${entityId}`;
    const isPublic = purpose === 'profile' || purpose === 'campaign';

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          access_mode: isPublic ? 'public' : 'authenticated',
          type: isPublic ? 'upload' : 'authenticated' // Use authenticated delivery for private files
        },
        async (error, result) => {
          if (error) {
            return reject(new AppError(500, 'INTERNAL_SERVER_ERROR', 'Cloudinary upload failed'));
          }
          if (!result) {
            return reject(new AppError(500, 'INTERNAL_SERVER_ERROR', 'No result from Cloudinary'));
          }

          try {
            // Check for duplicate publicId
            const existing = await FileAsset.findOne({ publicId: result.public_id });
            if (existing) {
              return reject(new AppError(409, 'CONFLICT', 'Asset already exists'));
            }

            const asset = await FileAsset.create({
              userId: new mongoose.Types.ObjectId(userId),
              publicId: result.public_id,
              url: result.secure_url, // For authenticated files, this URL requires signature or cookies
              resourceType: result.resource_type as 'image' | 'video' | 'raw',
              purpose,
              entityId,
              metadata: {
                format: result.format,
                bytes: result.bytes,
                width: result.width,
                height: result.height,
                originalName: file.originalname
              }
            });

            resolve(asset);
          } catch (dbError) {
            // Cloudinary failure shouldn't leave partial DB records, and DB failure shouldn't leave orphaned Cloudinary files if possible, but cleanup is best effort.
            // But if DB fails, we should delete from Cloudinary to maintain consistency.
            await cloudinary.uploader.destroy(result.public_id, { type: isPublic ? 'upload' : 'authenticated' }).catch(() => {});
            reject(new AppError(500, 'INTERNAL_SERVER_ERROR', 'Database error after upload'));
          }
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  static async getSignedUrl(userId: string, assetId: string) {
    const asset = await FileAsset.findById(assetId);
    if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

    if (asset.purpose !== 'profile' && asset.purpose !== 'campaign' && asset.userId.toString() !== userId) {
      // Basic ownership check. A real system might allow admins or doctors.
      throw new AppError(403, 'FORBIDDEN', 'Unauthorized to access this asset');
    }

    // Generate signed URL valid for 1 hour
    const url = cloudinary.utils.private_download_url(asset.publicId, asset.metadata?.format || '', {
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    });

    return url;
  }

  static async deleteAsset(userId: string, assetId: string) {
    const asset = await FileAsset.findById(assetId);
    if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

    if (asset.userId.toString() !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Unauthorized to delete this asset');
    }

    // Delete from Cloudinary
    const isPublic = asset.purpose === 'profile' || asset.purpose === 'campaign';
    try {
      await cloudinary.uploader.destroy(asset.publicId, { type: isPublic ? 'upload' : 'authenticated' });
    } catch (error) {
      // Even if Cloudinary fails (e.g. already deleted), we should remove it from our DB
      console.warn(`Failed to delete Cloudinary asset ${asset.publicId}`);
    }

    await FileAsset.findByIdAndDelete(assetId);
    return { success: true };
  }
}
