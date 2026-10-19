import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appError';
import { ErrorResponse } from '../http/result';
import { logger } from '../../config/logger.config';
import { env } from '../../config/env.config';

/**
 * Extracts the exact file, line number, and function origin from an Error stack trace.
 * Filters out internal Node.js modules and node_modules to point directly to application code.
 */
export function extractOriginLocation(stack?: string): string {
  if (!stack) return 'Unknown location (no stack trace)';
  const lines = stack.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      !line.includes('node_modules') &&
      !line.includes('internal/') &&
      !line.includes('node:') &&
      (line.includes('src') || line.includes('.ts') || line.includes('.js'))
    ) {
      const match = line.match(/\((.*?)\)/) || line.match(/at (.*)/);
      return match ? match[1] : line.replace(/^at\s+/, '');
    }
  }
  return lines[1] ? lines[1].trim().replace(/^at\s+/, '') : 'Unknown origin';
}

/**
 * Bulletproof Express Global Error Handler
 * Safely intercepts all application, database, validation, and runtime exceptions.
 * Guarantees standard JSON error envelopes and prevents unhandled promise drops or server crashes.
 */
export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).id || (req.headers['x-request-id'] as string) || 'unknown';
  const method = req.method;
  const url = req.originalUrl || req.url;
  const originLocation = extractOriginLocation(err.stack);

  // 1. Custom Operational Application Errors (AppError)
  if (err instanceof AppError) {
    logger.warn(`[${requestId}] AppError (${err.statusCode}): ${err.message} [Code: ${err.code}] at ${originLocation}`);
    return res.status(err.statusCode).json(
      ErrorResponse(err.code, err.message, err.details, requestId)
    );
  }

  // 2. Request Schema Validation (Zod)
  if (err.name === 'ZodError') {
    const fieldErrors: Record<string, string> = {};
    const issues = err.issues || err.errors || [];
    issues.forEach((issue: any) => {
      const path = issue.path ? issue.path.join('.') : 'body';
      fieldErrors[path] = issue.message;
    });

    logger.warn(`[${requestId}] Zod Validation Error on ${method} ${url}: ${JSON.stringify(fieldErrors)} at ${originLocation}`);
    return res.status(400).json(
      ErrorResponse('VALIDATION_ERROR', 'Request validation failed', issues, requestId, fieldErrors)
    );
  }

  // 3. Database Schema Validation (Mongoose ValidationError)
  if (err.name === 'ValidationError') {
    const fieldErrors: Record<string, string> = {};
    if (err.errors) {
      Object.keys(err.errors).forEach((key) => {
        fieldErrors[key] = err.errors[key].message;
      });
    }

    logger.warn(`[${requestId}] Mongoose ValidationError on ${method} ${url}: ${err.message} at ${originLocation}`);
    return res.status(400).json(
      ErrorResponse('VALIDATION_ERROR', err.message, Object.values(fieldErrors), requestId, fieldErrors)
    );
  }

  // 4. Database Type Cast / Invalid ObjectId (Mongoose CastError)
  if (err.name === 'CastError') {
    const field = err.path || 'id';
    const value = err.value;
    const message = `Invalid identifier format for '${field}': received '${value}'.`;

    logger.warn(`[${requestId}] Mongoose CastError on ${method} ${url} at ${originLocation}: ${message}`);
    console.warn(`\x1b[33m[DB CAST ERROR]\x1b[0m ${method} ${url} -> ${message} [File: ${originLocation}]`);
    return res.status(400).json(
      ErrorResponse('INVALID_IDENTIFIER', message, [{ field, value }], requestId, { [field]: 'Invalid identifier format' })
    );
  }

  // 5. Database Duplicate Key / Unique Constraint Violation (MongoServerError code 11000)
  if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const duplicateField = keys.length > 0 ? keys[0] : 'field';
    const message = `Duplicate value: a record with this ${duplicateField} already exists.`;

    logger.warn(`[${requestId}] MongoServerError (11000) on ${method} ${url} at ${originLocation}: ${message}`);
    console.warn(`\x1b[33m[DB CONFLICT 11000]\x1b[0m ${method} ${url} -> ${message} [File: ${originLocation}]`);
    return res.status(409).json(
      ErrorResponse('DUPLICATE_KEY', message, [], requestId, { [duplicateField]: 'Must be unique' })
    );
  }

  // 6. Malformed JSON Body (Express SyntaxError)
  if (err instanceof SyntaxError && 'body' in err) {
    const message = 'Malformed JSON in request payload.';
    logger.warn(`[${requestId}] Bad JSON Syntax on ${method} ${url}: ${err.message}`);
    return res.status(400).json(
      ErrorResponse('MALFORMED_JSON', message, [], requestId)
    );
  }

  // 7. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const message = err.name === 'TokenExpiredError' ? 'Authentication token has expired' : 'Invalid authentication token';
    logger.warn(`[${requestId}] JWT Error: ${message} at ${originLocation}`);
    return res.status(401).json(
      ErrorResponse('UNAUTHENTICATED', message, [], requestId)
    );
  }

  // 8. Mongoose Document Not Found Error
  if (err.name === 'DocumentNotFoundError') {
    logger.warn(`[${requestId}] DocumentNotFoundError on ${method} ${url} at ${originLocation}`);
    return res.status(404).json(
      ErrorResponse('NOT_FOUND', 'Requested resource was not found.', [], requestId)
    );
  }

  // 9. BSON Serialization / Binary Data Error
  if (err.name === 'BSONError') {
    const message = 'Corrupted or invalid binary data / ObjectId received.';
    logger.warn(`[${requestId}] BSONError: ${err.message} at ${originLocation}`);
    return res.status(400).json(
      ErrorResponse('INVALID_PAYLOAD', message, [], requestId)
    );
  }

  // 10. Unhandled Runtime / System Exception (500)
  // Log exact line number and file prominently in console and Winston
  logger.error(`[${requestId}] UNHANDLED ERROR on ${method} ${url}: ${err.message}`, {
    origin: originLocation,
    stack: err.stack
  });

  console.error('\n======================================================');
  console.error(`\x1b[31m[UNHANDLED SERVER ERROR 500]\x1b[0m`);
  console.error(`📍 Origin File & Line : \x1b[36m${originLocation}\x1b[0m`);
  console.error(`🌐 Endpoint           : ${method} ${url}`);
  console.error(`🆔 Request ID         : ${requestId}`);
  console.error(`⚠️ Error Name         : ${err.name || 'Error'}`);
  console.error(`💬 Error Message      : ${err.message || err}`);
  if (err.stack) {
    console.error(`📚 Stack Trace:`);
    console.error(err.stack);
  }
  console.error('======================================================\n');

  const safeMessage =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred. Please contact support.'
      : `Internal error: ${err.message || 'Unknown error'}`;

  return res.status(500).json(
    ErrorResponse('INTERNAL_ERROR', safeMessage, [], requestId)
  );
};
