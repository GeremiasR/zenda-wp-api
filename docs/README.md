# 📚 Documentación de la API - Zenda WhatsApp

## Descripción General

Esta carpeta contiene toda la documentación de la API de Zenda WhatsApp, incluyendo la configuración de Swagger y las definiciones de rutas.

## Estructura de Archivos

```
docs/
├── README.md                    # Este archivo
├── swagger.config.ts           # Configuración principal de Swagger
├── swagger-dev.md              # Guía de desarrollo con Swagger
├── ADMIN_API.md                # Documentación específica del módulo Admin
├── generate-docs.js            # Script para generar reportes de documentación
└── routes/                     # Documentación específica de rutas
    ├── admin.routes.ts         # Documentación de administración (tiendas/usuarios)
    ├── admin-flows.routes.ts   # Documentación de administración (flujos)
    ├── auth.routes.ts          # Documentación de autenticación
    ├── whatsapp.routes.ts      # Documentación de WhatsApp
    ├── flow.routes.ts          # Documentación de flujos
    └── health.routes.ts        # Documentación de salud del sistema
```

## Cómo Acceder a la Documentación

### 🌐 Swagger UI (Interfaz Interactiva)

Una vez que el servidor esté ejecutándose, puedes acceder a la interfaz de Swagger UI en:

**URL**: `http://localhost:3000/api-docs`

### 📄 JSON de Swagger (Para Herramientas Externas)

Para obtener el JSON de Swagger que puedes importar en Postman u otras herramientas:

**URLs disponibles**:

- `http://localhost:3000/api-docs.json` (estándar)
- `http://localhost:3000/api-docs-json` (compatible con Postman)

## Módulos de la API

### 🔐 Autenticación (`/api/auth`)

- **Login** con email y contraseña
- **Refresh token** para renovar acceso
- **Logout** individual y masivo
- **Verificación** de tokens
- **Perfil** del usuario autenticado

### 📱 WhatsApp (`/api/whatsapp`)

- **Gestión de sesiones** de WhatsApp
- **Conexión/desconexión** de sesiones
- **Códigos QR** para autenticación
- **Estado** de conexión

### 🔄 Flujos (`/api/flows`)

- **Creación** de flujos conversacionales
- **Gestión** de estados y transiciones
- **Ejecución** de flujos
- **Configuración** por tienda

### 🔧 Administración (`/api/admin`)

- **Gestión de tiendas** (CRUD completo)
- **Gestión de usuarios** (CRUD completo)
- **Gestión de flujos** (CRUD completo)
- **Soft delete** para tiendas, usuarios y flujos
- **Filtros y búsqueda** avanzada
- **Paginación** en todas las listas

### ❤️ Salud del Sistema (`/api/health`)

- **Estado** de la API
- **Conectividad** con MongoDB
- **Métricas** básicas del sistema

## Características de la Documentación

### ✨ Interfaz Swagger

- **Diseño personalizado** para la marca Zenda
- **Navegación intuitiva** con filtros por categorías
- **Pruebas interactivas** de todos los endpoints
- **Autenticación JWT** integrada
- **Ejemplos de código** para cada endpoint

### 📊 Estadísticas Actuales

- **34 endpoints** completamente documentados
- **6 módulos** de funcionalidad
- **7 esquemas** reutilizables definidos
- **5 categorías** de endpoints (Auth, WhatsApp, Flows, Admin, Health)

### 🛡️ Seguridad

- **Autenticación JWT** requerida para endpoints protegidos
- **Control de roles** (ADMIN, SHOPADMIN, SHOPUSER, CUSTOMER)
- **Validación** de permisos por tienda
- **Manejo de errores** estandarizado

## Scripts Disponibles

### 📈 Generar Reporte de Documentación

```bash
npm run docs:generate
```

Este script analiza todos los archivos de documentación y genera un reporte con:

- Número de endpoints documentados por módulo
- Estadísticas de cobertura
- Archivos procesados
- Promedio de documentación por archivo

### 🚀 Iniciar Servidor con Documentación

```bash
npm run docs:serve
# o simplemente
npm run dev
```

## Cómo Usar la Documentación

### 1. 🔍 Explorar Endpoints

1. Ve a `http://localhost:3000/api-docs`
2. Expande cualquier sección (Auth, WhatsApp, Flows, Admin, Health)
3. Haz clic en un endpoint para ver detalles completos
4. Usa "Try it out" para probar endpoints en tiempo real

### 2. 🔐 Autenticación

1. Primero haz login en `/auth/login`:
   ```json
   {
     "email": "admin@zenda.com",
     "password": "admin123"
   }
   ```
