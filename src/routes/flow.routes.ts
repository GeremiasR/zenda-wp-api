import { Router } from "express";
import { flowController } from "../controllers/flow.controller";

const router = Router();

/**
 * @route   POST /api/flows/example/:shopId
 * @desc    Inicializar un flujo de ejemplo para una tienda
 * @access  Public
 */
router.post("/example/:shopId", flowController.initializeExampleFlow);

/**
 * @route   GET /api/flows
 * @desc    Obtener todos los flujos
 * @access  Public
 */
router.get("/", flowController.getAllFlows);

/**
 * @route   GET /api/flows/sessions
 * @desc    Obtener todas las sesiones de mensaje
 * @access  Public
 */
router.get("/sessions", flowController.getAllMessageSessions);

export default router;
