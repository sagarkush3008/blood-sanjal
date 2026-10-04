import { Request, Response, NextFunction } from 'express';
import { DonationService } from './donation.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';
import { AIService, HealthData } from '../ai/ai.service';
import { DonorProfile } from './donorProfile.model';

export class DonationController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const result = await DonationService.submitDonation(req.user.userId, req.body);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async logDonationWithAI(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId || req.user?.userId;
      const healthData: HealthData = req.body.healthData;

      if (!userId || !healthData) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Missing required health data or user ID');
      }

      // Call Google Gemini AI Service
      const aiResult = await AIService.analyzeDonationEligibility(healthData);
      const nextDate = new Date(aiResult.nextEligibleDate);

      // Database Transaction (MongoDB)
      const updatedProfile = await DonorProfile.findOneAndUpdate(
        { userId: userId },
        {
          $inc: { totalDonations: 1 },
          $set: {
            lastDonationDate: new Date(healthData.lastDonationDate),
            inactiveUntil: nextDate, // Marks them as temporarily inactive
            reminderDate: nextDate, // Used by cron job to send push notification
            donorStatus: 'UNAVAILABLE',
            inactiveReason: 'Recent donation recovery period',
            inactiveStartedAt: new Date()
          }
        },
        { new: true }
      );

      if (!updatedProfile) {
        throw new AppError(404, 'NOT_FOUND', 'Donor profile not found');
      }

      res.status(200).json(SuccessResponse({
        totalDonations: updatedProfile.totalDonations,
        nextEligibleDate: updatedProfile.inactiveUntil,
        recoveryTips: aiResult.recoveryTips
      }, req.id));

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
}
