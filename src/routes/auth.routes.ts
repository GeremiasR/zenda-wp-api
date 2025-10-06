import { Router } from "express";
import authController from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/verify", authController.verifyToken);
router.get("/health", authController.health);

// Rutas protegidas (requieren autenticación)
router.get("/me", authenticateToken, authController.getProfile);
router.post("/logout-all", authenticateToken, authController.logoutAll);

export default router;
