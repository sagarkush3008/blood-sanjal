import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivacySettings {
  donorSearchVisibility: boolean;
  contactRevealPolicy: 'DIRECT' | 'CONSENT_REQUIRED' | 'HIDDEN';
  emergencyNotifications: boolean;
  approximateLocationSharing: boolean;
}

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: 'USER' | 'ADMIN' | 'HOSPITAL' | 'BLOOD_BANK' | 'NGO' | 'CAMPAIGN_ORGANIZER';
  status: 'ACTIVE' | 'SUSPENDED' | 'UNVERIFIED';
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  
  avatarAssetId?: string;
  bloodGroup?: string;
  provinceId?: string;
  districtId?: string;
  cityId?: string;
  areaId?: string;
  privacySettings: IPrivacySettings;
}

const privacySettingsSchema = new Schema<IPrivacySettings>({
  donorSearchVisibility: { type: Boolean, default: false },
  contactRevealPolicy: { type: String, enum: ['DIRECT', 'CONSENT_REQUIRED', 'HIDDEN'], default: 'CONSENT_REQUIRED' },
  emergencyNotifications: { type: Boolean, default: true },
  approximateLocationSharing: { type: Boolean, default: true },
}, { _id: false });

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['USER', 'ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO', 'CAMPAIGN_ORGANIZER'], default: 'USER' },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'UNVERIFIED'], default: 'UNVERIFIED' },
    emailVerifiedAt: { type: Date },
    lastLoginAt: { type: Date },

    avatarAssetId: { type: String },
    bloodGroup: { type: String },
    provinceId: { type: String },
    districtId: { type: String },
    cityId: { type: String },
    areaId: { type: String },
    privacySettings: { type: privacySettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, status: 1, createdAt: -1 });

export const User = mongoose.model<IUser>('User', userSchema);
