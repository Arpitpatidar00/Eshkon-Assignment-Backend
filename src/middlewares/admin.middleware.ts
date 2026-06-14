import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";

/**
 * Admin-only middleware.
 * Protects routes that should ONLY be accessible via Postman or internal tools.
 * Validates the request against a secret admin key stored in environment variables.
 *
 * Usage in Postman:
 *   Header: X-Admin-Key: <your_secret_key_from_.env>
 */
export const requireAdminKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const adminKey = req.headers["x-admin-key"] as string | undefined;
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey) {
    console.error(
      "🔴 ADMIN_SECRET_KEY is not set in environment variables. Admin routes are disabled."
    );
    return next(
      new AppError("Admin routes are not configured on this server", 503)
    );
  }

  if (!adminKey) {
    return next(
      new AppError("Forbidden: Missing X-Admin-Key header", 403)
    );
  }

  // Constant-time comparison to prevent timing attacks
  if (adminKey.length !== expectedKey.length) {
    return next(new AppError("Forbidden: Invalid admin key", 403));
  }

  let mismatch = 0;
  for (let i = 0; i < adminKey.length; i++) {
    mismatch |= adminKey.charCodeAt(i) ^ expectedKey.charCodeAt(i);
  }

  if (mismatch !== 0) {
    return next(new AppError("Forbidden: Invalid admin key", 403));
  }

  next();
};