2. Copia el `access_token` de la respuesta
3. Haz clic en "Authorize" en la parte superior de Swagger UI
4. Pega el token en el formato: `Bearer tu_token_aqui`
5. Ahora puedes probar todos los endpoints protegidos

### 3. 📝 Ejemplos de Uso

#### Crear una nueva tienda (Admin)

```json
POST /api/admin/shops
{
  "name": "Mi Nueva Tienda",
  "internalName": "mi-nueva-tienda",
  "isActive": true
}
```

#### Crear un flujo conversacional (Admin)

```json
POST /api/admin/flows
{
  "name": "Flujo de Bienvenida",
  "description": "Flujo para nuevos usuarios",
  "phoneNumber": "+1234567890",
  "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "initialState": "menu",
  "states": {
    "menu": {
      "message": "Bienvenido, elige una opción:",
      "options": [
        {
          "input": ["1", "servicio"],
          "event": "SERVICIO",
          "next": "servicio"
        }
      ]
    }
  }
}
```

#### Crear un usuario (Admin)

```json
POST /api/admin/users
{
  "username": "nuevo_usuario",
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "roleCode": "SHOPUSER",
  "isActive": true
}
```

## Desarrollo de Nuevos Endpoints

### 1. 📝 Crear Documentación

Agrega comentarios Swagger en el controlador:

```typescript
/**
 * @swagger
 * /nueva-ruta:
 *   post:
 *     summary: Descripción corta
 *     description: Descripción detallada
 *     tags: [NombreModulo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevoSchema'
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaSchema'
 */
```

### 2. 🏗️ Definir Esquemas

Agrega esquemas en `docs/swagger.config.ts`:

```typescript
NuevoSchema: {
  type: "object",
  required: ["campo1", "campo2"],
  properties: {
    campo1: {
      type: "string",
      example: "valor ejemplo",
      description: "Descripción del campo"
    },
    campo2: {
      type: "integer",
      example: 123,
      description: "Número de ejemplo"
    }
  }
}
```

### 3. 🧪 Probar el Endpoint

1. Reinicia el servidor: `npm run dev`
2. Ve a Swagger UI: `http://localhost:3000/api-docs`
3. Busca tu nuevo endpoint
4. Prueba con "Try it out"

## Mejores Prácticas

### ✅ Documentación

- Siempre incluye `summary` y `description`
- Usa tags apropiadas para categorizar
- Documenta todos los códigos de respuesta posibles
- Incluye ejemplos realistas y útiles

### 🔒 Seguridad

- Marca endpoints que requieren autenticación
- Documenta permisos y roles necesarios
- Incluye ejemplos de tokens válidos
- Especifica códigos de error de seguridad

### 📊 Respuestas

- Documenta todas las respuestas posibles (200, 400, 401, 403, 404, 409, 500)
- Incluye códigos de error comunes
- Usa esquemas reutilizables cuando sea posible
- Proporciona ejemplos de respuestas reales

### 🎨 Presentación

- Usa descripciones claras y concisas
- Agrupa endpoints relacionados con tags
- Incluye ejemplos prácticos de uso
- Mantén consistencia en el formato

## Solución de Problemas

### ❌ La documentación no aparece

1. Verifica que el servidor esté ejecutándose: `npm run dev`
2. Revisa la consola por errores de compilación
3. Asegúrate de que los archivos estén en las rutas correctas
4. Verifica que las rutas estén incluidas en `swagger.config.ts`

### ❌ Errores de sintaxis en Swagger

1. Usa [Swagger Editor](https://editor.swagger.io/) para validar
2. Revisa la indentación (debe ser consistente)
3. Verifica que las referencias a esquemas existan
4. Asegúrate de que los tipos de datos sean correctos

### ❌ Endpoints no se muestran

1. Verifica que los comentarios tengan `@swagger`
2. Asegúrate de que estén en el formato correcto
3. Revisa que la ruta esté bien definida
4. Verifica que el archivo esté incluido en `apis` de `swagger.config.ts`

### ❌ Autenticación no funciona

1. Verifica que el token JWT sea válido
2. Asegúrate de usar el formato correcto: `Bearer tu_token`
3. Revisa que el usuario tenga los permisos necesarios
4. Verifica que el token no haya expirado

## Recursos Adicionales

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Examples](https://swagger.io/docs/specification/2-0/describing-request-body/)
- [JWT.io](https://jwt.io/) - Para debuggear tokens JWT
- [Postman](https://www.postman.com/) - Para importar y probar la API

## Contacto

Para soporte técnico o preguntas sobre la documentación:

- **Email**: dev@zenda.com
- **Equipo**: Equipo de Desarrollo Zenda
