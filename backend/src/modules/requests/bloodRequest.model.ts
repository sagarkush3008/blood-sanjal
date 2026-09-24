import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  bloodGroup: string;
  unitsRequired: number;
  unitsFulfilled: number;
  hospitalName: string;
  hospitalLocation: {
    provinceId?: string;
    districtId?: string;
    cityId?: string;
    coordinates?: [number, number]; // [lon, lat]
    address: string;
  };
  requiredDate: Date;
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  contactPerson: {
    name: string;
    phone: string;
  };
  additionalInfo?: string;
  evidenceAssetId?: string;
  broadcastedAt?: Date;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'ACTIVE' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
}

const bloodRequestSchema = new Schema<IBloodRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bloodGroup: { type: String, required: true },
    unitsRequired: { type: Number, required: true, min: 1 },
    unitsFulfilled: { type: Number, default: 0 },
    hospitalName: { type: String, required: true },
    hospitalLocation: {
      provinceId: { type: String },
      districtId: { type: String },
      cityId: { type: String },
      coordinates: { type: [Number] },
      address: { type: String, required: true },
    },
    requiredDate: { type: Date, required: true },
    urgency: { type: String, enum: ['NORMAL', 'URGENT', 'EMERGENCY'], required: true },
    contactPerson: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    additionalInfo: { type: String },
    evidenceAssetId: { type: String },
    broadcastedAt: { type: Date },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING_VERIFICATION'
    },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ status: 1, bloodGroup: 1, requiredDate: 1 });
bloodRequestSchema.index({ requesterId: 1, status: 1 });

export const BloodRequest = mongoose.model<IBloodRequest>('BloodRequest', bloodRequestSchema);
