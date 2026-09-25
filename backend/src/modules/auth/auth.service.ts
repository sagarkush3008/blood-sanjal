import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../users/user.model';
import { OtpCode, IOtpCode } from './models/otpCode.model';
import { Session } from './models/session.model';
import { PasswordReset } from './models/passwordReset.model';
import { env } from '../../config/env.config';
import { AppError } from '../../core/errors/appError';
import { AuditLog } from '../audit/auditLog.model';
import { logger } from '../../config/logger.config';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  }
});

const sendOtp = async (to: string, code: string) => {
  logger.info(`[MAIL] Sending OTP ${code} to ${to}`);
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'Your Blood Sanjal Verification Code',
    text: `Your verification code is: ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong>. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>`
  }).catch(err => logger.error(`[MAIL_ERROR] ${err.message}`));
};

const sendResetLink = async (to: string, token: string) => {
  logger.info(`[MAIL] Sending Reset Token to ${to}`);
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'Blood Sanjal Password Reset',
    text: `Your password reset token is: ${token}`,
  }).catch(err => logger.error(`[MAIL_ERROR] ${err.message}`));
};

export class AuthService {
  static async register(data: any) {
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }].filter(Boolean)
    });
    if (existingUser) throw new AppError(409, 'CONFLICT', 'User with this email or phone already exists');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ ...data, passwordHash });

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(rawCode, 10);
    
    await OtpCode.create({
      userId: user._id,
      purpose: 'REGISTRATION',
      codeHash,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60000)
    });

    sendOtp(data.email || data.phone, rawCode).catch(console.error);

    return { userId: user._id.toString(), message: 'OTP sent' };
  }

  static async verifyOtp(userId: string, code: string, purpose: string) {
    const otp = await OtpCode.findOne({ userId, purpose: purpose as any, consumedAt: null, expiresAt: { $gt: new Date() } }) as IOtpCode | null;
    if (!otp) throw new AppError(400, 'INVALID_OTP', 'OTP is invalid or expired');

    if (otp.attemptCount >= 3) throw new AppError(429, 'RATE_LIMIT', 'Too many attempts');

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      otp.attemptCount += 1;
      await otp.save();
      throw new AppError(400, 'INVALID_OTP', 'Incorrect OTP');
    }

    otp.consumedAt = new Date();
    await otp.save();

    await User.findByIdAndUpdate(userId, { status: 'ACTIVE', emailVerifiedAt: new Date() });
    
    return { success: true };
  }

  static async login(data: any, ip: string, userAgent: string) {
    const user = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }].filter(Boolean)
    });
    
    if (!user || !user.passwordHash) {
      await AuditLog.create({ action: 'LOGIN_FAILURE', ipHash: ip, userAgent });
      throw new AppError(401, 'UNAUTHENTICATED', 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      await AuditLog.create({ action: 'LOGIN_FAILURE', entityId: user._id.toString(), ipHash: ip, userAgent });
      throw new AppError(401, 'UNAUTHENTICATED', 'Invalid credentials');
    }

    if (user.status === 'SUSPENDED') throw new AppError(403, 'FORBIDDEN', 'Account suspended');

    const accessToken = jwt.sign({ userId: user._id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as any });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const days = parseInt(env.REFRESH_TOKEN_TTL) || 7;
    await Session.create({
      userId: user._id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      ipHash: ip,
      userAgent
    });

    user.lastLoginAt = new Date();
    await user.save();
    
    await AuditLog.create({ actorId: user._id, action: 'LOGIN_SUCCESS', ipHash: ip, userAgent });

    return { user: { id: user._id, name: user.name, role: user.role }, accessToken, refreshToken };
  }

  static async refresh(rawRefreshToken: string, userId?: string) {
    let validSession = null;
    let targetUserId = userId;

    if (targetUserId) {
      const sessions = await Session.find({ userId: targetUserId, revokedAt: null, expiresAt: { $gt: new Date() } });
      for (const session of sessions) {
        if (await bcrypt.compare(rawRefreshToken, session.refreshTokenHash)) {
          validSession = session;
          break;
        }
      }
    }

    // If session not found by userId or userId wasn't provided, search active sessions
    if (!validSession) {
      const sessions = await Session.find({ revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ updatedAt: -1 }).limit(100);
      for (const session of sessions) {
        if (await bcrypt.compare(rawRefreshToken, session.refreshTokenHash)) {
          validSession = session;
          targetUserId = session.userId.toString();
          break;
        }
      }
    }

    if (!validSession || !targetUserId) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired refresh token');

    const user = await User.findById(targetUserId);
    if (!user || user.status === 'SUSPENDED') throw new AppError(401, 'UNAUTHENTICATED', 'User inactive');

    const accessToken = jwt.sign({ userId: user._id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as any });
    return { accessToken, refreshToken: rawRefreshToken };
  }

  static async logout(userId: string, rawRefreshToken: string) {
    const sessions = await Session.find({ userId, revokedAt: null });
    for (const session of sessions) {
      if (await bcrypt.compare(rawRefreshToken, session.refreshTokenHash)) {
        session.revokedAt = new Date();
        await session.save();
        break;
      }
    }
    return { success: true };
  }

  static async forgotPassword(data: any) {
    const user = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }].filter(Boolean)
    });
    // Always return success to prevent user enumeration
    if (!user) return { message: 'If an account exists, a reset code has been sent.' };

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(rawCode, 10);

    await OtpCode.create({
      userId: user._id,
      purpose: 'PASSWORD_RESET',
      codeHash,
      expiresAt: new Date(Date.now() + env.PASSWORD_RESET_EXPIRY_MINUTES * 60000)
    });

    sendOtp(data.email || data.phone, rawCode).catch(console.error);

    return { userId: user._id.toString(), message: 'If an account exists, a reset code has been sent.' };
  }

  static async resetPassword(userIdOrEmail: string, code: string, newPassword: string) {
    let targetUserId = userIdOrEmail;
    if (!mongoose.Types.ObjectId.isValid(userIdOrEmail)) {
      const user = await User.findOne({ email: userIdOrEmail.toLowerCase().trim() });
      if (!user) throw new AppError(400, 'INVALID_OTP', 'Reset code is invalid or expired');
      targetUserId = user._id.toString();
    }

    const otp = await OtpCode.findOne({ userId: targetUserId, purpose: 'PASSWORD_RESET' as any, consumedAt: null, expiresAt: { $gt: new Date() } }) as IOtpCode | null;
    if (!otp) throw new AppError(400, 'INVALID_OTP', 'Reset code is invalid or expired');

    if (otp.attemptCount >= 3) throw new AppError(429, 'RATE_LIMIT', 'Too many attempts');

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      otp.attemptCount += 1;
      await otp.save();
      throw new AppError(400, 'INVALID_OTP', 'Incorrect reset code');
    }

    otp.consumedAt = new Date();
    await otp.save();

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(targetUserId, { passwordHash });

    return { success: true, message: 'Password reset successfully.' };
  }
}
