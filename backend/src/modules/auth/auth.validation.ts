import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  password: z.string().min(8),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"]
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"]
});

export const verifyOtpSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
  purpose: z.enum(['REGISTRATION', 'EMAIL_VERIFICATION', 'PASSWORD_RESET']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"]
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});
