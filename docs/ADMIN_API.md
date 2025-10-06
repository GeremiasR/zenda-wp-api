# 🔐 API de Administración - Zenda WhatsApp

## Descripción General

El módulo de administración proporciona endpoints para gestionar tiendas, usuarios y flujos del sistema. Todos los endpoints requieren autenticación JWT y el rol de **ADMIN**.

## Autenticación

Todos los endpoints requieren:

- **Token JWT** en el header `Authorization: Bearer <token>`
- **Rol ADMIN** en el token JWT

## Endpoints de Tiendas

### 📋 Listar Tiendas

```http
GET /api/admin/shops
```

**Parámetros de consulta:**

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, max: 100)
- `isActive` (opcional): Filtrar por estado activo (true/false)
- `search` (opcional): Buscar por nombre o internalName

**Respuesta:**

```json
{
  "success": true,
  "message": "Tiendas obtenidas exitosamente",
  "data": {
    "shops": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "Tienda Principal",
        "internalName": "tienda-principal",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### ➕ Crear Tienda

```http
POST /api/admin/shops
```

**Body:**

```json
{
  "name": "Tienda Principal",
  "internalName": "tienda-principal",
  "isActive": true
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Tienda creada exitosamente",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Tienda Principal",
    "internalName": "tienda-principal",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 🔍 Obtener Tienda por ID

```http
GET /api/admin/shops/{id}
```

### ✏️ Actualizar Tienda

```http
PUT /api/admin/shops/{id}
```

### 🔄 Cambiar Estado de Tienda (Soft Delete)

```http
PATCH /api/admin/shops/{id}/toggle-status
```

**Body:**

```json
{
  "isActive": false
}
```

### 🗑️ Eliminar Tienda (Hard Delete)

```http
DELETE /api/admin/shops/{id}
```

## Endpoints de Usuarios

### 📋 Listar Usuarios

```http
GET /api/admin/users
```

**Parámetros de consulta:**

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, max: 100)
- `isActive` (opcional): Filtrar por estado activo (true/false)
- `roleCode` (opcional): Filtrar por rol (ADMIN, SHOPADMIN, SHOPUSER, CUSTOMER)
- `shopId` (opcional): Filtrar por tienda
- `search` (opcional): Buscar por username o email

**Respuesta:**

