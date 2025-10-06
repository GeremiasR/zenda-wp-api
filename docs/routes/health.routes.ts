/**
 * @swagger
 * /health:
 *   get:
 *     summary: Estado general del sistema
 *     description: Verifica el estado general de la API y sus servicios
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "API funcionando correctamente"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: "connected"
 *                       description: "Estado de la base de datos"
 *                     whatsapp:
 *                       type: string
 *                       example: "connected"
 *                       description: "Estado de WhatsApp"
 *                     auth:
 *                       type: string
 *                       example: "active"
 *                       description: "Estado del servicio de autenticación"
 *       500:
 *         description: Error en el sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Error en el sistema"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Database connection failed", "WhatsApp service unavailable"]
 */

/**
 * @swagger
 * /health/database:
 *   get:
 *     summary: Estado de la base de datos
 *     description: Verifica específicamente el estado de la conexión a MongoDB
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Base de datos conectada
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
 *                   example: "Base de datos conectada"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "connected"
 *                     host:
 *                       type: string
 *                       example: "localhost:27017"
 *                     database:
 *                       type: string
 *                       example: "zenda-wp-api"
 *                     collections:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["users", "shops", "flows", "refresh_tokens"]
 *       500:
 *         description: Error de conexión a la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error de conexión a la base de datos"
 *                 error:
 *                   type: string
 *                   example: "Connection timeout"
 */

/**
 * @swagger
 * /health/whatsapp:
 *   get:
 *     summary: Estado de WhatsApp
 *     description: Verifica específicamente el estado de la conexión con WhatsApp
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp conectado
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
 *                   example: "WhatsApp conectado"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isConnected:
 *                       type: boolean
 *                       example: true
 *                     sessionName:
 *                       type: string
 *                       example: "zenda-session"
 *                     lastSeen:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error de conexión con WhatsApp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error de conexión con WhatsApp"
 *                 error:
 *                   type: string
 *                   example: "Session not found"
 */

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: Métricas del sistema
 *     description: Obtiene métricas de rendimiento y uso del sistema
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas obtenidas exitosamente
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
 *                   example: "Métricas obtenidas exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       example: 3600
 *                       description: "Tiempo de actividad en segundos"
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                           example: 52428800
 *                           description: "Memoria usada en bytes"
 *                         free:
 *                           type: number
 *                           example: 104857600
 *                           description: "Memoria libre en bytes"
 *                         total:
 *                           type: number
 *                           example: 157286400
 *                           description: "Memoria total en bytes"
 *                     requests:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 1250
 *                           description: "Total de requests"
 *                         perMinute:
 *                           type: number
 *                           example: 25
 *                           description: "Requests por minuto"
 *                     database:
 *                       type: object
 *                       properties:
 *                         connections:
 *                           type: number
 *                           example: 5
 *                           description: "Conexiones activas"
 *                         queries:
 *                           type: number
 *                           example: 150
 *                           description: "Consultas ejecutadas"
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
