import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: err.issues.map((e: any) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Handle Operational Errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Handle Programming or Unknown Errors
  console.error("🔥 [Unhandled Error]:", err);
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
