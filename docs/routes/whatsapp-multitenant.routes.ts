import { Router } from "express";
import { whatsappMultitenantController } from "../../src/controllers/whatsapp-multitenant.controller";
import { authenticateToken } from "../../src/middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /whatsapp-shop/activate:
 *   post:
 *     summary: Activar WhatsApp para un shop
 *     description: Activa una sesión de WhatsApp para un shop específico y genera un código QR para conectar
 *     tags: [WhatsApp Multitenant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WhatsAppMultitenantActivateRequest'
 *     responses:
 *       200:
 *         description: WhatsApp activado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhatsAppMultitenantActivateResponse'
 *       400:
 *         description: Error en la petición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos para este shop
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/activate",
  authenticateToken,
  whatsappMultitenantController.activateShopWhatsApp
);

/**
 * @swagger
 * /whatsapp-shop/{shopId}/status:
 *   get:
 *     summary: Obtener estado de WhatsApp de un shop
 *     description: Obtiene el estado actual de la sesión de WhatsApp de un shop específico
 *     tags: [WhatsApp Multitenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del shop
 *         example: shop_123
 *     responses:
 *       200:
 *         description: Estado obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhatsAppMultitenantStatus'
 *       400:
 *         description: Error en la petición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos para este shop
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:shopId/status",
  authenticateToken,
  whatsappMultitenantController.getShopWhatsAppStatus
);

/**
 * @swagger
 * /whatsapp-shop/{shopId}/qr:
 *   get:
 *     summary: Obtener código QR de un shop
 *     description: Obtiene el código QR actual para conectar WhatsApp (útil para polling)
 *     tags: [WhatsApp Multitenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del shop
 *         example: shop_123
 *     responses:
 *       200:
 *         description: QR obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "QR obtenido"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shopId:
 *                       type: string
 *                       example: shop_123
 *                     qr:
 *                       type: string
 *                       example: "2@ABC123DEF456..."
 *                       description: Código QR actual (si existe)
 *                     isConnected:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Error en la petición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos para este shop
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:shopId/qr",
  authenticateToken,
  whatsappMultitenantController.getShopQR
);

/**
 * @swagger
 * /whatsapp-shop/{shopId}/deactivate:
 *   post:
 *     summary: Desactivar WhatsApp de un shop
 *     description: Desactiva la sesión de WhatsApp de un shop específico
 *     tags: [WhatsApp Multitenant]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del shop
 *         example: shop_123
 *     responses:
 *       200:
 *         description: WhatsApp desactivado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "WhatsApp desactivado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shopId:
 *                       type: string
 *                       example: shop_123
 *       400:
 *         description: Error en la petición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos para este shop
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:shopId/deactivate",
  authenticateToken,
  whatsappMultitenantController.deactivateShopWhatsApp
);

/**
 * @swagger
 * /whatsapp-shop/send:
 *   post:
 *     summary: Enviar mensaje desde un shop
 *     description: Envía un mensaje de WhatsApp desde la sesión de un shop específico
 *     tags: [WhatsApp Multitenant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WhatsAppMultitenantSendMessageRequest'
 *     responses:
 *       200:
 *         description: Mensaje enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Mensaje enviado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shopId:
 *                       type: string
 *                       example: shop_123
 *                     jid:
 *                       type: string
 *                       example: "5491123456789@s.whatsapp.net"
 *                     message:
 *                       type: string
 *                       example: "Hola! ¿Cómo estás?"
 *       400:
 *         description: Error en la petición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos para este shop
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/send",
  authenticateToken,
  whatsappMultitenantController.sendMessageFromShop
);

/**
 * @swagger
 * /whatsapp-shop/send-group:
 *   post:
 *     summary: Enviar mensaje a grupo desde un shop
 *     description: Envía un mensaje a un grupo de WhatsApp desde la sesión de un shop específico
 *     tags: [WhatsApp Multitenant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WhatsAppMultitenantSendGroupMessageRequest'
 *     responses:
 *       200:
 *         description: Mensaje enviado al grupo exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Mensaje enviado al grupo exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shopId:
 *                       type: string
 *                       example: shop_123
 *                     groupJid:
 *                       type: string
 *                       example: "120363123456789012@g.us"
 *                     message:
 *                       type: string
 *                       example: "Mensaje para el grupo"
 *       400:
 *         description: Error en la petición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos para este shop
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/send-group",
  authenticateToken,
  whatsappMultitenantController.sendGroupMessageFromShop
);

/**
 * @swagger
 * /whatsapp-shop/admin/sessions:
 *   get:
 *     summary: Obtener todas las sesiones activas (Solo Admins)
 *     description: Obtiene todas las sesiones activas del sistema (solo para administradores)
 *     tags: [WhatsApp Multitenant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesiones activas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WhatsAppMultitenantActiveSessions'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/admin/sessions",
  authenticateToken,
  whatsappMultitenantController.getAllActiveSessions
);

export default router;
