import mongoose, { Schema, Document } from 'mongoose';

export type PaymentPurpose = 'SEARCH_PLATFORM_FEE' | 'DONATION_CONTRIBUTION' | 'PLATFORM_SUPPORT' | 'EMERGENCY_SUPPORT';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface IPaymentTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amountMinor: number; // Integer minor units (e.g., paisa)
  currency: string;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gateway?: string;
  idempotencyKey?: string;
  refundReason?: string;
  refundedBy?: mongoose.Types.ObjectId;
  refundedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPaymentTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amountMinor: { 
      type: Number, 
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },
    currency: { type: String, default: 'NPR' },
    purpose: { 
      type: String, 
      enum: ['SEARCH_PLATFORM_FEE', 'DONATION_CONTRIBUTION', 'PLATFORM_SUPPORT', 'EMERGENCY_SUPPORT'], 
      default: 'SEARCH_PLATFORM_FEE',
      required: true 
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'], 
      default: 'PENDING' 
    },
    gatewayTransactionId: { type: String, unique: true, sparse: true },
    gateway: { type: String, default: 'MOCK_GATEWAY' },
    idempotencyKey: { type: String, unique: true, sparse: true },
    refundReason: { type: String },
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    refundedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, purpose: 1, status: 1, updatedAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', paymentSchema);
