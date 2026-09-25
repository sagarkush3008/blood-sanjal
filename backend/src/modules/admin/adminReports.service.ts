import { User } from '../users/user.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { BloodRequest } from '../requests/bloodRequest.model';
import { DonationRecord } from '../donors/donationRecord.model';
import { PaymentTransaction } from '../payments/payment.model';
import { ReportJob } from './reportJob.model';
import { AppError } from '../../core/errors/appError';
import { AdminService } from './admin.service';
import mongoose from 'mongoose';
import { Buffer } from 'buffer';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';

export class AdminReportsService {
  static async getDashboardKPIs() {
    const [
      totalUsers,
      totalDonors,
      activeDonors,
      totalRequests,
      emergencyRequests,
      successfulConnections,
      totalDonations,
      searchFees
    ] = await Promise.all([
      User.countDocuments({ deletedAt: { $exists: false } }),
      DonorProfile.countDocuments({ deletedAt: { $exists: false } }),
      DonorProfile.countDocuments({ donorStatus: 'ACTIVE', deletedAt: { $exists: false } }),
      BloodRequest.countDocuments({ deletedAt: { $exists: false } }),
      BloodRequest.countDocuments({ urgency: 'EMERGENCY', deletedAt: { $exists: false } }),
      BloodRequest.countDocuments({ status: { $in: ['PARTIALLY_FULFILLED', 'FULFILLED'] }, deletedAt: { $exists: false } }),
      DonationRecord.countDocuments({ verificationStatus: 'VERIFIED', deletedAt: { $exists: false } }),
      PaymentTransaction.aggregate([
        { $match: { purpose: 'SEARCH_PLATFORM_FEE', status: 'SUCCESS' } },
        { $group: { _id: null, totalRevenueMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalUsers,
      totalDonors,
      activeDonors,
      totalRequests,
      emergencyRequests,
      successfulConnections,
      totalDonations,
      searchRevenueMinor: searchFees[0]?.totalRevenueMinor || 0,
      totalSearches: searchFees[0]?.count || 0
    };
  }

  static async getAggregations(type: string, query: any) {
    if (type === 'bloodGroupDemand') {
      return await BloodRequest.aggregate([
        { $match: { deletedAt: { $exists: false } } },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 }, unitsRequired: { $sum: '$unitsRequired' } } },
        { $sort: { count: -1 } }
      ]);
    }
    if (type === 'donorGrowth') {
      return await DonorProfile.aggregate([
        { $match: { deletedAt: { $exists: false } } },
        { $group: { 
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
    }
    if (type === 'locationDistribution') {
      return await BloodRequest.aggregate([
        { $match: { deletedAt: { $exists: false } } },
        { $group: { _id: '$hospitalLocation.cityId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    }
    throw new AppError(400, 'BAD_REQUEST', 'Unknown aggregation type');
  }

  static async requestExport(reportType: 'USERS' | 'DONORS' | 'REQUESTS' | 'DONATIONS', query: any, adminId: string) {
    const job = await ReportJob.create({
      reportType,
      queryFilters: query,
      requestedBy: new mongoose.Types.ObjectId(adminId)
    });
    await AdminService.logAudit(adminId, `REQUEST_EXPORT_${reportType}`, 'REPORT_JOB', job._id.toString());
    return job;
  }

  static async processExportJob(jobId: string) {
    const job = await ReportJob.findById(jobId);
    if (!job || job.status !== 'PENDING') return;

    job.status = 'PROCESSING';
    await job.save();

    try {
      let data: any[] = [];
      const filters = job.queryFilters || {};
      const mongoFilter: any = { deletedAt: { $exists: false } };

      if (filters.status) mongoFilter.status = filters.status;

      if (job.reportType === 'USERS') {
        data = await User.find(mongoFilter).select('name email phone role status createdAt').lean();
      } else if (job.reportType === 'DONORS') {
        if (filters.bloodGroup) mongoFilter.bloodGroup = filters.bloodGroup;
        data = await DonorProfile.find(mongoFilter).populate('userId', 'name email').lean();
        data = data.map((d: any) => ({
          donorId: d._id,
          name: d.userId?.name,
          email: d.userId?.email,
          bloodGroup: d.bloodGroup,
          status: d.donorStatus,
          totalDonations: d.totalDonations
        }));
      } else if (job.reportType === 'REQUESTS') {
        if (filters.urgency) mongoFilter.urgency = filters.urgency;
        data = await BloodRequest.find(mongoFilter).select('bloodGroup unitsRequired unitsFulfilled urgency status hospitalName createdAt').lean();
      } else if (job.reportType === 'DONATIONS') {
        data = await DonationRecord.find(mongoFilter).select('donationDate location verificationStatus createdAt').lean();
      }

      if (data.length === 0) {
        job.status = 'COMPLETED';
        job.fileUrl = 'empty';
        await job.save();
        return;
      }

      // Generate CSV
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      for (const row of data) {
        const values = headers.map(h => {
          const val = row[h];
          const escaped = (val === null || val === undefined) ? '' : String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      const csvString = csvRows.join('\n');
      const buffer = Buffer.from(csvString, 'utf-8');

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { resource_type: 'raw', folder: 'blood-sanjal/reports', format: 'csv' },
          (error: any, result: any) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });

      job.status = 'COMPLETED';
      job.fileUrl = uploadResult.secure_url;
      await job.save();

    } catch (error: any) {
      job.status = 'FAILED';
      job.errorMessage = error.message;
      await job.save();
    }
  }
}
