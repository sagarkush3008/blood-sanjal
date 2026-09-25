import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailEvent extends Document {
  to: string;
  template: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'OPT_OUT' | 'DISABLED';
  providerMessageId?: string;
  dedupeKey: string;
  error?: string;
  retryCount: number;
}

const emailEventSchema = new Schema<IEmailEvent>(
  {
    to: { type: String, required: true },
    template: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'OPT_OUT', 'DISABLED'], default: 'PENDING' },
    providerMessageId: { type: String },
    dedupeKey: { type: String, required: true, unique: true },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const EmailEvent = mongoose.model<IEmailEvent>('EmailEvent', emailEventSchema);
