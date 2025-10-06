/**
 * @swagger
 * /admin/flows:
 *   get:
 *     summary: Listar todos los flujos (Admin)
 *     description: Obtiene la lista de todos los flujos con paginación y filtros
 *     tags: [Admin]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *         description: Filtrar por tienda
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, descripción o número de teléfono
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
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/flows:
 *   post:
 *     summary: Crear nuevo flujo (Admin)
 *     description: Crea un nuevo flujo conversacional en el sistema
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phoneNumber, shopId, initialState, states]
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
 *               shopId:
 *                 type: string
 *                 example: "64f8a1b2c3d4e5f6a7b8c9d1"
 *                 description: "ID de la tienda"
 *               initialState:
 *                 type: string
 *                 example: "menu"
 *                 description: "Estado inicial del flujo"
 *               states:
 *                 type: object
 *                 description: "Estados del flujo"
 *                 example:
 *                   menu:
 *                     message: "Bienvenido, elige una opción:"
 *                     options:
 *                       - input: ["1", "servicio"]
 *                         event: "SERVICIO"
 *                         next: "servicio"
 *                       - input: ["2", "contacto"]
 *                         event: "CONTACTO"
 *                         next: "contacto"
 *                   servicio:
 *                     message: "Has elegido servicio"
 *                     options:
 *                       - input: ["volver", "menu"]
 *                         event: "VOLVER"
 *                         next: "menu"
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
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /admin/flows/{id}:
 *   get:
 *     summary: Obtener flujo por ID (Admin)
 *     description: Obtiene un flujo específico por su ID
 *     tags: [Admin]
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
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
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
 * /admin/flows/{id}:
 *   put:
 *     summary: Actualizar flujo (Admin)
 *     description: Actualiza un flujo existente
 *     tags: [Admin]
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
 *                 example: "+1234567891"
 *                 description: "Número de teléfono asociado"
 *               shopId:
 *                 type: string
 *                 example: "64f8a1b2c3d4e5f6a7b8c9d1"
 *                 description: "ID de la tienda"
 *               initialState:
 *                 type: string
 *                 example: "menu"
 *                 description: "Estado inicial del flujo"
 *               states:
 *                 type: object
 *                 description: "Estados del flujo"
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
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
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
 * /admin/flows/{id}/toggle-status:
 *   patch:
 *     summary: Cambiar estado de flujo (Admin)
 *     description: Activa o desactiva un flujo (soft delete)
 *     tags: [Admin]
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: "Nuevo estado del flujo"
 *     responses:
 *       200:
 *         description: Estado de flujo actualizado exitosamente
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
 *                   example: "Estado de flujo actualizado exitosamente"
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
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
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
 * /admin/flows/{id}:
 *   delete:
 *     summary: Eliminar flujo (Admin) - Soft Delete
 *     description: Marca un flujo como eliminado (soft delete)
 *     tags: [Admin]
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
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
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
 * /admin/flows/{id}/hard:
 *   delete:
 *     summary: Eliminar flujo permanentemente (Admin) - Hard Delete
 *     description: Elimina permanentemente un flujo del sistema
 *     tags: [Admin]
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
 *         description: Flujo eliminado permanentemente
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
 *                   example: "Flujo eliminado permanentemente"
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Permisos insuficientes (requiere rol ADMIN)
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
