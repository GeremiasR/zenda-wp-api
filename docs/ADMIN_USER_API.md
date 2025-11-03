# API de Administración de Usuarios

## Información General

**Base URL**: `/api/admin/users`

**Autenticación**: Todas las rutas requieren:

- Header `Authorization: Bearer {token}`
- Rol de usuario: `ADMIN`

---

## Endpoints

### 1. Listar Usuarios

**GET** `/api/admin/users`

Obtiene un listado paginado de usuarios con filtros opcionales.

#### Query Parameters (Opcionales)

| Parámetro  | Tipo   | Descripción                                            | Default |
| ---------- | ------ | ------------------------------------------------------ | ------- |
| `page`     | number | Número de página                                       | 1       |
| `limit`    | number | Cantidad de resultados por página                      | 10      |
| `isActive` | string | Filtrar por estado ("true" o "false")                  | -       |
| `roleCode` | string | Filtrar por rol (ADMIN, SHOPADMIN, SHOPUSER, CUSTOMER) | -       |
| `shopId`   | string | Filtrar por ID de tienda (MongoDB ObjectId)            | -       |
| `search`   | string | Búsqueda por username o email (case insensitive)       | -       |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Usuarios obtenidos exitosamente",
  "data": {
    "users": [
      {
        "_id": "string",
        "username": "string",
        "email": "string",
        "shopId": {
          "_id": "string",
          "name": "string",
          "internalName": "string"
        },
        "roleCode": "string",
        "isActive": boolean,
        "createdAt": "ISO Date string",
        "updatedAt": "ISO Date string"
      }
    ],
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "pages": number
    }
  }
}
```

**Nota**: El campo `password` nunca se incluye en las respuestas. El campo `shopId` se devuelve poblado con los datos básicos de la tienda.

---

### 2. Crear Usuario

**POST** `/api/admin/users`

Crea un nuevo usuario en el sistema.

#### Body (application/json)

| Campo      | Tipo    | Requerido | Descripción                                            |
| ---------- | ------- | --------- | ------------------------------------------------------ |
| `username` | string  | ✅        | Nombre de usuario único                                |
| `email`    | string  | ✅        | Correo electrónico único                               |
| `password` | string  | ✅        | Contraseña (mínimo 6 caracteres)                       |
| `shopId`   | string  | ✅        | ID de la tienda asociada (MongoDB ObjectId)            |
| `roleCode` | string  | ✅        | Rol del usuario (ADMIN, SHOPADMIN, SHOPUSER, CUSTOMER) |
| `isActive` | boolean | ❌        | Estado del usuario (default: true)                     |

#### Validaciones

- Todos los campos requeridos deben estar presentes
- `email` debe tener formato válido (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- `username` debe ser único en el sistema
- `email` debe ser único en el sistema
- `shopId` debe corresponder a una tienda existente
- `password` debe tener al menos 6 caracteres
- `roleCode` debe ser uno de: ADMIN, SHOPADMIN, SHOPUSER, CUSTOMER
- La contraseña se encripta automáticamente antes de almacenarse

#### Respuesta Exitosa (201)

```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "shopId": {
      "_id": "string",
      "name": "string",
      "internalName": "string"
    },
    "roleCode": "string",
    "isActive": boolean,
    "createdAt": "ISO Date string",
    "updatedAt": "ISO Date string"
  }
}
```

#### Errores Posibles

- **400**: Todos los campos son requeridos
- **400**: Formato de email inválido
- **400**: Tienda no encontrada
- **409**: Ya existe un usuario con ese email o username

---

### 3. Obtener Usuario por ID

**GET** `/api/admin/users/:id`

Obtiene los detalles de un usuario específico.

#### URL Parameters

| Parámetro | Tipo   | Descripción                       |
| --------- | ------ | --------------------------------- |
| `id`      | string | ID del usuario (MongoDB ObjectId) |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Usuario obtenido exitosamente",
  "data": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "shopId": {
      "_id": "string",
      "name": "string",
      "internalName": "string"
    },
    "roleCode": "string",
    "isActive": boolean,
    "createdAt": "ISO Date string",
    "updatedAt": "ISO Date string"
  }
}
```

#### Errores Posibles

- **404**: Usuario no encontrado

---

### 4. Actualizar Usuario

**PUT** `/api/admin/users/:id`

Actualiza los datos de un usuario existente.

#### URL Parameters

| Parámetro | Tipo   | Descripción                       |
| --------- | ------ | --------------------------------- |
| `id`      | string | ID del usuario (MongoDB ObjectId) |

#### Body (application/json)

| Campo      | Tipo    | Requerido | Descripción                                            |
| ---------- | ------- | --------- | ------------------------------------------------------ |
| `username` | string  | ❌        | Nombre de usuario único                                |
| `email`    | string  | ❌        | Correo electrónico único                               |
| `shopId`   | string  | ❌        | ID de la tienda asociada (MongoDB ObjectId)            |
| `roleCode` | string  | ❌        | Rol del usuario (ADMIN, SHOPADMIN, SHOPUSER, CUSTOMER) |
| `isActive` | boolean | ❌        | Estado del usuario                                     |

**Nota**: Todos los campos son opcionales, solo se actualizan los campos enviados. No es posible actualizar la contraseña desde este endpoint.

#### Validaciones

