import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { SuccessResponse } from '../../core/http/result';
import { env } from '../../config/env.config';
import { AppError } from '../../core/errors/appError';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, code } = req.body;
      const result = await AuthService.verifyOtp(userId, code, 'REGISTRATION');
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body, req.ip || '', req.headers['user-agent'] || '');
      
      const maxAgeStr = env.REFRESH_TOKEN_TTL.replace(/\D/g, '');
      const days = parseInt(maxAgeStr) || 7;

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        domain: env.COOKIE_DOMAIN,
        path: '/api/v1/auth',
        sameSite: 'strict',
        maxAge: days * 24 * 60 * 60 * 1000
      });

      res.status(200).json(SuccessResponse({ user: result.user, accessToken: result.accessToken }, req.id));
    } catch (error) { next(error); }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!req.user || !refreshToken) throw new AppError(401, 'UNAUTHENTICATED', 'Missing refresh token');

      const result = await AuthService.refresh(req.user.userId, refreshToken);
      res.status(200).json(SuccessResponse(result, req.id));
    } catch (error) { next(error); }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (req.user && refreshToken) {
        await AuthService.logout(req.user.userId, refreshToken);
      }
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      res.status(200).json(SuccessResponse({ success: true }, req.id));
    } catch (error) { next(error); }
  }
}
