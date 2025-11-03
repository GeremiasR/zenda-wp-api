# Módulo de Roles - Documentación API

## Descripción General

El módulo de roles permite gestionar los roles del sistema con sus permisos asociados. Cada rol define un conjunto de módulos y acciones que los usuarios con ese rol pueden realizar.

El sistema utiliza un modelo RBAC (Role-Based Access Control) extendido donde los usuarios tienen roles asignados, y cada rol define permisos específicos sobre módulos del sistema. Los permisos se consolidan automáticamente cuando un usuario tiene múltiples roles.

## Base URL

Todas las rutas del módulo de roles están bajo:

```
/api/admin/roles
```

## Autenticación

Todas las rutas requieren autenticación mediante el header:

```
Authorization: Bearer <access_token>
```

## Permisos Requeridos

Las rutas requieren permisos específicos del módulo `role`:

- `role.view` - Para listar y obtener roles
- `role.create` - Para crear roles
- `role.update` - Para actualizar roles
- `role.delete` - Para eliminar roles

## Estructura de Datos

### Rol

```json
{
  "_id": "string",
  "code": "string",           // Código único del rol (en mayúsculas)
  "label": "string",           // Etiqueta/descripción del rol
  "modules": [                 // Array de módulos con sus acciones
    {
      "name": "string",        // Nombre del módulo (ej: "user", "shop")
      "actions": ["string"]    // Array de acciones permitidas (ej: ["view", "create"])
    }
  ],
  "isActive": boolean,         // Estado del rol
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Módulos del Sistema

Los módulos disponibles en el sistema son:

- `user` - Gestión de usuarios
- `role` - Gestión de roles
- `shop` - Gestión de tiendas
- `flow` - Gestión de flujos
- `orders` - Gestión de pedidos
- `transactions` - Gestión de transacciones
- `whatsapp` - Gestión de WhatsApp

### Acciones Disponibles

Las acciones estándar disponibles son:

- `view` - Ver/listar recursos
- `create` - Crear nuevos recursos
- `update` - Actualizar recursos existentes
- `delete` - Eliminar recursos
- `manage` - Acceso completo (equivalente a todas las acciones)

### Roles por Defecto

El sistema incluye los siguientes roles por defecto:

**ADMIN** - Administrador

- Acceso completo a todos los módulos con todas las acciones

**SHOPADMIN** - Administrador de Tienda

- Permisos limitados de gestión de usuarios, tiendas, flujos, pedidos, transacciones y WhatsApp

**SHOPUSER** - Usuario de Tienda

- Permisos de visualización y operaciones básicas sobre pedidos, transacciones y WhatsApp

**CUSTOMER** - Cliente

- Permisos de solo lectura sobre pedidos y transacciones

## Endpoints

### 1. Listar Roles

Obtiene todos los roles del sistema.

**Endpoint:** `GET /api/admin/roles`

**Permisos:** `role.view`

**Query Parameters:**

- `includeInactive` (opcional, boolean): Si es `true`, incluye roles inactivos. Por defecto `false`.

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "message": "Roles obtenidos exitosamente",
  "data": [
    {
      "_id": "...",
      "code": "ADMIN",
      "label": "Administrador",
      "modules": [...],
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### 2. Obtener Rol por ID

Obtiene un rol específico por su ID.

**Endpoint:** `GET /api/admin/roles/:id`

**Permisos:** `role.view`

**Parámetros de URL:**

- `id` (required, string): ID del rol

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "message": "Rol obtenido exitosamente",
  "data": {
    "_id": "...",
    "code": "ADMIN",
    "label": "Administrador",
    "modules": [...],
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errores:**

- `404` - Rol no encontrado

### 3. Crear Rol

Crea un nuevo rol en el sistema.

**Endpoint:** `POST /api/admin/roles`

**Permisos:** `role.create`

**Body:**

```json
{
  "code": "string",           // Requerido. Código único del rol (se convierte a mayúsculas)
  "label": "string",           // Requerido. Etiqueta del rol
  "modules": [                 // Opcional. Array de módulos (por defecto [])
    {
      "name": "string",        // Requerido. Nombre del módulo
      "actions": ["string"]    // Requerido. Array de acciones (mínimo 1)
    }
  ],
  "isActive": boolean          // Opcional. Estado del rol (por defecto true)
}
```

**Validaciones:**

- `code` y `label` son requeridos
- El `code` debe ser único en el sistema
- Cada módulo debe tener al menos una acción
- Los nombres de módulos y acciones deben ser strings válidos

**Respuesta Exitosa (201):**

```json
{
  "success": true,
  "message": "Rol creado exitosamente",
  "data": {
    "_id": "...",
    "code": "MANAGER",
    "label": "Gerente",
    "modules": [...],
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errores:**

- `400` - Datos de entrada inválidos (campos requeridos faltantes, estructura incorrecta de módulos)
- `409` - Ya existe un rol con ese código

### 4. Actualizar Rol

Actualiza un rol existente.

**Endpoint:** `PUT /api/admin/roles/:id`

**Permisos:** `role.update`

**Parámetros de URL:**

- `id` (required, string): ID del rol

**Body:**

```json
{
  "label": "string",           // Opcional. Nueva etiqueta
  "modules": [                 // Opcional. Nuevos módulos y acciones
    {
      "name": "string",
      "actions": ["string"]
    }
  ],
  "isActive": boolean          // Opcional. Nuevo estado
}
```

**Nota:** El campo `code` no se puede actualizar después de crear el rol.

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "message": "Rol actualizado exitosamente",
  "data": {
    "_id": "...",
    "code": "MANAGER",
    "label": "Gerente Actualizado",
    "modules": [...],
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errores:**

- `400` - Datos de entrada inválidos
- `404` - Rol no encontrado

### 5. Eliminar Rol

Elimina un rol (soft delete - marca como inactivo).

**Endpoint:** `DELETE /api/admin/roles/:id`

**Permisos:** `role.delete`

**Parámetros de URL:**

- `id` (required, string): ID del rol

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "message": "Rol eliminado exitosamente"
}
```

**Errores:**

- `404` - Rol no encontrado

**Nota:** Esta operación realiza un soft delete, marcando el rol como `isActive: false` en lugar de eliminarlo físicamente de la base de datos.

## Manejo de Errores

Todos los errores siguen el formato estándar:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Mensaje de error descriptivo"
}
```

**Códigos de Estado Comunes:**

- `200` - Operación exitosa
- `201` - Recurso creado exitosamente
- `400` - Solicitud inválida (datos faltantes o incorrectos)
- `401` - No autenticado (token faltante o inválido)
- `403` - Prohibido (sin permisos suficientes)
- `404` - Recurso no encontrado
- `409` - Conflicto (recurso duplicado)
- `500` - Error interno del servidor

## Autenticación y Permisos en el Frontend

### Obtener Roles y Permisos del Usuario

El sistema proporciona roles y permisos del usuario autenticado en dos endpoints principales:

#### 1. Login (`POST /auth/login`)

Al hacer login exitoso, la respuesta incluye información del usuario con sus roles y permisos:

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "abc123def456...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "usuario@example.com",
      "roles": ["ADMIN", "SHOPADMIN"],
      "permissions": {
        "user": ["view", "create", "update", "delete"],
        "shop": ["view", "update"],
        "role": ["view", "create"],
        "flow": ["view", "create", "update"],
        "orders": ["view", "create", "update", "delete"],
        "transactions": ["view"],
        "whatsapp": ["view", "create", "update"]
      },
      "shopId": "507f1f77bcf86cd799439012"
    }
  }
}
```

#### 2. Perfil del Usuario (`GET /auth/me`)

El endpoint `/auth/me` también incluye roles y permisos del usuario:

```json
{
  "success": true,
  "message": "Perfil obtenido exitosamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "username": "usuario123",
    "email": "usuario@example.com",
    "roles": ["ADMIN"],
    "permissions": {
      "user": ["view", "create", "update", "delete", "manage"],
      "role": ["view", "create", "update", "delete", "manage"],
      "shop": ["view", "create", "update", "delete", "manage"],
      "flow": ["view", "create", "update", "delete", "manage"],
      "orders": ["view", "create", "update", "delete", "manage"],
      "transactions": ["view", "create", "update", "delete", "manage"],
      "whatsapp": ["view", "create", "update", "delete", "manage"]
    },
    "shopId": "507f1f77bcf86cd799439012",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 3. Refresh Token (`POST /auth/refresh`)

Al renovar el token, también se retorna información actualizada del usuario:

```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "xyz789abc123...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "usuario@example.com",
      "roles": ["ADMIN"],
      "permissions": {
        "user": ["view", "create", "update", "delete", "manage"],
        "role": ["view", "create", "update", "delete", "manage"]
      },
      "shopId": "507f1f77bcf86cd799439012"
    }
  }
}
```

### Manejo de Rutas en el Frontend

El frontend debe usar los permisos del usuario para:

1. **Mostrar/Ocultar Módulos en el Menú:**

   - Verificar si el usuario tiene acceso a un módulo consultando si existe la clave del módulo en `permissions`
   - Solo mostrar módulos donde el usuario tenga al menos la acción `view`

2. **Control de Acceso a Rutas:**

   - Antes de navegar a una ruta, verificar si el usuario tiene el permiso necesario
   - Por ejemplo: para acceder a `/admin/users`, el usuario debe tener `user.view` en sus permisos

3. **Mostrar/Ocultar Botones de Acción:**
   - Mostrar botón "Crear" solo si tiene `create` en ese módulo
   - Mostrar botón "Editar" solo si tiene `update` en ese módulo
   - Mostrar botón "Eliminar" solo si tiene `delete` en ese módulo

### Ejemplos de Verificación de Permisos

#### Verificar Acceso a un Módulo

```javascript
// Verificar si el usuario puede ver el módulo de usuarios
const canViewUsers =
  user.permissions.user?.includes("view") ||
  user.permissions.user?.includes("manage");
```

#### Verificar Acceso a una Acción Específica

```javascript
// Verificar si el usuario puede crear roles
const canCreateRoles =
  user.permissions.role?.includes("create") ||
  user.permissions.role?.includes("manage");
```

#### Verificar Acceso Completo (manage)

```javascript
// Verificar si el usuario tiene acceso completo a un módulo
const hasFullAccess = user.permissions.user?.includes("manage");
```

### Estructura de Permisos

Los permisos están organizados como un objeto donde:

- **Clave**: Nombre del módulo (ej: `"user"`, `"shop"`, `"orders"`)
- **Valor**: Array de acciones permitidas (ej: `["view", "create", "update"]`)

**Acciones disponibles:**

- `view` - Ver/listar recursos del módulo
- `create` - Crear nuevos recursos
- `update` - Actualizar recursos existentes
- `delete` - Eliminar recursos
- `manage` - Acceso completo (incluye todas las acciones anteriores)

**Nota importante:** Si un usuario tiene `manage` en un módulo, tiene acceso a todas las acciones de ese módulo, independientemente de si tiene otras acciones específicas listadas.

### Consistencia de Datos

- Los permisos en la respuesta del login/refresh son los mismos que están en el JWT (decodificables)
- Los permisos se actualizan automáticamente en cada login/refresh
- Si un rol es modificado, los cambios se reflejarán en los usuarios la próxima vez que hagan login

## Notas de Implementación

1. **Códigos de Rol:** Los códigos se almacenan en mayúsculas automáticamente. El sistema convierte cualquier código a mayúsculas antes de guardarlo.

2. **Permisos Consolidados:** Cuando un usuario tiene múltiples roles, los permisos se consolidan automáticamente. Si un rol tiene acceso a un módulo con ciertas acciones y otro rol tiene acceso al mismo módulo con diferentes acciones, el usuario tendrá acceso a todas las acciones combinadas.

3. **Eliminación de Roles:** Al eliminar un rol, se realiza un soft delete (marca como inactivo). Los usuarios que tengan asignado ese rol seguirán funcionando, pero no se podrá asignar a nuevos usuarios hasta que el rol se reactive.

4. **Validación de Módulos:** Al crear o actualizar un rol, el sistema valida que cada módulo tenga al menos una acción. Si un módulo no tiene acciones, la operación fallará con un error 400.

5. **Cache de Permisos:** Los permisos de los usuarios se cachean en Redis al hacer login. Si se actualiza un rol, los cambios se reflejarán en los usuarios cuando vuelvan a iniciar sesión o cuando su token expire y se renueve.

6. **Orden de Módulos:** Los roles se listan ordenados por código de forma ascendente.

7. **Filtrado:** Por defecto, solo se muestran roles activos. Para incluir roles inactivos en la lista, se debe pasar el parámetro `includeInactive=true`.

8. **Optimización de Consultas Redis:** El sistema solo consulta Redis para acciones críticas (create, update, delete, manage). Para acciones de lectura (view), se usan los permisos del token directamente, optimizando el rendimiento.

9. **Actualización en Tiempo Real:** Los permisos en el token JWT siempre reflejan el estado actual de los roles del usuario. No es necesario decodificar el token manualmente, ya que los permisos están disponibles directamente en las respuestas de login y `/me`.
