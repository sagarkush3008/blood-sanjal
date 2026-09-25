import mongoose, { Schema, Document } from 'mongoose';

export type FilePurpose = 'profile' | 'campaign' | 'donation' | 'certificate' | 'request';

export interface IFileAsset extends Document {
  userId: mongoose.Types.ObjectId;
  publicId: string;
  url?: string;
  resourceType: 'image' | 'video' | 'raw';
  purpose: FilePurpose;
  entityId?: string;
  metadata?: {
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
    originalName?: string;
  };
}

const fileAssetSchema = new Schema<IFileAsset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publicId: { type: String, required: true, unique: true },
    url: { type: String },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], required: true },
    purpose: { type: String, enum: ['profile', 'campaign', 'donation', 'certificate', 'request'], required: true },
    entityId: { type: String }, // Optional reference to the specific entity
    metadata: {
      format: String,
      bytes: Number,
      width: Number,
      height: Number,
      originalName: String
    }
  },
  { timestamps: true }
);

export const FileAsset = mongoose.model<IFileAsset>('FileAsset', fileAssetSchema);
