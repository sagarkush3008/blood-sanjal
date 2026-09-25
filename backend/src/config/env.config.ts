import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/blood-sanjal-test'),
  CORS_ORIGINS: z.string().default('*'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  LOG_LEVEL: z.string().default('info'),
  JWT_ACCESS_SECRET: z.string().default('supersecret_access'),
  JWT_REFRESH_SECRET: z.string().default('supersecret_refresh'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.string().default('false').transform(v => v === 'true'),
  OTP_EXPIRY_MINUTES: z.string().default('10').transform(Number),
  PASSWORD_RESET_EXPIRY_MINUTES: z.string().default('30').transform(Number),
  CLOUDINARY_CLOUD_NAME: z.string().default('demo'),
  CLOUDINARY_API_KEY: z.string().default('demo_key'),
  CLOUDINARY_API_SECRET: z.string().default('demo_secret'),
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.string().default('2525').transform(Number),
  SMTP_USER: z.string().default('test_user'),
  SMTP_PASS: z.string().default('test_pass'),
  SMTP_SECURE: z.string().default('false').transform(v => v === 'true'),
  EMAIL_FROM: z.string().default('noreply@bloodsanjal.org'),
  FRONTEND_BASE_URL: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
