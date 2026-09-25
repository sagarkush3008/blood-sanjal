import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  patientName?: string;
  bloodGroup: string;
  unitsRequired: number;
  unitsFulfilled: number;
  hospitalName: string;
  hospitalLocation?: {
    provinceId?: string;
    districtId?: string;
    cityId?: string;
    coordinates?: [number, number]; // [lon, lat]
    address?: string;
  };
  requiredDate?: Date;
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  contactPerson?: {
    name?: string;
    phone?: string;
  };
  contactPhone?: string;
  additionalInfo?: string;
  evidenceAssetId?: string;
  broadcastedAt?: Date;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'ACTIVE' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  deletedAt?: Date;
}

const bloodRequestSchema = new Schema<IBloodRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String },
    bloodGroup: { type: String, required: true },
    unitsRequired: { type: Number, required: true, min: 1 },
    unitsFulfilled: { type: Number, default: 0 },
    hospitalName: { type: String, required: true },
    hospitalLocation: {
      provinceId: { type: String },
      districtId: { type: String },
      cityId: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
    },
    requiredDate: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    urgency: { type: String, enum: ['NORMAL', 'URGENT', 'EMERGENCY'], default: 'NORMAL' },
    contactPerson: {
      name: { type: String },
      phone: { type: String },
    },
    contactPhone: { type: String },
    additionalInfo: { type: String },
    evidenceAssetId: { type: String },
    broadcastedAt: { type: Date },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING_VERIFICATION'
    },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ status: 1, bloodGroup: 1, requiredDate: 1 });
bloodRequestSchema.index({ requesterId: 1, status: 1 });

export const BloodRequest = mongoose.model<IBloodRequest>('BloodRequest', bloodRequestSchema);
