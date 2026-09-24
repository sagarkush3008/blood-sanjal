import mongoose, { Schema, Document } from 'mongoose';

export type CertificateStatus = 'ISSUED' | 'REVOKED';

export interface ICertificate extends Document {
  donorProfileId: mongoose.Types.ObjectId;
  certificateType: string;
  certificateNumber: string;
  verificationCode: string;
  issueDate: Date;
  status: CertificateStatus;
  assetUrl?: string;
  revokedAt?: Date;
  revokedReason?: string;
}

const certificateSchema = new Schema<ICertificate>(
  {
    donorProfileId: { type: Schema.Types.ObjectId, ref: 'DonorProfile', required: true },
    certificateType: { type: String, required: true },
    certificateNumber: { type: String, required: true, unique: true },
    verificationCode: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['ISSUED', 'REVOKED'], default: 'ISSUED' },
    assetUrl: { type: String },
    revokedAt: { type: Date },
    revokedReason: { type: String }
  },
  { timestamps: true }
);

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