- Si se envía `email`, debe ser único (no puede existir en otro usuario)
- Si se envía `username`, debe ser único (no puede existir en otro usuario)
- Si se envía `shopId`, debe corresponder a una tienda existente
- `roleCode` debe ser uno de: ADMIN, SHOPADMIN, SHOPUSER, CUSTOMER

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "shopId": {
      "_id": "string",
      "name": "string",
      "internalName": "string"
    },
    "roleCode": "string",
    "isActive": boolean,
    "createdAt": "ISO Date string",
    "updatedAt": "ISO Date string"
  }
}
```

#### Errores Posibles

- **404**: Usuario no encontrado
- **400**: Tienda no encontrada (si se envía shopId)
- **409**: Ya existe un usuario con ese email
- **409**: Ya existe un usuario con ese username

---

### 5. Cambiar Estado de Usuario

**PATCH** `/api/admin/users/:id/toggle-status`

Activa o desactiva un usuario.

#### URL Parameters

| Parámetro | Tipo   | Descripción                       |
| --------- | ------ | --------------------------------- |
| `id`      | string | ID del usuario (MongoDB ObjectId) |

#### Body (application/json)

| Campo      | Tipo    | Requerido | Descripción              |
| ---------- | ------- | --------- | ------------------------ |
| `isActive` | boolean | ✅        | Nuevo estado del usuario |

#### Validaciones

- `isActive` es obligatorio y debe ser un valor booleano

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Usuario activado exitosamente",
  "data": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "shopId": {
      "_id": "string",
      "name": "string",
      "internalName": "string"
    },
    "roleCode": "string",
    "isActive": boolean,
    "createdAt": "ISO Date string",
    "updatedAt": "ISO Date string"
  }
}
```

**Nota**: El mensaje cambia según el estado: "Usuario activado exitosamente" o "Usuario desactivado exitosamente"

#### Errores Posibles

- **400**: isActive debe ser un valor booleano
- **404**: Usuario no encontrado

---

## Modelo de Datos: User

### Propiedades

| Campo       | Tipo    | Descripción                                      |
| ----------- | ------- | ------------------------------------------------ |
| `_id`       | string  | ID único del usuario (MongoDB ObjectId)          |
| `username`  | string  | Nombre de usuario único                          |
| `email`     | string  | Correo electrónico único (lowercase)             |
| `shopId`    | object  | Referencia a la tienda asociada                  |
| `password`  | string  | Contraseña encriptada (nunca se devuelve en API) |
| `roleCode`  | string  | Rol del usuario                                  |
| `isActive`  | boolean | Estado del usuario                               |
| `createdAt` | string  | Fecha de creación (ISO Date string)              |
| `updatedAt` | string  | Fecha de última actualización (ISO Date string)  |

### Roles Disponibles

| Código      | Descripción               |
| ----------- | ------------------------- |
| `ADMIN`     | Administrador del sistema |
| `SHOPADMIN` | Administrador de tienda   |
| `SHOPUSER`  | Usuario de tienda         |
| `CUSTOMER`  | Cliente (rol por defecto) |

### Restricciones

- `username`: requerido, único, no puede estar vacío
- `email`: requerido, único, formato válido, se convierte a minúsculas automáticamente
- `password`: requerido, mínimo 6 caracteres, se encripta automáticamente con bcrypt
- `shopId`: requerido, debe ser un ObjectId válido de una tienda existente
- `roleCode`: requerido, debe ser uno de los valores del enum
- `isActive`: default true

---

## Códigos de Respuesta HTTP

| Código | Descripción                               |
| ------ | ----------------------------------------- |
| 200    | Operación exitosa                         |
| 201    | Recurso creado exitosamente               |
| 400    | Solicitud inválida (validación fallida)   |
| 401    | No autenticado (token inválido o ausente) |
| 403    | No autorizado (sin permisos de ADMIN)     |
| 404    | Recurso no encontrado                     |
| 409    | Conflicto (recurso duplicado)             |
| 500    | Error interno del servidor                |

---

## Manejo de Errores

Todas las respuestas de error siguen el formato estándar de Boom:

```json
{
  "statusCode": number,
  "error": "string",
  "message": "string"
}
```

---

## Notas para Implementación Frontend

1. **Autenticación**: Incluir siempre el token en el header `Authorization: Bearer {token}`
2. **Seguridad**: La contraseña nunca se devuelve en las respuestas de la API
3. **Paginación**: Por defecto trae 10 resultados. Ajustar `limit` según necesidades de UI
4. **Búsqueda**: El parámetro `search` busca tanto en `username` como en `email` de forma case-insensitive
5. **Filtros Combinados**: Se pueden combinar múltiples filtros (isActive, roleCode, shopId, search) en la misma petición
6. **Estado**: Los usuarios inactivos (`isActive: false`) no deberían poder autenticarse en el sistema
7. **Actualización Parcial**: En PUT, solo enviar los campos que se desean actualizar
8. **Contraseña**: No es posible actualizar la contraseña desde estos endpoints (debe existir un endpoint específico para cambio de contraseña)
9. **Validación de IDs**: Todos los IDs son MongoDB ObjectIds (formato: 24 caracteres hexadecimales)
10. **Relación con Tienda**: Cada usuario debe estar asociado a una tienda. Asegurarse de que el `shopId` sea válido al crear o actualizar
11. **Email Format**: El email se valida tanto en el frontend como en el backend y se convierte automáticamente a minúsculas
12. **Población de Datos**: El campo `shopId` se devuelve poblado con `name` e `internalName` de la tienda para facilitar la visualización
