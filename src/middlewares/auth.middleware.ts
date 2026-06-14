import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware";

const JWT_SECRET =
  process.env.JWT_SECRET || "page-studio-dev-secret-change-in-production";

export interface AuthPayload {
  userId: string;
  role: string;
}

/**
 * Verify JWT token from the Authorization: Bearer <token> header.
 * On success, attaches `req.user` with { userId, role }.
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies['page-studio-token']) {
    token = req.cookies['page-studio-token'] as string;
  } else {
    return next(new AppError('Unauthorized: No token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Unauthorized: Token has expired', 401));
    }
    return next(new AppError('Unauthorized: Invalid token', 401));
  }
};

/**
 * Require a specific role. Must be used AFTER requireAuth.
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthPayload | undefined;

    if (!user) {
      return next(new AppError("Unauthorized: Not authenticated", 401));
    }

    if (!roles.includes(user.role)) {
      return next(
        new AppError(
          `Forbidden: Requires one of [${roles.join(", ")}] role`,
          403
        )
      );
    }

    next();
  };
};
