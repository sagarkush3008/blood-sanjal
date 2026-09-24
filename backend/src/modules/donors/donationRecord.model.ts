import mongoose, { Schema, Document } from 'mongoose';

export interface IDonationRecord extends Document {
  donorProfileId: mongoose.Types.ObjectId;
  donationDate: Date;
  location?: string;
  hospitalName?: string;
  campaignId?: string;
  notes?: string;
  evidenceAssetId?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

const donationRecordSchema = new Schema<IDonationRecord>(
  {
    donorProfileId: { type: Schema.Types.ObjectId, ref: 'DonorProfile', required: true },
    donationDate: { type: Date, required: true },
    location: { type: String },
    hospitalName: { type: String },
    campaignId: { type: String },
    notes: { type: String },
    evidenceAssetId: { type: String },
    verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

donationRecordSchema.index({ donorProfileId: 1, donationDate: 1 }, { unique: true });
donationRecordSchema.index({ verificationStatus: 1, donationDate: -1 });

export const DonationRecord = mongoose.model<IDonationRecord>('DonationRecord', donationRecordSchema);
