import winston from 'winston';
import { env } from './env.config';

const redactFormats = winston.format((info) => {
  if (info.password) info.password = '[REDACTED]';
  if (info.token) info.token = '[REDACTED]';
  if (info.otp) info.otp = '[REDACTED]';
  return info;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    redactFormats(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
