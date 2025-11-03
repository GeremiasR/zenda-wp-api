# 🔐 API de Autenticación - Zenda WhatsApp API

## Descripción General

La API de autenticación implementa un sistema de autenticación JWT con refresh tokens, siguiendo las mejores prácticas de seguridad. Utiliza la opción 2 del documento AUTH.md, guardando los refresh tokens en una colección separada.

## 🚀 Endpoints Disponibles

### 1. Login

**POST** `/api/auth/login`

Autentica un usuario con email y contraseña.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
  }
}
```

### 2. Refresh Token

**POST** `/api/auth/refresh`

Renueva un access token usando un refresh token.

**Request Body:**

```json
{
  "refresh_token": "b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "nuevo_refresh_token_aqui"
  }
}
```

### 3. Logout

**POST** `/api/auth/logout`

Revoca un refresh token específico.

**Request Body:**

```json
{
  "refresh_token": "b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

### 4. Logout All

**POST** `/api/auth/logout-all`

Revoca todos los refresh tokens del usuario autenticado.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Logout de todos los dispositivos exitoso"
}
```

### 5. Obtener Perfil

**GET** `/api/auth/me`

Obtiene información del usuario autenticado.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Perfil obtenido exitosamente",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "admin",
    "email": "admin@zenda.com",
    "roleCode": "ADMIN",
    "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 6. Verificar Token

**POST** `/api/auth/verify`

Verifica si un token es válido.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "valid": true,
    "payload": {
      "sub": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "admin@zenda.com",
      "roleCode": "ADMIN",
      "shopId": "64f8a1b2c3d4e5f6a7b8c9d1"
    }
  }
}
```

### 7. Health Check

**GET** `/api/auth/health`

Verifica el estado del servicio de autenticación.

**Response:**

```json
{
  "success": true,
  "message": "Servicio de autenticación funcionando correctamente",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Middlewares de Autenticación

### authenticateToken

Middleware que verifica la validez del token JWT y agrega la información del usuario a la request.

```typescript
import { authenticateToken } from "./middlewares/auth.middleware";

router.get("/protected", authenticateToken, (req, res) => {
  // req.user contiene la información del usuario
  // req.tokenPayload contiene el payload del token
});
```

### requireRole

Middleware que verifica que el usuario tenga uno de los roles permitidos.

```typescript
import { requireRole } from "./middlewares/auth.middleware";

// Solo administradores
router.get("/admin-only", authenticateToken, requireRole("ADMIN"), handler);

// Administradores o administradores de tienda
router.get(
  "/shop-admin",
  authenticateToken,
  requireRole("ADMIN", "SHOPADMIN"),
  handler
);
```

### requireShop

Middleware que verifica que el usuario pertenezca a la tienda especificada.

```typescript
import { requireShop } from "./middlewares/auth.middleware";

router.get(
  "/shop/:shopId/data",
  authenticateToken,
  requireShop("shopId"),
  handler
);
```

## 👥 Roles del Sistema

- **ADMIN**: Administrador del sistema (acceso completo)
- **SHOPADMIN**: Administrador de tienda (acceso a su tienda)
- **SHOPUSER**: Usuario de tienda (acceso limitado a su tienda)
- **CUSTOMER**: Cliente (acceso básico)

## ⚙️ Configuración

### Variables de Entorno

```env
# Configuración de seguridad y autenticación
JWT_SECRET=tu-secreto-super-seguro-para-jwt
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Usuario Administrador por Defecto

En modo desarrollo, se crea automáticamente un usuario administrador:

- **Email**: admin@zenda.com
- **Contraseña**: admin123
- **Rol**: ADMIN

## 🛡️ Características de Seguridad

1. **Tokens JWT firmados** con secreto configurable
2. **Refresh tokens rotativos** (se genera uno nuevo en cada refresh)
3. **Revocación de tokens** individual y masiva
4. **Limpieza automática** de tokens expirados
5. **Validación de roles** y permisos
6. **Auditoría** con IP y User-Agent
7. **Contraseñas hasheadas** con bcrypt

## 📝 Ejemplos de Uso

### Flujo Completo de Autenticación

```javascript
// 1. Login
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@zenda.com",
    password: "admin123",
  }),
});

const {
  data: { access_token, refresh_token },
} = await loginResponse.json();

// 2. Usar access token en requests
const protectedResponse = await fetch("/api/auth/me", {
  headers: { Authorization: `Bearer ${access_token}` },
});

// 3. Cuando el access token expire, usar refresh token
const refreshResponse = await fetch("/api/auth/refresh", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ refresh_token }),
});

// 4. Logout
await fetch("/api/auth/logout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ refresh_token }),
});
```

## 🔧 Mantenimiento

### Limpieza de Tokens Expirados

El servicio incluye un método para limpiar tokens expirados:

```typescript
import authService from "./services/auth.service";

// Limpiar tokens expirados
const deletedCount = await authService.cleanExpiredTokens();
console.log(`Se eliminaron ${deletedCount} tokens expirados`);
```

### Verificación de Roles

```typescript
import { verifyRoles } from "./utils/init-roles";

// Verificar que todos los roles estén configurados
const rolesOk = await verifyRoles();
if (!rolesOk) {
  console.log("Algunos roles no están configurados correctamente");
}
```

## 🚨 Manejo de Errores

La API devuelve errores estructurados:

```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "statusCode": 401
}
```

Códigos de estado comunes:

- **400**: Bad Request (datos inválidos)
- **401**: Unauthorized (token inválido/expirado)
- **403**: Forbidden (permisos insuficientes)
- **404**: Not Found (recurso no encontrado)
- **409**: Conflict (recurso duplicado)
- **500**: Internal Server Error
