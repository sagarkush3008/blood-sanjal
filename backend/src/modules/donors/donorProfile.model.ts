import mongoose, { Schema, Document } from 'mongoose';

export interface IDonorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bloodGroup: string;
  lastDonationDate?: Date;
  reminderDate?: Date;
  totalDonations: number;
  donorStatus: 'ACTIVE' | 'UNAVAILABLE' | 'HIDDEN' | 'INACTIVE';
  inactiveUntil?: Date | null;
  inactiveReason?: string | null;
  contactPreference: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'SYSTEM_ONLY';
  notificationPreference: 'ALL' | 'EMERGENCY_ONLY' | 'NONE';
  isVerified: boolean;
  availabilityMode?: 'AVAILABLE' | 'TEMPORARY_INACTIVE' | 'INDEFINITE_INACTIVE';
  inactiveUnit?: 'HOURS' | 'DAYS' | null;
  inactiveDuration?: number | null;
  inactiveStartedAt?: Date | null;
  lastStatusChangedAt?: Date | null;
  lastStatusChangedBy?: mongoose.Types.ObjectId | null;
  nextEligibleDate?: Date | null;
  aiRecoveryTips?: string[];
}

const donorProfileSchema = new Schema<IDonorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bloodGroup: { type: String, required: true },
    lastDonationDate: { type: Date },
    reminderDate: { type: Date },
    totalDonations: { type: Number, default: 0 },
    donorStatus: { type: String, enum: ['ACTIVE', 'UNAVAILABLE', 'HIDDEN', 'INACTIVE'], default: 'UNAVAILABLE' },
    inactiveUntil: { type: Date, default: null },
    inactiveReason: { type: String, maxlength: 300, default: null },
    contactPreference: { type: String, enum: ['PHONE', 'EMAIL', 'WHATSAPP', 'SYSTEM_ONLY'], default: 'SYSTEM_ONLY' },
    notificationPreference: { type: String, enum: ['ALL', 'EMERGENCY_ONLY', 'NONE'], default: 'ALL' },
    isVerified: { type: Boolean, default: false },
    availabilityMode: { type: String, enum: ['AVAILABLE', 'TEMPORARY_INACTIVE', 'INDEFINITE_INACTIVE'], default: 'AVAILABLE' },
    inactiveUnit: { type: String, enum: ['HOURS', 'DAYS'], default: null },
    inactiveDuration: { type: Number, default: null },
    inactiveStartedAt: { type: Date, default: null },
    lastStatusChangedAt: { type: Date, default: null },
    lastStatusChangedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    nextEligibleDate: { type: Date, default: null },
    aiRecoveryTips: { type: [String], default: [] },
  },
  { timestamps: true }
);

donorProfileSchema.index({ bloodGroup: 1, donorStatus: 1 });

export const DonorProfile = mongoose.model<IDonorProfile>('DonorProfile', donorProfileSchema);

export const getActiveDonorQuery = () => ({
  donorStatus: 'ACTIVE'
});
