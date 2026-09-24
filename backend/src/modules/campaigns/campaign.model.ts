import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  title: string;
  organizer: string;
  location: string;
  date: Date;
  startTime: string;
  endTime: string;
  description: string;
  bannerAssetId?: string;
  bloodGroupsNeeded: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  createdBy: mongoose.Types.ObjectId;
}

const campaignSchema = new Schema<ICampaign>(
  {
    title: { type: String, required: true },
    organizer: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    description: { type: String, required: true },
    bannerAssetId: { type: String },
    bloodGroupsNeeded: [{ type: String }],
    status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'], default: 'DRAFT' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

campaignSchema.index({ status: 1, date: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
