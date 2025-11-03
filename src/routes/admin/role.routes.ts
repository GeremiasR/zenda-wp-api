import { Router } from "express";
import adminRoleController from "../../controllers/admin/role.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de roles
router.get("/", authorize("role", "view"), adminRoleController.listRoles);
router.post("/", authorize("role", "create"), adminRoleController.createRole);
router.get("/:id", authorize("role", "view"), adminRoleController.getRoleById);
router.put("/:id", authorize("role", "update"), adminRoleController.updateRole);
router.delete("/:id", authorize("role", "delete"), adminRoleController.deleteRole);

export default router;

