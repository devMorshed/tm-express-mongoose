import { NextFunction, Request, Response } from "express";

/**
 * Utility function for catching asynchronous errors and passing them to the error middleware.
 *
 * @param fn - The asynchronous route handler function.
 */

const catchAsyncError = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next); // Pass errors to the next middleware (error middleware)
  };
};

export default catchAsyncError;
