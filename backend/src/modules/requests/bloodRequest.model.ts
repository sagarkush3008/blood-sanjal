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
    cityName?: string;
    coordinates?: [number, number]; // [lon, lat]
    address?: string;
    wardRoom?: string;
  };
  requiredDate?: Date;
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  urgencyWindow?: string;
  contactPerson?: {
    name?: string;
    phone?: string;
  };
  contactPhone?: string;
  reason?: string;
  additionalInfo?: string;
  evidenceAssetId?: string;
  broadcastedAt?: Date;
  paymentReference?: string;
  paymentProvider?: string;
  platformFeeNpr?: number;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'ACTIVE' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bloodRequestSchema = new Schema<IBloodRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String },
    bloodGroup: { type: String, required: true },
    unitsRequired: { type: Number, default: 1, min: 1 },
    unitsFulfilled: { type: Number, default: 0 },
    hospitalName: { type: String, required: true },
    hospitalLocation: {
      provinceId: { type: String },
      districtId: { type: String },
      cityId: { type: String },
      cityName: { type: String },
      coordinates: { type: [Number] },
      address: { type: String },
      wardRoom: { type: String },
    },
    requiredDate: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    urgency: { type: String, enum: ['NORMAL', 'URGENT', 'EMERGENCY'], default: 'NORMAL' },
    urgencyWindow: { type: String },
    contactPerson: {
      name: { type: String },
      phone: { type: String },
    },
    contactPhone: { type: String },
    reason: { type: String },
    additionalInfo: { type: String },
    evidenceAssetId: { type: String },
    broadcastedAt: { type: Date },
    paymentReference: { type: String },
    paymentProvider: { type: String },
    platformFeeNpr: { type: Number },
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
