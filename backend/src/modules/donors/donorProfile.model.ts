import mongoose, { Schema, Document } from 'mongoose';

export interface IDonorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bloodGroup: string;
  lastDonationDate?: Date;
  reminderDate?: Date;
  totalDonations: number;
  donorStatus: 'ACTIVE' | 'UNAVAILABLE' | 'HIDDEN' | 'INACTIVE';
  inactiveUntil?: Date;
  inactiveReason?: string;
  contactPreference: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'SYSTEM_ONLY';
  notificationPreference: 'ALL' | 'EMERGENCY_ONLY' | 'NONE';
  isVerified: boolean;
  availabilityMode?: 'AVAILABLE' | 'TEMPORARY_INACTIVE' | 'INDEFINITE_INACTIVE';
  inactiveUnit?: 'HOURS' | 'DAYS';
  inactiveDuration?: number;
  inactiveStartedAt?: Date;
  lastStatusChangedAt?: Date;
  lastStatusChangedBy?: mongoose.Types.ObjectId;
}

const donorProfileSchema = new Schema<IDonorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bloodGroup: { type: String, required: true },
    lastDonationDate: { type: Date },
    reminderDate: { type: Date },
    totalDonations: { type: Number, default: 0 },
    donorStatus: { type: String, enum: ['ACTIVE', 'UNAVAILABLE', 'HIDDEN', 'INACTIVE'], default: 'UNAVAILABLE' },
    inactiveUntil: { type: Date },
    inactiveReason: { type: String },
    contactPreference: { type: String, enum: ['PHONE', 'EMAIL', 'WHATSAPP', 'SYSTEM_ONLY'], default: 'SYSTEM_ONLY' },
    notificationPreference: { type: String, enum: ['ALL', 'EMERGENCY_ONLY', 'NONE'], default: 'ALL' },
    isVerified: { type: Boolean, default: false },
    availabilityMode: { type: String, enum: ['AVAILABLE', 'TEMPORARY_INACTIVE', 'INDEFINITE_INACTIVE'] },
    inactiveUnit: { type: String, enum: ['HOURS', 'DAYS'] },
    inactiveDuration: { type: Number },
    inactiveStartedAt: { type: Date },
    lastStatusChangedAt: { type: Date },
    lastStatusChangedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

donorProfileSchema.index({ bloodGroup: 1, donorStatus: 1 });

export const DonorProfile = mongoose.model<IDonorProfile>('DonorProfile', donorProfileSchema);

export const getActiveDonorQuery = () => ({
  $or: [
    { donorStatus: 'ACTIVE' },
    { donorStatus: 'INACTIVE', inactiveUntil: { $lt: new Date() } }
  ]
});
