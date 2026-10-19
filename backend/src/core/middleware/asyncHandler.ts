import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Universal Async Handler wrapper for Express routes and middleware.
 * Ensures any rejected Promise or uncaught asynchronous error is safely forwarded
 * to Express next(error) instead of terminating the Node process with an
 * UnhandledPromiseRejection.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
