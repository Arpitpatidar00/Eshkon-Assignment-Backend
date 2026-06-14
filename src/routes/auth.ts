import { Router } from "express";
import { login, getMe, register, refresh } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", requireAuth, getMe);

export default router;
