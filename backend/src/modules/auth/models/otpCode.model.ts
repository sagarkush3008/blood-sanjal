import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpCode extends Document {
  userId: mongoose.Types.ObjectId;
  purpose: 'REGISTRATION' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  codeHash: string;
  expiresAt: Date;
  consumedAt?: Date;
  attemptCount: number;
}

const otpCodeSchema = new Schema<IOtpCode>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    purpose: { type: String, enum: ['REGISTRATION', 'EMAIL_VERIFICATION', 'PASSWORD_RESET'], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    consumedAt: { type: Date },
    attemptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const OtpCode = mongoose.model<IOtpCode>('OtpCode', otpCodeSchema);
