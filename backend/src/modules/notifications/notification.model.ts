import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'EMERGENCY' | 'BLOOD_REQUEST' | 'DONATION_REMINDER' | 'BLOOD_CAMP' | 'REWARD' | 'CERTIFICATE' | 'SYSTEM';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey: string;
  entityId?: string;
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  emailDispatched: boolean;
  emailProviderRef?: string;
  emailStatus?: 'PENDING' | 'SENT' | 'FAILED';
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['EMERGENCY', 'BLOOD_REQUEST', 'DONATION_REMINDER', 'BLOOD_CAMP', 'REWARD', 'CERTIFICATE', 'SYSTEM'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    dedupeKey: { type: String, required: true, unique: true },
    entityId: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    expiresAt: { type: Date },
    emailDispatched: { type: Boolean, default: false },
    emailProviderRef: { type: String },
    emailStatus: { type: String, enum: ['PENDING', 'SENT', 'FAILED'] }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
