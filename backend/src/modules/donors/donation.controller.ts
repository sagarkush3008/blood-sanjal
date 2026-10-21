import { Request, Response, NextFunction } from 'express';
import { DonationService } from './donation.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';
import { AIService, HealthData } from '../ai/ai.service';
import { DonorProfile } from './donorProfile.model';

import { MediaService } from '../media/media.service';

export class DonationController {
  static async recordDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || req.body.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      let imageUrl: string | undefined = req.body.imageUrl || req.body.image_url;

      // Handle Multer uploaded file
      if (req.file) {
        try {
          const uploadResult: any = await MediaService.uploadFile(
            userId,
            req.file,
            'donation',
            userId
          );
          imageUrl = uploadResult?.url || uploadResult?.secureUrl;
        } catch (uploadErr) {
          console.warn('[recordDonation] Cloudinary fallback to data URI');
          const b64 = req.file.buffer.toString('base64');
          imageUrl = `data:${req.file.mimetype};base64,${b64}`;
        }
      }

      const payload = {
        hospitalName: req.body.hospitalName || req.body.hospital_name || req.body.location || 'Donation Center',
        donationDate: req.body.donationDate || req.body.donation_date || new Date().toISOString(),
        location: req.body.location || 'Birgunj, Nepal',
        campaignId: req.body.campaignId || req.body.campaign_id,
        donationType: req.body.donationType || req.body.donation_type || 'WHOLE_BLOOD',
        notes: req.body.notes,
        permissionToPostSocial: req.body.permissionToPostSocial === 'true' || req.body.permissionToPostSocial === true,
        imageUrl,
        photoProofUrl: imageUrl,
        verificationStatus: 'PENDING',
      };

      const result = await DonationService.submitDonation(userId, payload);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Donation recorded successfully. Verification is pending admin review.'
      });
    } catch (error: any) {
      console.error('[recordDonation] Error:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to record donation'
      });
    }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    return DonationController.recordDonation(req, res, next);
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
      const nextDate = aiResult.nextEligibleDate ? new Date(aiResult.nextEligibleDate) : null;

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
            inactiveStartedAt: new Date(),
            lastRecoveryTips: aiResult.aiTips
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
        recoveryTips: aiResult.aiTips
      }, req.id));

    } catch (error) { next(error); }
  }

  static async assessEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId || req.user?.userId;
      const healthData: HealthData = req.body; // Map directly

      if (!userId || !healthData) {
        return res.status(400).json({ success: false, message: 'Missing required health data or user ID' });
      }

      // Call Google Gemini AI Service in strict try/catch
      let aiResult;
      try {
        aiResult = await AIService.analyzeDonationEligibility(healthData);
      } catch (error: any) {
        console.error('[assessEligibility] Gemini AI API Error:', error?.message || error);
        return res.status(500).json({
          success: false,
          message: error?.message || 'Gemini AI assessment service failed'
        });
      }
      
      let nextDate: Date | null = null;
      if (aiResult.nextEligibleDate && aiResult.nextEligibleDate !== '9999-12-31') {
         nextDate = new Date(aiResult.nextEligibleDate);
      } else if (!aiResult.isEligible && aiResult.nextEligibleDate === '9999-12-31') {
         nextDate = new Date('2099-12-31'); // Distant future fallback
      }

      const updatePayload: any = {
        $set: {
          lastRecoveryTips: aiResult.aiTips
        }
      };

      if (!aiResult.isEligible && nextDate) {
        updatePayload.$set.inactiveUntil = nextDate;
        updatePayload.$set.reminderDate = nextDate;
        updatePayload.$set.donorStatus = 'UNAVAILABLE';
        updatePayload.$set.inactiveReason = 'Medical assessment criteria';
        updatePayload.$set.inactiveStartedAt = new Date();
      } else {
        updatePayload.$set.inactiveUntil = null;
        updatePayload.$set.reminderDate = null;
        updatePayload.$set.donorStatus = 'ACTIVE';
        updatePayload.$set.inactiveReason = null;
        updatePayload.$set.inactiveStartedAt = null;
      }
      
      // We only update lastDonationDate if it's explicitly provided and they are assessing a past donation
      if (healthData.lastDonationDate) {
        updatePayload.$set.lastDonationDate = new Date(healthData.lastDonationDate);
      }

      const updatedProfile = await DonorProfile.findOneAndUpdate(
        { userId: userId },
        updatePayload,
        { new: true, upsert: true }
      );

      if (!updatedProfile) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }

      res.status(200).json(SuccessResponse({
        isEligible: aiResult.isEligible,
        nextEligibleDate: updatedProfile.inactiveUntil,
        aiTips: aiResult.aiTips
      }, req.id));

    } catch (error: any) {
      console.error('[assessEligibility] Controller Error:', error?.message || error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Failed to complete medical assessment'
      });
    }
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
