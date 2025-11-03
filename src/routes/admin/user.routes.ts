import { Router } from "express";
import adminUserController from "../../controllers/admin/user.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de usuarios con autorización basada en permisos
router.get("/", authorize("user", "view"), adminUserController.listUsers);
router.post("/", authorize("user", "create"), adminUserController.createUser);
router.get("/available-roles", authorize("user", "view"), adminUserController.getAvailableRoles);
router.get("/:id", authorize("user", "view"), adminUserController.getUserById);
router.put("/:id", authorize("user", "update"), adminUserController.updateUser);
router.patch("/:id/toggle-status", authorize("user", "update"), adminUserController.toggleUserStatus);

export default router;
