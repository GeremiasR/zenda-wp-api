# 🚀 Guía de Desarrollo con Swagger

## Inicio Rápido

### 1. Iniciar el Servidor con Documentación

```bash
npm run dev
```

### 2. Acceder a la Documentación

- **Swagger UI**: http://localhost:3000/api-docs
- **JSON de Swagger**: http://localhost:3000/api-docs.json

### 3. Generar Reporte de Documentación

```bash
npm run docs:generate
```

## Estructura de la Documentación

### 📁 Archivos Principales

- `docs/swagger.config.ts` - Configuración principal de Swagger
- `docs/routes/` - Documentación específica de cada módulo
- `src/middlewares/swagger.middleware.ts` - Middleware de integración

### 🏷️ Módulos Documentados

- **Auth** (6 endpoints) - Autenticación y autorización
- **WhatsApp** (4 endpoints) - Gestión de sesiones de WhatsApp
- **Flows** (7 endpoints) - Flujos conversacionales
- **Health** (4 endpoints) - Monitoreo del sistema

## Cómo Usar la Documentación

### 🔍 Explorar Endpoints

1. Ve a http://localhost:3000/api-docs
2. Expande cualquier sección (Auth, WhatsApp, etc.)
3. Haz clic en un endpoint para ver detalles
4. Usa "Try it out" para probar endpoints

### 🔐 Autenticación

1. Primero haz login en `/auth/login`
2. Copia el `access_token` de la respuesta
3. Haz clic en "Authorize" en la parte superior
4. Pega el token en el formato: `Bearer tu_token_aqui`
5. Ahora puedes probar endpoints protegidos

### 📝 Ejemplos de Uso

#### Login

```json
{
  "email": "admin@zenda.com",
  "password": "admin123"
}
```

#### Crear Flujo

```json
{
  "name": "Flujo de Bienvenida",
  "description": "Flujo para nuevos usuarios",
  "phoneNumber": "+1234567890",
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

## Desarrollo de Nuevos Endpoints

### 1. Crear Documentación

Agrega comentarios Swagger en el controlador:

```typescript
/**
 * @swagger
 * /nueva-ruta:
 *   post:
 *     summary: Descripción corta
 *     description: Descripción detallada
 *     tags: [TagName]
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

### 2. Definir Esquemas

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

### 3. Probar el Endpoint

1. Reinicia el servidor
2. Ve a Swagger UI
3. Busca tu nuevo endpoint
4. Prueba con "Try it out"

## Mejores Prácticas

### ✅ Documentación

- Siempre incluye `summary` y `description`
- Usa tags apropiadas para categorizar
- Documenta todos los códigos de respuesta
- Incluye ejemplos realistas

### 🔒 Seguridad

- Marca endpoints que requieren autenticación
- Documenta permisos y roles necesarios
- Incluye ejemplos de tokens válidos

### 📊 Respuestas

- Documenta todas las respuestas posibles
- Incluye códigos de error comunes
- Usa esquemas reutilizables cuando sea posible

### 🎨 Presentación

- Usa descripciones claras y concisas
- Agrupa endpoints relacionados con tags
- Incluye ejemplos prácticos

## Solución de Problemas

### ❌ La documentación no aparece

1. Verifica que el servidor esté ejecutándose
2. Revisa la consola por errores
3. Asegúrate de que los archivos estén en la ruta correcta

### ❌ Errores de sintaxis en Swagger

1. Usa Swagger Editor para validar
2. Revisa la indentación (debe ser consistente)
3. Verifica que las referencias a esquemas existan

### ❌ Endpoints no se muestran

1. Verifica que los comentarios tengan `@swagger`
2. Asegúrate de que estén en el formato correcto
3. Revisa que la ruta esté bien definida

## Recursos Adicionales

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Examples](https://swagger.io/docs/specification/2-0/describing-request-body/)
