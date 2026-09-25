import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
  port: parseInt(env.SMTP_PORT),
  secure: env.SMTP_SECURE === 'true',
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

    await sendOtp(data.email || data.phone, rawCode);

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

  static async refresh(userId: string, rawRefreshToken: string) {
    const sessions = await Session.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } });
    let validSession = null;
    
    for (const session of sessions) {
      if (await bcrypt.compare(rawRefreshToken, session.refreshTokenHash)) {
        validSession = session;
        break;
      }
    }

    if (!validSession) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid refresh token');

    const user = await User.findById(userId);
    if (!user || user.status === 'SUSPENDED') throw new AppError(401, 'UNAUTHENTICATED', 'User inactive');

    const accessToken = jwt.sign({ userId: user._id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as any });
    return { accessToken };
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
}
