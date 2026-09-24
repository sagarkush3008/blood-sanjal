import mongoose, { Schema, Document } from 'mongoose';

export interface IReminderJob extends Document {
  donorProfileId: mongoose.Types.ObjectId;
  reminderType: 'ELIGIBILITY' | 'ROUTINE';
  scheduledDate: Date;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
}

const reminderJobSchema = new Schema<IReminderJob>(
  {
    donorProfileId: { type: Schema.Types.ObjectId, ref: 'DonorProfile', required: true },
    reminderType: { type: String, enum: ['ELIGIBILITY', 'ROUTINE'], required: true },
    scheduledDate: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
    sentAt: { type: Date }
  },
  { timestamps: true }
);

reminderJobSchema.index({ donorProfileId: 1, reminderType: 1, scheduledDate: 1 }, { unique: true });

export const ReminderJob = mongoose.model<IReminderJob>('ReminderJob', reminderJobSchema);
