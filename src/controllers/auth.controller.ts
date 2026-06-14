import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../middlewares/error.middleware";
import UserModel from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "page-studio-dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "page-studio-dev-refresh-change-in-production";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Generate a signed JWT access token for a user.
 */
function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Generate a signed JWT refresh token for a user.
 */
function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/**
 * POST /api/auth/login
 * Authenticate a user with email + password.
 * Returns a JWT token on success.
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  // Find user and explicitly include the password field
  const user = await UserModel.findOne({
    email: email.toLowerCase(),
    isActive: true,
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  // Generate tokens
  const token = signToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());

  res.json({
    status: "success",
    data: {
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

/**
 * GET /api/auth/me
 * Get the currently authenticated user's profile.
 * Requires a valid JWT in the Authorization header.
 */
export const getMe = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as any).user;

  if (!authUser) {
    throw new AppError("Not authenticated", 401);
  }

  const user = await UserModel.findById(authUser.userId)
    .select("-password")
    .lean();

  if (!user) {
    throw new AppError("User no longer exists", 404);
  }

  res.json({
    status: "success",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * POST /api/auth/register
 * Public endpoint for users to sign up. 
 * They are automatically assigned the 'viewer' role.
 */
export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  // Always enforce 'viewer' role for public signups
  const user = await UserModel.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "viewer",
  });

  const token = signToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());

  res.status(201).json({
    status: "success",
    data: {
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

/**
 * POST /api/auth/refresh
 * Takes a refresh token and returns a new access token
 */
export const refresh = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

    // Find the user to ensure they still exist and get their current role
    const user = await UserModel.findById(decoded.userId).select("role isActive");

    if (!user || !user.isActive) {
      throw new AppError("User no longer exists or is disabled", 401);
    }

    // Generate new access token
    const newAccessToken = signToken(user._id.toString(), user.role);

    // Generate a new refresh token to rotate it (Refresh Token Rotation)
    const newRefreshToken = signRefreshToken(user._id.toString());

    res.json({
      status: "success",
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
});
