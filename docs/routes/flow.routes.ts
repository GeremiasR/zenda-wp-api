/**
 * @swagger
 * /flows:
 *   get:
 *     summary: Obtener todos los flujos
 *     description: Obtiene la lista de todos los flujos conversacionales
 *     tags: [Flows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de elementos por página
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de tienda
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de flujos obtenida exitosamente
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
 *                   example: "Flujos obtenidos exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     flows:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Flow'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           example: 3
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /flows:
 *   post:
 *     summary: Crear nuevo flujo
 *     description: Crea un nuevo flujo conversacional
 *     tags: [Flows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phoneNumber, initialState, states]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Flujo de Bienvenida"
 *                 description: "Nombre del flujo"
 *               description:
 *                 type: string
 *                 example: "Flujo de bienvenida para nuevos usuarios"
 *                 description: "Descripción del flujo"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: "Número de teléfono asociado"
 *               initialState:
 *                 type: string
 *                 example: "menu"
 *                 description: "Estado inicial del flujo"
 *               states:
 *                 type: object
 *                 description: "Estados del flujo"
 *                 additionalProperties: true
 *                 example:
 *                   menu:
 *                     message: "Bienvenido, elige una opción:"
 *                     options:
 *                       - input: ["1", "servicio"]
 *                         event: "SERVICIO"
 *                         next: "servicio"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: "Estado activo del flujo"
 *     responses:
 *       201:
 *         description: Flujo creado exitosamente
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
 *                   example: "Flujo creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Flow'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Usuario no autenticado
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

/**
 * @swagger
 * /flows/{id}:
 *   get:
 *     summary: Obtener flujo por ID
 *     description: Obtiene un flujo específico por su ID
 *     tags: [Flows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del flujo
 *     responses:
 *       200:
 *         description: Flujo obtenido exitosamente
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
 *                   example: "Flujo obtenido exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Flow'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Flujo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /flows/{id}:
 *   put:
 *     summary: Actualizar flujo
 *     description: Actualiza un flujo existente
 *     tags: [Flows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del flujo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Flujo de Bienvenida Actualizado"
 *                 description: "Nombre del flujo"
 *               description:
 *                 type: string
 *                 example: "Flujo de bienvenida actualizado"
 *                 description: "Descripción del flujo"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: "Número de teléfono asociado"
 *               initialState:
 *                 type: string
 *                 example: "menu"
 *                 description: "Estado inicial del flujo"
 *               states:
 *                 type: object
 *                 description: "Estados del flujo"
 *                 additionalProperties: true
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: "Estado activo del flujo"
 *     responses:
 *       200:
 *         description: Flujo actualizado exitosamente
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
 *                   example: "Flujo actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Flow'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Flujo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /flows/{id}:
 *   delete:
 *     summary: Eliminar flujo
 *     description: Elimina un flujo (soft delete)
 *     tags: [Flows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del flujo
 *     responses:
 *       200:
 *         description: Flujo eliminado exitosamente
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
 *                   example: "Flujo eliminado exitosamente"
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Flujo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /flows/{id}/activate:
 *   post:
 *     summary: Activar flujo
 *     description: Activa un flujo específico
 *     tags: [Flows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del flujo
 *     responses:
 *       200:
 *         description: Flujo activado exitosamente
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
 *                   example: "Flujo activado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Flow'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Flujo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /flows/{id}/deactivate:
 *   post:
 *     summary: Desactivar flujo
 *     description: Desactiva un flujo específico
 *     tags: [Flows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del flujo
 *     responses:
 *       200:
 *         description: Flujo desactivado exitosamente
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
 *                   example: "Flujo desactivado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Flow'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Flujo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