```json
{
  "success": true,
  "message": "Usuarios obtenidos exitosamente",
  "data": {
    "users": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "username": "admin",
        "email": "admin@zenda.com",
        "roleCode": "ADMIN",
        "shopId": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Tienda Principal",
          "internalName": "tienda-principal"
        },
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### ➕ Crear Usuario

```http
POST /api/admin/users
```

**Body:**

```json
{
  "username": "nuevo_usuario",
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "roleCode": "SHOPUSER",
  "isActive": true
}
```

### 🔍 Obtener Usuario por ID

```http
GET /api/admin/users/{id}
```

### ✏️ Actualizar Usuario

```http
PUT /api/admin/users/{id}
```

### 🔄 Cambiar Estado de Usuario (Soft Delete)

```http
PATCH /api/admin/users/{id}/toggle-status
```

## Endpoints de Flujos

### 📋 Listar Flujos

```http
GET /api/admin/flows
```

**Parámetros de consulta:**

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, max: 100)
- `isActive` (opcional): Filtrar por estado activo (true/false)
- `shopId` (opcional): Filtrar por tienda
- `search` (opcional): Buscar por nombre, descripción o número de teléfono

**Respuesta:**

```json
{
  "success": true,
  "message": "Flujos obtenidos exitosamente",
  "data": {
    "flows": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "Flujo de Bienvenida",
        "description": "Flujo de bienvenida para nuevos usuarios",
        "phoneNumber": "+1234567890",
        "shopId": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Tienda Principal",
          "internalName": "tienda-principal"
        },
        "isActive": true,
        "isDeleted": false,
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
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### ➕ Crear Flujo

```http
POST /api/admin/flows
```

**Body:**

```json
{
  "name": "Flujo de Bienvenida",
  "description": "Flujo de bienvenida para nuevos usuarios",
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
        },
        {
          "input": ["2", "contacto"],
          "event": "CONTACTO",
          "next": "contacto"
        }
      ]
    },
    "servicio": {
      "message": "Has elegido servicio",
      "options": [
        {
          "input": ["volver", "menu"],
          "event": "VOLVER",
          "next": "menu"
        }
      ]
    }
  },
  "isActive": true
}
```

### 🔍 Obtener Flujo por ID

```http
GET /api/admin/flows/{id}
```

### ✏️ Actualizar Flujo

```http
PUT /api/admin/flows/{id}
```

**Body:**

```json
{
  "name": "Flujo de Bienvenida Actualizado",
  "description": "Flujo actualizado",
  "phoneNumber": "+1234567891",
  "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "initialState": "menu",
  "states": {
    "menu": {
      "message": "Bienvenido actualizado, elige una opción:",
      "options": [
        {
          "input": ["1", "servicio"],
          "event": "SERVICIO",
          "next": "servicio"
        }
      ]
    }
  },
  "isActive": true
}
```

### 🔄 Cambiar Estado de Flujo (Soft Delete)

```http
PATCH /api/admin/flows/{id}/toggle-status
```

**Body:**

```json
{
  "isActive": false
}
```

### 🗑️ Eliminar Flujo (Soft Delete)

```http
DELETE /api/admin/flows/{id}
```

### 💥 Eliminar Flujo Permanentemente (Hard Delete)

```http
DELETE /api/admin/flows/{id}/hard
```

## Códigos de Error

### 401 - No Autenticado

```json
{
  "success": false,
  "message": "Token de autenticación no proporcionado",
  "statusCode": 401
}
```

### 403 - Permisos Insuficientes

```json
{
  "success": false,
  "message": "Acceso denegado: Rol insuficiente",
  "statusCode": 403
}
```

### 404 - No Encontrado

```json
{
  "success": false,
  "message": "Recurso no encontrado",
  "statusCode": 404
}
```

### 409 - Conflicto

```json
{
  "success": false,
  "message": "Recurso ya existe",
  "statusCode": 409
}
```

## Ejemplos de Uso

### 1. Listar todas las tiendas activas

```bash
curl -X GET "http://localhost:3000/api/admin/shops?isActive=true" \
  -H "Authorization: Bearer tu_token_jwt"
```

### 2. Crear una nueva tienda

```bash
curl -X POST "http://localhost:3000/api/admin/shops" \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nueva Tienda",
    "internalName": "nueva-tienda",
    "isActive": true
  }'
```

### 3. Crear un flujo conversacional

```bash
curl -X POST "http://localhost:3000/api/admin/flows" \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Flujo de Ventas",
    "description": "Flujo para proceso de ventas",
    "phoneNumber": "+1234567890",
    "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "initialState": "bienvenida",
    "states": {
      "bienvenida": {
        "message": "¡Hola! ¿En qué puedo ayudarte?",
        "options": [
          {
            "input": ["producto", "catalogo"],
            "event": "VER_PRODUCTOS",
            "next": "productos"
          }
        ]
      },
      "productos": {
        "message": "Aquí están nuestros productos:",
        "options": [
          {
            "input": ["volver"],
            "event": "VOLVER",
            "next": "bienvenida"
          }
        ]
      }
    },
    "isActive": true
  }'
```

### 4. Buscar flujos por tienda

```bash
curl -X GET "http://localhost:3000/api/admin/flows?shopId=64f8a1b2c3d4e5f6a7b8c9d1" \
  -H "Authorization: Bearer tu_token_jwt"
```

### 5. Desactivar un flujo

```bash
curl -X PATCH "http://localhost:3000/api/admin/flows/64f8a1b2c3d4e5f6a7b8c9d0/toggle-status" \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

## Notas Importantes

1. **Soft Delete**: Usar `toggle-status` para activar/desactivar en lugar de eliminar permanentemente
2. **Paginación**: Todos los endpoints de listado soportan paginación
3. **Filtros**: Los endpoints de listado soportan múltiples filtros combinados
4. **Búsqueda**: La búsqueda es case-insensitive y busca en múltiples campos
5. **Validación**: Todos los campos requeridos son validados antes de procesar
6. **Seguridad**: Solo usuarios con rol ADMIN pueden acceder a estos endpoints
7. **Flujos**: Los flujos requieren validación de estructura de estados y estado inicial
8. **Teléfonos**: Los números de teléfono deben seguir el formato internacional

## Swagger UI

Para ver la documentación interactiva completa, visita:

- **Swagger UI**: http://localhost:3000/api-docs
- **JSON de Swagger**: http://localhost:3000/api-docs.json
