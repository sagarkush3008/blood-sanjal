import mongoose, { Schema, Document } from 'mongoose';

export type BadgeType = 'FIRST_SAVER' | 'REGULAR_SAVER' | 'BLOOD_HERO' | 'ACTIVE_LIFE_SAVER' | 'COMMUNITY_CHAMPION';

export interface IReward extends Document {
  donorProfileId: mongoose.Types.ObjectId;
  badgeType: BadgeType;
  milestone: number;
  issuedAt: Date;
  notes: string;
}

const rewardSchema = new Schema<IReward>(
  {
    donorProfileId: { type: Schema.Types.ObjectId, ref: 'DonorProfile', required: true },
    badgeType: { type: String, enum: ['FIRST_SAVER', 'REGULAR_SAVER', 'BLOOD_HERO', 'ACTIVE_LIFE_SAVER', 'COMMUNITY_CHAMPION'], required: true },
    milestone: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now },
    notes: { type: String }
  },
  { timestamps: true }
);

rewardSchema.index({ donorProfileId: 1, badgeType: 1, milestone: 1 }, { unique: true });

export const Reward = mongoose.model<IReward>('Reward', rewardSchema);
