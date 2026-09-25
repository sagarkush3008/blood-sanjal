import mongoose, { Schema, Document } from 'mongoose';

export interface IReportJob extends Document {
  reportType: 'USERS' | 'DONORS' | 'REQUESTS' | 'DONATIONS';
  queryFilters: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileUrl?: string;
  errorMessage?: string;
  requestedBy: mongoose.Types.ObjectId;
}

const reportJobSchema = new Schema<IReportJob>(
  {
    reportType: { type: String, enum: ['USERS', 'DONORS', 'REQUESTS', 'DONATIONS'], required: true },
    queryFilters: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    fileUrl: { type: String },
    errorMessage: { type: String },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export const ReportJob = mongoose.model<IReportJob>('ReportJob', reportJobSchema);
