import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amountMinor: number; // Integer minor units (e.g., paisa)
  currency: string;
  purpose: 'SEARCH_PLATFORM_FEE';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  gatewayTransactionId?: string;
  gateway?: string;
  metadata?: Record<string, any>;
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
    purpose: { type: String, enum: ['SEARCH_PLATFORM_FEE'], required: true },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'], default: 'PENDING' },
    gatewayTransactionId: { type: String, unique: true, sparse: true },
    gateway: { type: String },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, purpose: 1, status: 1, updatedAt: -1 });

export const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', paymentSchema);
