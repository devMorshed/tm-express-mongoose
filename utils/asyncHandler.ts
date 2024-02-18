import { NextFunction, Request, Response } from "express";

/**
 * Utility function for catching asynchronous errors in Express route handlers
 * and passing them to the error middleware.
 *
 * @param fn - The asynchronous route handler function.
 * @returns A middleware function that catches errors and passes them to the next middleware.
 */

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error("Async error caught:", err);
      // Pass errors to the error middleware
      next(err);
    });
  };
};

export default asyncHandler;
