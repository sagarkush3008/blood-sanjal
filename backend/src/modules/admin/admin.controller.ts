import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class AdminController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listUsers(req.query);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getUserDetails(req.params.id as string);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const result = await AdminService.updateUserStatus(req.params.id as string, status, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async softDeleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.softDeleteUser(req.params.id as string, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async listDonors(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getDonors(req.query);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getDonorDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getDonorDetails(req.params.id as string);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async verifyDonor(req: Request, res: Response, next: NextFunction) {
    try {
      const { isVerified = true } = req.body;
      const result = await AdminService.verifyDonor(req.params.id as string, isVerified, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateDonorStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { donorStatus, isVerified } = req.body;
      const result = await AdminService.updateDonorStatus(req.params.id as string, donorStatus, isVerified, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listRequests(req.query);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getRequestDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getRequestDetails(req.params.id as string);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getMatchingDonors(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getMatchingDonorsForRequest(req.params.id as string);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async fulfillRequestUnits(req: Request, res: Response, next: NextFunction) {
    try {
      const { units = 1 } = req.body;
      const result = await AdminService.fulfillRequestUnits(req.params.id as string, Number(units), req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async updateRequestStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, urgency } = req.body;
      const result = await AdminService.updateRequestStatus(req.params.id as string, status, urgency, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async softDeleteRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.softDeleteRequest(req.params.id as string, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async listDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listDonations(req.query);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getDashboardSummary();
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async listEmergencyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listEmergencyRequests(req.query);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async approveEmergencyRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.approveEmergencyRequest(req.params.id as string, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getEmergencyRequestDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getEmergencyRequestDetails(req.params.id as string);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async getEmergencyResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getEmergencyResponses(req.params.id as string);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async triggerBroadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.triggerBroadcast(req.params.id as string, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async closeEmergencyRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const result = await AdminService.closeEmergencyRequest(req.params.id as string, reason, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async rejectEmergencyRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const result = await AdminService.rejectEmergencyRequest(req.params.id as string, reason, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async reviewEmergencyRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, status, reason } = req.body;
      const isApproved = action === 'APPROVE' || status === 'APPROVED' || status === 'ACTIVE';
      if (isApproved) {
        const result = await AdminService.approveEmergencyRequest(req.params.id as string, req.user!.userId);
        res.json(SuccessResponse(result, req.id));
      } else {
        const result = await AdminService.rejectEmergencyRequest(req.params.id as string, reason, req.user!.userId);
        res.json(SuccessResponse(result, req.id));
      }
    } catch (error) { next(error); }
  }

  static async verifyBloodRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { activate = true } = req.body;
      const result = await AdminService.verifyBloodRequest(req.params.id as string, activate, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async verifyDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const { verificationStatus, rejectionReason } = req.body;
      const result = await AdminService.verifyDonation(req.params.id as string, verificationStatus, rejectionReason, req.user!.userId);
      res.json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }
}
