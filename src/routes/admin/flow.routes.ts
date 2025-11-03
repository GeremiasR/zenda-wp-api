import { Router } from "express";
import adminFlowController from "../../controllers/admin/flow.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de flujos con autorización basada en permisos
router.get("/", authorize("flow", "view"), adminFlowController.listFlows);
router.post("/", authorize("flow", "create"), adminFlowController.createFlow);
router.get("/:id", authorize("flow", "view"), adminFlowController.getFlowById);
router.put("/:id", authorize("flow", "update"), adminFlowController.updateFlow);
router.patch("/:id/toggle-status", authorize("flow", "update"), adminFlowController.toggleFlowStatus);
router.delete("/:id", authorize("flow", "delete"), adminFlowController.deleteFlow);
router.delete("/:id/hard", authorize("flow", "delete"), adminFlowController.hardDeleteFlow);

export default router;
