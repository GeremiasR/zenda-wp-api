import { Router } from "express";
import { whatsappMultitenantController } from "../controllers/whatsapp-multitenant.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Rutas para gestión de WhatsApp por shop
router.post("/activate", whatsappMultitenantController.activateShopWhatsApp);
router.get(
  "/:shopId/status",
  whatsappMultitenantController.getShopWhatsAppStatus
);
router.post(
  "/:shopId/deactivate",
  whatsappMultitenantController.deactivateShopWhatsApp
);
router.get("/:shopId/qr", whatsappMultitenantController.getShopQR);

// Rutas para envío de mensajes
router.post("/send", whatsappMultitenantController.sendMessageFromShop);
router.post(
  "/send-group",
  whatsappMultitenantController.sendGroupMessageFromShop
);

// Ruta para administradores
router.get(
  "/admin/sessions",
  whatsappMultitenantController.getAllActiveSessions
);

export default router;
