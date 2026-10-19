import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger.config';

/**
 * Robust HTTP Request Logger Middleware
 * Logs method, URL, remote IP, response status code, and execution time (ms).
 * Catches and logs all request life-cycle events without risk of crashing.
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = (req as any).id || (req.headers['x-request-id'] as string) || 'unknown';
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const method = req.method;
  const url = req.originalUrl || req.url;

  // Log incoming request start
  logger.info(`[${requestId}] --> ${method} ${url} | IP: ${clientIp}`);

  // Hook into response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const contentLength = res.get('content-length') || '0';
    const logMessage = `[${requestId}] <-- ${method} ${url} | Status: ${statusCode} | ${duration}ms | ${contentLength}b`;

    if (statusCode >= 500) {
      logger.error(`💥 ${logMessage}`);
      console.error(`\x1b[31m[SERVER ERROR ${statusCode}]\x1b[0m ${method} ${url} (${duration}ms) - ReqID: ${requestId}`);
    } else if (statusCode >= 400) {
      logger.warn(`⚠️ ${logMessage}`);
      console.warn(`\x1b[33m[CLIENT ERROR ${statusCode}]\x1b[0m ${method} ${url} (${duration}ms) - ReqID: ${requestId}`);
    } else {
      logger.info(`✅ ${logMessage}`);
    }
  });

  next();
};
