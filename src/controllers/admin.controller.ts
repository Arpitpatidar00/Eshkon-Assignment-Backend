import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../middlewares/error.middleware";
import UserModel from "../models/User";

/**
 * POST /api/admin/users
 * Create a new user. Admin-only (protected by X-Admin-Key).
 *
 * Body:
 *   { name: string, email: string, password: string, role: "viewer" | "editor" | "publisher" }
 */
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    throw new AppError("name, email, and password are required", 400);
  }

  // Validate role
  const validRoles = ["viewer", "editor", "publisher"];
  if (role && !validRoles.includes(role)) {
    throw new AppError(
      `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      400
    );
  }

  // Check if user already exists
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  // Create user (password is hashed automatically via pre-save hook)
  const user = await UserModel.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || "viewer",
  });

  res.status(201).json({
    status: "success",
    message: `User "${user.name}" created with role "${user.role}"`,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

/**
 * GET /api/admin/users
 * List all users. Admin-only.
 */
export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await UserModel.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    status: "success",
    count: users.length,
    data: users,
  });
});

/**
 * PATCH /api/admin/users/:id
 * Update a user's role or active status. Admin-only.
 */
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, isActive, name } = req.body;

  const updateFields: Record<string, unknown> = {};

  if (role) {
    const validRoles = ["viewer", "editor", "publisher"];
    if (!validRoles.includes(role)) {
      throw new AppError(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        400
      );
    }
    updateFields.role = role;
  }

  if (typeof isActive === "boolean") {
    updateFields.isActive = isActive;
  }

  if (name) {
    updateFields.name = name;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new AppError("No valid fields to update", 400);
  }

  const user = await UserModel.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    status: "success",
    message: `User "${user.name}" updated successfully`,
    data: user,
  });
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user. Admin-only.
 */
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await UserModel.findByIdAndDelete(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    status: "success",
    message: `User "${user.name}" deleted successfully`,
  });
});
