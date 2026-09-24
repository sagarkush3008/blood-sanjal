import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/blood-sanjal-test'),
  CORS_ORIGINS: z.string().default('*'),
  LOG_LEVEL: z.string().default('info'),
  JWT_ACCESS_SECRET: z.string().default('supersecret_access'),
  JWT_REFRESH_SECRET: z.string().default('supersecret_refresh'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.string().transform(v => v === 'true').default('false'),
  OTP_EXPIRY_MINUTES: z.string().transform(Number).default('10'),
  PASSWORD_RESET_EXPIRY_MINUTES: z.string().transform(Number).default('30'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
