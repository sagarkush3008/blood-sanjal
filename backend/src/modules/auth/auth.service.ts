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
  service: 'gmail',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  }
});

const sendOtp = async (to: string, code: string) => {
  logger.info(`[MAIL] Sending OTP ${code} to ${to}`);
  console.log(`[MAIL_DEBUG] Attempting to send OTP ${code} to ${to} using ${env.SMTP_USER}`);
  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: 'Your Blood Sanjal Verification Code',
      text: `Your verification code is: ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your verification code is: <strong>${code}</strong>. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>`
    });
    console.log(`[MAIL_DEBUG] Successfully sent email to ${to}: ${info.messageId}`);
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) logger.info(`[MAIL_PREVIEW] Preview URL: ${testUrl}`);
  } catch (err: any) {
    logger.error(`[MAIL_ERROR] ${err.message}`);
    console.error(`[MAIL_DEBUG_ERROR] Failed to send email to ${to}:`, err);
    // DO NOT crash the app if email fails in dev, just let the user use the logged OTP.
  }
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
      $or: [{ email: data.email }, { phone: data.phone }].filter(c => c.email || c.phone)
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

    if (env.NODE_ENV !== 'production') {
      logger.info(`[DEV_ONLY] Generated Registration OTP for ${data.email || data.phone}: ${rawCode}`);
    }

    sendOtp(data.email || data.phone, rawCode).catch(console.error);

    return { userId: user._id.toString(), message: 'OTP sent' };
  }

  static async verifyOtp(userId: string, code: string, purpose: string) {
    const cleanCode = code.replace(/\D/g, '').trim();

    const otps = await OtpCode.find({ 
      userId, 
      purpose: purpose as any, 
      consumedAt: null, 
      expiresAt: { $gt: new Date() } 
    }).sort({ createdAt: -1 });

    if (!otps || otps.length === 0) {
      throw new AppError(400, 'INVALID_OTP', 'OTP is invalid or expired');
    }

    let matchedOtp: IOtpCode | null = null;
    for (const otp of otps) {
      if (otp.attemptCount >= 5) continue;
      const isValid = await bcrypt.compare(cleanCode, otp.codeHash);
      if (isValid) {
        matchedOtp = otp;
        break;
      }
    }

    if (!matchedOtp) {
      otps[0].attemptCount += 1;
      await otps[0].save();
      throw new AppError(400, 'INVALID_OTP', 'Incorrect OTP');
    }

    await OtpCode.updateMany(
      { userId, purpose: purpose as any }, 
      { consumedAt: new Date() }
    );

    await User.findByIdAndUpdate(userId, { status: 'ACTIVE', emailVerifiedAt: new Date() });
    
    return { success: true };
  }

  static async login(data: any, ip: string, userAgent: string) {
    // 1. Email & Phone Normalization
    const normalizedEmail = data.email ? String(data.email).toLowerCase().trim() : undefined;
    const normalizedPhone = data.phone ? String(data.phone).trim() : undefined;

    console.log('🔍 [AUTH_DEBUG] 2. Querying Database for User:');
    console.log('   - Query parameters:', { email: normalizedEmail, phone: normalizedPhone });

    // 3. Database Query Validation
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }].filter(c => c.email || c.phone)
    });
    
    console.log('   - Database result:', user ? {
      _id: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      hasPasswordHash: Boolean(user.passwordHash)
    } : 'NULL (User not found!)');

    if (!user || !user.passwordHash) {
      console.warn('❌ [AUTH_DEBUG] Failed at Step 3: No user found matching credentials or password hash is empty.');
      await AuditLog.create({ action: 'LOGIN_FAILURE', ipHash: ip, userAgent });
      throw new AppError(401, 'UNAUTHENTICATED', 'Invalid credentials');
    }

    // 2. Password Comparison (Bcrypt Debugging)
    console.log('🔑 [AUTH_DEBUG] 4. Bcrypt Password Verification:');
    console.log('   - Incoming Plain-text Password:', data.password ? `"${data.password}" (length: ${data.password.length})` : 'UNDEFINED');
    console.log('   - Stored DB Bcrypt Hash:', user.passwordHash);

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    console.log('   - Bcrypt comparison outcome:', isValid ? '✅ MATCHED' : '❌ MISMATCH');

    if (!isValid) {
      console.warn('❌ [AUTH_DEBUG] Failed at Step 2: Bcrypt comparison failed (password does not match hash).');
      await AuditLog.create({ action: 'LOGIN_FAILURE', entityId: user._id.toString(), ipHash: ip, userAgent });
      throw new AppError(401, 'UNAUTHENTICATED', 'Invalid credentials');
    }

    if (user.status === 'SUSPENDED') {
      console.warn('⛔ [AUTH_DEBUG] Account is SUSPENDED for user:', user._id);
      throw new AppError(403, 'FORBIDDEN', 'Account suspended');
    }
    if (user.status === 'UNVERIFIED') {
      console.warn('⚠️ [AUTH_DEBUG] Account is UNVERIFIED for user:', user._id);
      throw new AppError(403, 'UNVERIFIED', 'Please verify your email or phone before logging in. Check your inbox for the verification code.');
    }

    // 4. JWT Token Generation
    console.log('🎟️ [AUTH_DEBUG] 5. Generating JWT & Refresh Session:');
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.ACCESS_TOKEN_TTL as any }
    );
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
    console.log('   - Access Token generated successfully (TTL:', env.ACCESS_TOKEN_TTL, ')');

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
      $or: [{ email: data.email }, { phone: data.phone }].filter(c => c.email || c.phone)
    });
    // Always return success to prevent user enumeration
    if (!user) return { message: 'If an account exists, a reset code has been sent.' };

    // Invalidate prior codes to avoid duplicate active codes
    await OtpCode.deleteMany({ userId: user._id, purpose: 'PASSWORD_RESET' });

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
      
    const codeHash = await bcrypt.hash(rawCode, 10);

    await OtpCode.create({
      userId: user._id,
      purpose: 'PASSWORD_RESET',
      codeHash,
      expiresAt: new Date(Date.now() + env.PASSWORD_RESET_EXPIRY_MINUTES * 60000)
    });

    if (env.NODE_ENV !== 'production') {
      logger.info(`[DEV_ONLY] Generated Password Reset OTP for ${data.email || data.phone}: ${rawCode}`);
    }

    sendOtp(data.email || data.phone, rawCode).catch(console.error);

    return { userId: user._id.toString(), message: 'If an account exists, a reset code has been sent.' };
  }

  static async resetPassword(userIdOrEmail: string, code: string, newPassword: string) {
    let targetUserId = userIdOrEmail;
    if (!mongoose.Types.ObjectId.isValid(userIdOrEmail)) {
      const user = await User.findOne({
        $or: [{ email: userIdOrEmail.toLowerCase().trim() }, { phone: userIdOrEmail.trim() }]
      });
      if (!user) throw new AppError(400, 'INVALID_OTP', 'Reset code is invalid or expired');
      targetUserId = user._id.toString();
    }

    const cleanCode = code.replace(/\D/g, '').trim();

    // Fetch all active unconsumed reset codes, newest first
    const otps = await OtpCode.find({ 
      userId: targetUserId, 
      purpose: 'PASSWORD_RESET' as any, 
      consumedAt: null, 
      expiresAt: { $gt: new Date() } 
    }).sort({ createdAt: -1 });

    if (!otps || otps.length === 0) {
      throw new AppError(400, 'INVALID_OTP', 'Reset code is invalid or expired. Please request a new code.');
    }

    let matchedOtp: IOtpCode | null = null;
    for (const otp of otps) {
      if (otp.attemptCount >= 5) continue;
      const isValid = await bcrypt.compare(cleanCode, otp.codeHash);
      if (isValid) {
        matchedOtp = otp;
        break;
      }
    }

    if (!matchedOtp) {
      // Increment attempt count on the most recent OTP
      otps[0].attemptCount += 1;
      await otps[0].save();
      throw new AppError(400, 'INVALID_OTP', 'Incorrect reset code. Please check your latest email.');
    }

    // Invalidate/consume all reset OTPs for this user
    await OtpCode.updateMany(
      { userId: targetUserId, purpose: 'PASSWORD_RESET' }, 
      { consumedAt: new Date() }
    );

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(targetUserId, { passwordHash });

    return { success: true, message: 'Password reset successfully.' };
  }
}
