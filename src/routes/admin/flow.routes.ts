import { Router } from "express";
import adminFlowController from "../../controllers/admin/flow.controller";
import {
  authenticateToken,
  requireAdmin,
} from "../../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken);
router.use(requireAdmin);

// Rutas de flujos
router.get("/", adminFlowController.listFlows);
router.post("/", adminFlowController.createFlow);
router.get("/:id", adminFlowController.getFlowById);
router.put("/:id", adminFlowController.updateFlow);
router.patch("/:id/toggle-status", adminFlowController.toggleFlowStatus);
router.delete("/:id", adminFlowController.deleteFlow);
router.delete("/:id/hard", adminFlowController.hardDeleteFlow);

export default router;
