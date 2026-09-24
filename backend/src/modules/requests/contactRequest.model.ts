import mongoose, { Schema, Document } from 'mongoose';

export interface IContactRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId; 
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'COMPLETED';
  message?: string;
  revealedContactInfo?: {
    email?: string;
    phone?: string;
  };
  expiresAt: Date;
}

const contactRequestSchema = new Schema<IContactRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'COMPLETED'], default: 'PENDING' },
    message: { type: String },
    revealedContactInfo: {
      email: { type: String },
      phone: { type: String }
    },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

contactRequestSchema.index({ requesterId: 1, donorId: 1, status: 1 });
contactRequestSchema.index({ donorId: 1, status: 1 });

export const ContactRequest = mongoose.model<IContactRequest>('ContactRequest', contactRequestSchema);
