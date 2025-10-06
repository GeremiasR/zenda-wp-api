# 📚 Documentación de la API - Zenda WhatsApp

## Descripción General

Esta carpeta contiene toda la documentación de la API de Zenda WhatsApp, incluyendo la configuración de Swagger y las definiciones de rutas.

## Estructura de Archivos

```
docs/
├── README.md                    # Este archivo
├── swagger.config.ts           # Configuración principal de Swagger
└── routes/                     # Documentación específica de rutas
    ├── auth.routes.ts          # Documentación de autenticación
    ├── whatsapp.routes.ts      # Documentación de WhatsApp
    ├── flow.routes.ts          # Documentación de flujos
    └── health.routes.ts        # Documentación de salud del sistema
```

## Cómo Acceder a la Documentación

### 1. Interfaz Web de Swagger UI

Una vez que el servidor esté ejecutándose, puedes acceder a la documentación interactiva en:

```
http://localhost:3000/api-docs
```

### 2. JSON de Swagger

Para obtener el JSON completo de la documentación:

```
http://localhost:3000/api-docs.json
```

## Características de la Documentación

### ✅ Documentación Completa

- **Autenticación**: Login, refresh, logout, perfil de usuario
- **WhatsApp**: Conexión, desconexión, envío de mensajes, estado
- **Flujos**: CRUD completo de flujos conversacionales
- **Salud**: Monitoreo del sistema y métricas

### 🔒 Seguridad

- Documentación de autenticación JWT
- Ejemplos de tokens y refresh tokens
- Esquemas de seguridad para cada endpoint

### 📝 Ejemplos

- Ejemplos de requests y responses
- Diferentes escenarios de uso
- Códigos de error detallados

### 🎨 Interfaz Personalizada

- Diseño personalizado para la marca Zenda
- Navegación intuitiva
- Filtros y búsqueda

## Cómo Agregar Nueva Documentación

### 1. Para Nuevas Rutas

Crea un archivo en `docs/routes/` siguiendo el patrón:

```typescript
/**
 * @swagger
 * /nueva-ruta:
 *   get:
 *     summary: Descripción corta
 *     description: Descripción detallada
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaName'
 */
```

### 2. Para Nuevos Esquemas

Agrega el esquema en `docs/swagger.config.ts` en la sección `components.schemas`:

```typescript
NuevoSchema: {
  type: "object",
  properties: {
    campo1: {
      type: "string",
      example: "valor ejemplo",
      description: "Descripción del campo"
    }
  }
}
```

### 3. Para Nuevas Tags

Agrega la tag en `docs/swagger.config.ts` en la sección `tags`:

```typescript
{
  name: "NuevaTag",
  description: "Descripción de la nueva tag"
}
```

## Convenciones de Documentación

### 📋 Estructura de Endpoints

- **Summary**: Descripción corta (máximo 50 caracteres)
- **Description**: Descripción detallada del endpoint
- **Tags**: Categorización del endpoint
- **Security**: Autenticación requerida (si aplica)
- **Parameters**: Parámetros de path, query, etc.
- **Request Body**: Esquema del cuerpo de la petición
- **Responses**: Todas las respuestas posibles con códigos de estado

### 🏷️ Tags Recomendadas

- `Auth`: Autenticación y autorización
- `WhatsApp`: Funcionalidades de WhatsApp
- `Flows`: Gestión de flujos conversacionales
- `Health`: Monitoreo y salud del sistema
- `Users`: Gestión de usuarios
- `Shops`: Gestión de tiendas

### 📊 Códigos de Estado

- `200`: Operación exitosa
- `201`: Recurso creado exitosamente
- `400`: Datos de entrada inválidos
- `401`: No autenticado
- `403`: Sin permisos
- `404`: Recurso no encontrado
- `409`: Conflicto (recurso duplicado)
- `500`: Error interno del servidor

## Herramientas de Desarrollo

### 🔧 Swagger Editor

Para editar la documentación de forma visual:

1. Copia el contenido de `swagger.config.ts`
2. Pégalo en [Swagger Editor](https://editor.swagger.io/)
3. Edita y valida
4. Copia de vuelta al archivo

### 🧪 Testing con Swagger UI

1. Ve a `http://localhost:3000/api-docs`
2. Haz clic en "Try it out" en cualquier endpoint
3. Completa los parámetros requeridos
4. Ejecuta la petición directamente desde la interfaz

### 📱 Generación de SDKs

Puedes usar el JSON de Swagger para generar SDKs en diferentes lenguajes:

- **JavaScript/TypeScript**: `swagger-codegen`
- **Python**: `swagger-codegen` o `openapi-generator`
- **Java**: `swagger-codegen`
- **C#**: `swagger-codegen`

## Mantenimiento

### 🔄 Actualización de Documentación

1. Actualiza los archivos en `docs/routes/`
2. Modifica esquemas en `docs/swagger.config.ts` si es necesario
3. Reinicia el servidor para ver los cambios
4. Verifica que la documentación se vea correctamente

### ✅ Validación

- Usa Swagger Editor para validar la sintaxis
- Prueba todos los endpoints desde Swagger UI
- Verifica que los ejemplos sean correctos
- Asegúrate de que los esquemas estén bien definidos

## Recursos Adicionales

- [Documentación de Swagger/OpenAPI](https://swagger.io/docs/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Codegen](https://swagger.io/tools/swagger-codegen/)
