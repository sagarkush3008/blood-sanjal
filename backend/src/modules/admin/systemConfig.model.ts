import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: any;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);
