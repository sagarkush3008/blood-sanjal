import { Request, Response, NextFunction } from 'express';
import { DonationService } from './donation.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';
import { AIService } from '../../services/ai.service';
import { DonorProfile } from './donorProfile.model';
import { DonationRecord } from './donationRecord.model';

export class DonationController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await DonationService.submitDonation(req.user.userId, req.body);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const action = req.body.action || req.body.verificationStatus || (req.body.status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED');
      const reason = req.body.reason || req.body.rejectionReason;
      const result = await DonationService.verifyDonation(req.params.id as string, req.user.userId, action, reason);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query;
      const result = await DonationService.getHistory(filters, req.user?.userId, req.user?.role);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonationService.getDetail(req.params.id as string, req.user?.userId, req.user?.role);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async logAndAnalyzeDonation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const userId = req.user.userId;
      const { metrics } = req.body;

      // 1. Get AI Analysis
      const analysis = await AIService.analyzeEligibility(metrics);

      // Find donor profile first to get the ID
      let profile = await DonorProfile.findOne({ userId });
      if (!profile) {
        throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');
      }

      // 2. Save the Donation Record
      const newDonation = await DonationRecord.create({
        donorProfileId: profile._id,
        donationDate: metrics.lastDonationDate,
        metrics,
        aiAnalysis: analysis
      });

      // 3. Update the Donor Profile with the new state
      const updatedProfile = await DonorProfile.findByIdAndUpdate(
        profile._id,
        { 
          lastDonationDate: metrics.lastDonationDate,
          nextEligibleDate: analysis.nextEligibleDate,
          aiRecoveryTips: analysis.tips,
          donorStatus: analysis.isEligibleToday ? 'ACTIVE' : 'INACTIVE',
          inactiveUntil: analysis.isEligibleToday ? null : analysis.nextEligibleDate,
          inactiveReason: analysis.isEligibleToday ? null : 'Post-Donation Recovery Period'
        },
        { new: true }
      );

      res.status(200).json(SuccessResponse({ profile: updatedProfile, analysis }, req.id));
    } catch (error) { next(error); }
  }
}
