import mongoose, { Schema, Document } from 'mongoose';

export interface IDonationRecord extends Document {
  donorProfileId: mongoose.Types.ObjectId;
  donationDate: Date;
  hospitalName?: string;
  verified: boolean;
}

const donationRecordSchema = new Schema<IDonationRecord>(
  {
    donorProfileId: { type: Schema.Types.ObjectId, ref: 'DonorProfile', required: true },
    donationDate: { type: Date, required: true },
    hospitalName: { type: String },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DonationRecord = mongoose.model<IDonationRecord>('DonationRecord', donationRecordSchema);
