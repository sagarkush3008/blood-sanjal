import { Request, Response, NextFunction } from 'express';
import { activeStatusService } from './activeStatus.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class ActiveStatusController {
  static async heartbeat(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      const payload = { ...req.body, userId: req.user.userId };
      const result = activeStatusService.recordHeartbeat(payload);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = activeStatusService.getSummary();
      res.status(200).json(SuccessResponse(summary, req.id));
    } catch (error) {
      next(error);
    }
  }

  static async sseStream(req: Request, res: Response, next: NextFunction) {
    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      activeStatusService.addSseClient(res);

      req.on('close', () => {
        // Handled automatically inside addSseClient when response closes
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllDonors(req: Request, res: Response, next: NextFunction) {
    try {
      const donors = activeStatusService.getAllDonors(req.query as any);
      res.status(200).json(SuccessResponse({ count: donors.length, donors }, req.id));
    } catch (error) {
      next(error);
    }
  }

  static async getDonor(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const donor = activeStatusService.getDonor(userId as string);
      if (!donor) throw new AppError(404, 'NOT_FOUND', 'Donor active status not found');
      res.status(200).json(SuccessResponse(donor, req.id));
    } catch (error) {
      next(error);
    }
  }

  static async updateDonorStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      
      const { status } = req.body;
      if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status. Must be ACTIVE or INACTIVE.');
      }

      // Check authorization (users can only update their own status unless admin)
      if (req.user.role !== 'ADMIN' && req.user.userId !== req.params.userId) {
        throw new AppError(403, 'FORBIDDEN', 'Cannot update status for another user');
      }

      const payload = {
        ...req.body,
        inactiveHours: req.body.inactiveHours ? Number(req.body.inactiveHours) : undefined,
        inactiveDays: req.body.inactiveDays ? Number(req.body.inactiveDays) : undefined,
        changedBy: req.user.userId
      };

      const donor = activeStatusService.updateDonorStatus(req.params.userId as string, payload);
      res.status(200).json(SuccessResponse(donor, req.id));
    } catch (error) {
      next(error);
    }
  }

  static async getAllRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = activeStatusService.getAllRequests(req.query as any);
      res.status(200).json(SuccessResponse({ count: requests.length, requests }, req.id));
    } catch (error) {
      next(error);
    }
  }

  static async registerNewRequest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      
      const { requesterId, bloodGroup, hospital, requiredDate } = req.body;
      if (!requesterId || !bloodGroup || !hospital || !requiredDate) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Missing required blood request fields');
      }

      const payload = {
        ...req.body,
        requesterId: req.user.userId,
        requesterName: req.body.requesterName || 'Anonymous Requester',
        unitsRequired: req.body.unitsRequired || 1,
        hospitalLocation: req.body.hospitalLocation || {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        urgency: req.body.urgency || (req.body.isEmergency ? 'EMERGENCY' : 'NORMAL'),
        isEmergency: !!req.body.isEmergency,
        requiredTime: req.body.requiredTime || 'Immediate',
        description: req.body.description || ''
      };

      const newRequest = activeStatusService.registerNewRequest(payload);
      res.status(201).json(SuccessResponse(newRequest, req.id));
    } catch (error) {
      next(error);
    }
  }

  static async updateRequestStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Missing user');
      
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Status is required');
      }

      const updated = activeStatusService.updateRequestStatus(id as string, status, req.user.userId, reason);
      if (!updated) {
        throw new AppError(404, 'NOT_FOUND', 'Blood request not found');
      }

      res.status(200).json(SuccessResponse(updated, req.id));
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = activeStatusService.getAuditLogs(limit);
      res.status(200).json(SuccessResponse({ count: logs.length, logs }, req.id));
    } catch (error) {
      next(error);
    }
  }
}
