# API de Administración de Tiendas

## Información General

**Base URL**: `/api/admin/shops`

**Autenticación**: Todas las rutas requieren:

- Header `Authorization: Bearer {token}`
- Rol de usuario: `ADMIN`

---

## Endpoints

### 1. Listar Tiendas

**GET** `/api/admin/shops`

Obtiene un listado paginado de tiendas con filtros opcionales.

#### Query Parameters (Opcionales)

| Parámetro  | Tipo   | Descripción                                           | Default |
| ---------- | ------ | ----------------------------------------------------- | ------- |
| `page`     | number | Número de página                                      | 1       |
| `limit`    | number | Cantidad de resultados por página                     | 10      |
| `isActive` | string | Filtrar por estado ("true" o "false")                 | -       |
| `search`   | string | Búsqueda por nombre o internalName (case insensitive) | -       |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Tiendas obtenidas exitosamente",
  "data": {
    "shops": [
      {
        "_id": "string",
        "name": "string",
        "internalName": "string",
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

---

### 2. Crear Tienda

**POST** `/api/admin/shops`

Crea una nueva tienda.

#### Body (application/json)

| Campo          | Tipo    | Requerido | Descripción                         |
| -------------- | ------- | --------- | ----------------------------------- |
| `name`         | string  | ✅        | Nombre de la tienda                 |
| `internalName` | string  | ✅        | Nombre interno único de la tienda   |
| `isActive`     | boolean | ❌        | Estado de la tienda (default: true) |

#### Validaciones

- `name` y `internalName` son obligatorios
- `internalName` debe ser único en el sistema
- Los espacios en blanco al inicio y final se eliminan automáticamente (trim)

#### Respuesta Exitosa (201)

```json
{
  "success": true,
  "message": "Tienda creada exitosamente",
  "data": {
    "_id": "string",
    "name": "string",
    "internalName": "string",
    "isActive": boolean,
    "createdAt": "ISO Date string",
    "updatedAt": "ISO Date string"
  }
}
```

#### Errores Posibles

- **400**: Nombre e internalName son requeridos
- **409**: Ya existe una tienda con ese internalName

---

### 3. Obtener Tienda por ID

**GET** `/api/admin/shops/:id`

Obtiene los detalles de una tienda específica.

#### URL Parameters

| Parámetro | Tipo   | Descripción                        |
| --------- | ------ | ---------------------------------- |
| `id`      | string | ID de la tienda (MongoDB ObjectId) |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Tienda obtenida exitosamente",
  "data": {
    "_id": "string",
    "name": "string",
    "internalName": "string",
    "isActive": boolean,
    "createdAt": "ISO Date string",
    "updatedAt": "ISO Date string"
  }
}
```

#### Errores Posibles

- **404**: Tienda no encontrada

---

### 4. Actualizar Tienda

**PUT** `/api/admin/shops/:id`

Actualiza los datos de una tienda existente.

#### URL Parameters

| Parámetro | Tipo   | Descripción                        |
| --------- | ------ | ---------------------------------- |
| `id`      | string | ID de la tienda (MongoDB ObjectId) |

#### Body (application/json)

| Campo          | Tipo    | Requerido | Descripción                       |
| -------------- | ------- | --------- | --------------------------------- |
| `name`         | string  | ❌        | Nombre de la tienda               |
| `internalName` | string  | ❌        | Nombre interno único de la tienda |
| `isActive`     | boolean | ❌        | Estado de la tienda               |

**Nota**: Todos los campos son opcionales, solo se actualizan los campos enviados.

#### Validaciones

- Si se envía `internalName`, debe ser único (no puede existir en otra tienda)
- Los espacios en blanco al inicio y final se eliminan automáticamente (trim)

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Tienda actualizada exitosamente",
  "data": {
    "_id": "string",
    "name": "string",
    "internalName": "string",
    "isActive": boolean,
    "createdAt": "ISO Date string",
    "updatedAt": "ISO Date string"
  }
}
```

#### Errores Posibles

- **404**: Tienda no encontrada
- **409**: Ya existe una tienda con ese internalName

---

### 5. Cambiar Estado de Tienda

**PATCH** `/api/admin/shops/:id/toggle-status`

Activa o desactiva una tienda.

#### URL Parameters

| Parámetro | Tipo   | Descripción                        |
| --------- | ------ | ---------------------------------- |
| `id`      | string | ID de la tienda (MongoDB ObjectId) |

#### Body (application/json)

| Campo      | Tipo    | Requerido | Descripción               |
| ---------- | ------- | --------- | ------------------------- |
| `isActive` | boolean | ✅        | Nuevo estado de la tienda |

#### Validaciones

- `isActive` es obligatorio y debe ser un valor booleano

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Tienda activada exitosamente",
  "data": {
    "_id": "string",
    "name": "string",
    "internalName": "string",
    "isActive": boolean,
    "createdAt": "ISO Date string",
    "updatedAt": "ISO Date string"
  }
}
```

**Nota**: El mensaje cambia según el estado: "Tienda activada exitosamente" o "Tienda desactivada exitosamente"

#### Errores Posibles

- **400**: isActive debe ser un valor booleano
- **404**: Tienda no encontrada

---

### 6. Eliminar Tienda

**DELETE** `/api/admin/shops/:id`

Elimina permanentemente una tienda del sistema.

#### URL Parameters

| Parámetro | Tipo   | Descripción                        |
| --------- | ------ | ---------------------------------- |
| `id`      | string | ID de la tienda (MongoDB ObjectId) |

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Tienda eliminada exitosamente"
}
```

#### Errores Posibles

- **404**: Tienda no encontrada

---

## Modelo de Datos: Shop

### Propiedades

| Campo          | Tipo    | Descripción                                     |
| -------------- | ------- | ----------------------------------------------- |
| `_id`          | string  | ID único de la tienda (MongoDB ObjectId)        |
| `name`         | string  | Nombre de la tienda                             |
| `internalName` | string  | Nombre interno único de la tienda               |
| `isActive`     | boolean | Estado de la tienda                             |
| `createdAt`    | string  | Fecha de creación (ISO Date string)             |
| `updatedAt`    | string  | Fecha de última actualización (ISO Date string) |

### Restricciones

- `name`: requerido, no puede estar vacío
- `internalName`: requerido, único, no puede estar vacío
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
2. **Paginación**: Por defecto trae 10 resultados. Ajustar `limit` según necesidades de UI
3. **Búsqueda**: El parámetro `search` busca tanto en `name` como en `internalName` de forma case-insensitive
4. **Estado**: Las tiendas inactivas (`isActive: false`) no deberían ser usables pero siguen existiendo en el sistema
5. **Eliminación**: La eliminación es permanente, no hay soft delete
6. **Actualización Parcial**: En PUT, solo enviar los campos que se desean actualizar
7. **Validación de IDs**: Todos los IDs son MongoDB ObjectIds (formato: 24 caracteres hexadecimales)
