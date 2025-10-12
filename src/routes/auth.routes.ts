import { Router } from "express";
import authController from "../controllers/auth.controller";
import { authenticateToken, loadUser } from "../middlewares/auth.middleware";

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/verify", authController.verifyToken);
router.get("/health", authController.health);

// Rutas protegidas (requieren autenticación)
// /me requiere loadUser para obtener información completa del usuario
router.get("/me", authenticateToken, loadUser, authController.getProfile);
// /logout-all solo requiere autenticación (usa tokenPayload.sub)
router.post("/logout-all", authenticateToken, authController.logoutAll);

export default router;
