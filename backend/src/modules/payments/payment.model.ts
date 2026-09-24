import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  purpose: 'SEARCH_FEE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  gatewayTransactionId?: string;
  gateway?: string;
}

const paymentSchema = new Schema<IPaymentTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NPR' },
    purpose: { type: String, enum: ['SEARCH_FEE'], required: true },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    gatewayTransactionId: { type: String, unique: true, sparse: true },
    gateway: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, purpose: 1, status: 1, updatedAt: -1 });

export const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', paymentSchema);
