import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignParticipant extends Document {
  campaignId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'REGISTERED' | 'ATTENDED' | 'CANCELLED';
}

const campaignParticipantSchema = new Schema<ICampaignParticipant>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['REGISTERED', 'ATTENDED', 'CANCELLED'], default: 'REGISTERED' }
  },
  { timestamps: true }
);

campaignParticipantSchema.index({ campaignId: 1, userId: 1 }, { unique: true });

export const CampaignParticipant = mongoose.model<ICampaignParticipant>('CampaignParticipant', campaignParticipantSchema);
