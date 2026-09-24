import mongoose, { Schema, Document } from 'mongoose';

export interface IDonorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bloodGroup: string;
  lastDonationDate?: Date;
  reminderDate?: Date;
  totalDonations: number;
  donorStatus: 'ACTIVE' | 'UNAVAILABLE' | 'HIDDEN';
  contactPreference: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'SYSTEM_ONLY';
  notificationPreference: 'ALL' | 'EMERGENCY_ONLY' | 'NONE';
  isVerified: boolean;
}

const donorProfileSchema = new Schema<IDonorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bloodGroup: { type: String, required: true },
    lastDonationDate: { type: Date },
    reminderDate: { type: Date },
    totalDonations: { type: Number, default: 0 },
    donorStatus: { type: String, enum: ['ACTIVE', 'UNAVAILABLE', 'HIDDEN'], default: 'UNAVAILABLE' },
    contactPreference: { type: String, enum: ['PHONE', 'EMAIL', 'WHATSAPP', 'SYSTEM_ONLY'], default: 'SYSTEM_ONLY' },
    notificationPreference: { type: String, enum: ['ALL', 'EMERGENCY_ONLY', 'NONE'], default: 'ALL' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

donorProfileSchema.index({ bloodGroup: 1, donorStatus: 1 });

export const DonorProfile = mongoose.model<IDonorProfile>('DonorProfile', donorProfileSchema);
