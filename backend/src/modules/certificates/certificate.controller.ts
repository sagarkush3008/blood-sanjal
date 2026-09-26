import { Request, Response, NextFunction } from 'express';
import { CertificateService } from './certificate.service';
import { SuccessResponse } from '../../core/http/result';
import { AppError } from '../../core/errors/appError';

export class CertificateController {
  static async issue(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Missing user context');
      const cert = await CertificateService.issueCertificate(req.user.userId, req.body);
      res.status(201).json(SuccessResponse(cert, req.id));
    } catch (error) { next(error); }
  }

  static async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Missing user context');
      const cert = await CertificateService.revokeCertificate(req.user.userId, req.params.id as string, req.body.reason || 'Admin revoked');
      res.status(200).json(SuccessResponse(cert, req.id));
    } catch (error) { next(error); }
  }

  static async verifyPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const code = (req.params.code || req.query.code || req.body.code) as string;
      if (!code) throw new AppError(400, 'BAD_REQUEST', 'Verification code required');
      const data = await CertificateService.verifyPublic(code);
      res.status(200).json(SuccessResponse(data, req.id));
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Missing user context');
      const cert = await CertificateService.getCertificateById(req.params.id as string, req.user.userId, req.user.role);
      res.status(200).json(SuccessResponse(cert, req.id));
    } catch (error) { next(error); }
  }

  static async getMyCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Missing user context');
      const certs = await CertificateService.getUserCertificates(req.user.userId);
      res.status(200).json(SuccessResponse(certs, req.id));
    } catch (error) { next(error); }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const certs = await CertificateService.getAllCertificates(req.query);
      res.status(200).json(SuccessResponse(certs, req.id));
    } catch (error) { next(error); }
  }
}
