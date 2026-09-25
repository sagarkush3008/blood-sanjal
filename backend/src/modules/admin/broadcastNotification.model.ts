import mongoose, { Schema, Document } from 'mongoose';

export interface ITargetCriteria {
  type: 'ALL' | 'PROVINCE' | 'DISTRICT' | 'CITY' | 'BLOOD_GROUP' | 'DONOR_STATUS' | 'CAMPAIGN';
  value?: string;
}

export interface IBroadcastNotification extends Document {
  title: string;
  message: string;
  target: ITargetCriteria;
  scheduleAt?: Date;
  channels: ('EMAIL' | 'SMS' | 'PUSH')[];
  status: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  createdBy: mongoose.Types.ObjectId;
  executionLog?: string;
}

const targetSchema = new Schema<ITargetCriteria>({
  type: { type: String, enum: ['ALL', 'PROVINCE', 'DISTRICT', 'CITY', 'BLOOD_GROUP', 'DONOR_STATUS', 'CAMPAIGN'], required: true },
  value: { type: String }
}, { _id: false });

const broadcastNotificationSchema = new Schema<IBroadcastNotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    target: { type: targetSchema, required: true },
    scheduleAt: { type: Date },
    channels: [{ type: String, enum: ['EMAIL', 'SMS', 'PUSH'] }],
    status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'], default: 'DRAFT' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    executionLog: { type: String }
  },
  { timestamps: true }
);

broadcastNotificationSchema.index({ status: 1, scheduleAt: 1 });

export const BroadcastNotification = mongoose.model<IBroadcastNotification>('BroadcastNotification', broadcastNotificationSchema);
