import { Router } from "express";
import adminUserController from "../../controllers/admin/user.controller";
import {
  authenticateToken,
  requireAdmin,
} from "../../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken);
router.use(requireAdmin);

// Rutas de usuarios
router.get("/", adminUserController.listUsers);
router.post("/", adminUserController.createUser);
router.get("/:id", adminUserController.getUserById);
router.put("/:id", adminUserController.updateUser);
router.patch("/:id/toggle-status", adminUserController.toggleUserStatus);

export default router;
