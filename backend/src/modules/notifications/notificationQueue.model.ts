import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationJob extends Document {
  recipientId: mongoose.Types.ObjectId;
  recipientEmail: string;
  subject: string;
  content: string; 
  bloodRequestId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
  errorMessage?: string;
}

const notificationJobSchema = new Schema<INotificationJob>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientEmail: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    bloodRequestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest', required: true },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'], default: 'PENDING' },
    errorMessage: { type: String }
  },
  { timestamps: true }
);

notificationJobSchema.index({ status: 1, createdAt: 1 });
notificationJobSchema.index({ bloodRequestId: 1 });

export const NotificationJob = mongoose.model<INotificationJob>('NotificationJob', notificationJobSchema);
