import { Router } from "express";
import { requireAdminKey } from "../middlewares/admin.middleware";
import {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
} from "../controllers/admin.controller";

const router = Router();

// All admin routes require the X-Admin-Key header
router.use(requireAdminKey);

router.post("/users", createUser);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
