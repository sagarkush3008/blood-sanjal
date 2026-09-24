import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  code: string;
  name: string;
  type: 'PROVINCE' | 'DISTRICT' | 'MUNICIPALITY' | 'AREA';
  parentId?: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'ARCHIVED';
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

const locationSchema = new Schema<ILocation>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['PROVINCE', 'DISTRICT', 'MUNICIPALITY', 'AREA'], required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Location' },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
  },
  { timestamps: true }
);

locationSchema.index({ parentId: 1, type: 1, status: 1 });
locationSchema.index({ coordinates: '2dsphere' });

export const Location = mongoose.model<ILocation>('Location', locationSchema);
