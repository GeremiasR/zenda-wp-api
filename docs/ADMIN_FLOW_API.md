# API de Administración de Flujos

Esta documentación describe la API para la gestión administrativa de flujos de conversación de WhatsApp.

## Autenticación

Todas las rutas requieren:

- Token JWT válido en el header `Authorization: Bearer <token>`
- Rol de **Administrador** (ADMIN)

---

## Endpoints

### 1. Listar Flujos

**GET** `/api/admin/flows`

Obtiene una lista paginada de flujos con filtros opcionales.

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

| Parámetro | Tipo    | Requerido | Descripción                        |
| --------- | ------- | --------- | ---------------------------------- |
| page      | number  | No        | Número de página (default: 1)      |
| limit     | number  | No        | Elementos por página (default: 10) |
| isActive  | boolean | No        | Filtrar por estado activo/inactivo |
| shopId    | string  | No        | Filtrar por ID de tienda           |
| search    | string  | No        | Buscar en nombre y descripción     |

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Flujos obtenidos exitosamente",
  "data": {
    "flows": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "Flujo de Bienvenida",
        "description": "Flujo para dar bienvenida a nuevos clientes",
        "shopId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Mi Tienda",
          "internalName": "mi-tienda"
        },
        "initialState": "welcome",
        "states": {
          "welcome": {
            "message": "¡Bienvenido!",
            "options": []
          }
        },
        "isActive": true,
        "isDeleted": false,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
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

---

### 2. Crear Flujo

**POST** `/api/admin/flows`

Crea un nuevo flujo de conversación.

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**

```json
{
  "name": "Flujo de Bienvenida",
  "description": "Flujo para dar bienvenida a nuevos clientes",
  "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "initialState": "welcome",
  "states": {
    "welcome": {
      "message": "¡Bienvenido! ¿En qué puedo ayudarte?",
      "options": [
        {
          "input": ["1", "productos", "ver productos"],
          "event": "view_products",
          "next": "products"
        },
        {
          "input": ["2", "soporte", "ayuda"],
          "event": "contact_support",
          "next": "support"
        }
      ]
    },
    "products": {
      "message": "Estos son nuestros productos disponibles...",
      "options": []
    },
    "support": {
      "message": "Te contactamos pronto con un asesor",
      "options": []
    }
  },
  "isActive": true
}
```

**Parámetros:**

| Campo        | Tipo    | Requerido | Descripción                                        |
| ------------ | ------- | --------- | -------------------------------------------------- |
| name         | string  | Sí        | Nombre del flujo                                   |
| description  | string  | No        | Descripción del flujo                              |
| shopId       | string  | Sí        | ID de la tienda asociada                           |
| initialState | string  | Sí        | Nombre del estado inicial (debe existir en states) |
| states       | object  | Sí        | Objeto con los estados del flujo                   |
| isActive     | boolean | No        | Estado activo/inactivo (default: true)             |

**Validaciones:**

- La tienda debe existir en la base de datos
- El `initialState` debe existir como clave en el objeto `states`
- Cada opción en los states debe tener `input` (array), `event` (string) y `next` (string)

**Respuesta exitosa (201):**

```json
{
  "success": true,
  "message": "Flujo creado exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Flujo de Bienvenida",
    "description": "Flujo para dar bienvenida a nuevos clientes",
    "shopId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Mi Tienda",
      "internalName": "mi-tienda"
    },
    "initialState": "welcome",
    "states": {
      /* ... */
    },
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 3. Obtener Flujo por ID

**GET** `/api/admin/flows/:id`

Obtiene los detalles completos de un flujo específico.

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Parámetros de URL:**

| Parámetro | Tipo   | Descripción  |
| --------- | ------ | ------------ |
| id        | string | ID del flujo |

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Flujo obtenido exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Flujo de Bienvenida",
    "description": "Flujo para dar bienvenida a nuevos clientes",
    "shopId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Mi Tienda",
      "internalName": "mi-tienda"
    },
    "initialState": "welcome",
    "states": {
      /* ... */
    },
    "isActive": true,
    "isDeleted": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 4. Actualizar Flujo

**PUT** `/api/admin/flows/:id`

Actualiza un flujo existente. Solo se actualizan los campos proporcionados.

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parámetros de URL:**

| Parámetro | Tipo   | Descripción  |
| --------- | ------ | ------------ |
| id        | string | ID del flujo |

**Body:**

```json
{
  "name": "Flujo de Bienvenida Actualizado",
  "description": "Nueva descripción",
  "shopId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "initialState": "welcome",
  "states": {
    "welcome": {
      "message": "¡Bienvenido! Mensaje actualizado",
      "options": []
    }
  },
  "isActive": true
}
```

**Parámetros:**

Todos los campos son opcionales. Solo se actualizarán los campos proporcionados.

| Campo        | Tipo    | Descripción                      |
| ------------ | ------- | -------------------------------- |
| name         | string  | Nombre del flujo                 |
| description  | string  | Descripción del flujo            |
| shopId       | string  | ID de la tienda asociada         |
| initialState | string  | Nombre del estado inicial        |
| states       | object  | Objeto con los estados del flujo |
| isActive     | boolean | Estado activo/inactivo           |

**Validaciones:**

- Si se proporciona `shopId` diferente al actual, la tienda debe existir
- Si se proporcionan `initialState` y `states`, el initialState debe existir en states
- Las opciones deben seguir la estructura correcta: `input` (array), `event` (string), `next` (string)

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Flujo actualizado exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Flujo de Bienvenida Actualizado",
    "description": "Nueva descripción"
    /* ... campos actualizados ... */
  }
}
```

---

### 5. Cambiar Estado del Flujo

**PATCH** `/api/admin/flows/:id/toggle-status`

Activa o desactiva un flujo.

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parámetros de URL:**

| Parámetro | Tipo   | Descripción  |
| --------- | ------ | ------------ |
| id        | string | ID del flujo |

**Body:**

```json
{
  "isActive": false
}
```

**Parámetros:**

| Campo    | Tipo    | Requerido | Descripción                              |
| -------- | ------- | --------- | ---------------------------------------- |
| isActive | boolean | Sí        | true para activar, false para desactivar |

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Flujo desactivado exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Flujo de Bienvenida",
    "isActive": false
    /* ... resto de campos ... */
  }
}
```

---

### 6. Eliminar Flujo (Soft Delete)

**DELETE** `/api/admin/flows/:id`

Marca un flujo como eliminado (soft delete). El flujo no se borra físicamente de la base de datos.

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Parámetros de URL:**

| Parámetro | Tipo   | Descripción  |
| --------- | ------ | ------------ |
| id        | string | ID del flujo |

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Flujo eliminado exitosamente"
}
```

**Nota:** El flujo se marca con `isDeleted: true` y ya no aparecerá en las consultas normales.

---

### 7. Eliminar Flujo Permanentemente

**DELETE** `/api/admin/flows/:id/hard`

Elimina permanentemente un flujo de la base de datos. Esta acción es irreversible.

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Parámetros de URL:**

| Parámetro | Tipo   | Descripción  |
| --------- | ------ | ------------ |
| id        | string | ID del flujo |

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Flujo eliminado permanentemente"
}
```

**⚠️ Advertencia:** Esta acción elimina el flujo completamente de la base de datos y no se puede deshacer.

---

## Códigos de Error

### 400 Bad Request

**Campos requeridos faltantes:**

```json
{
  "success": false,
  "message": "Nombre, shopId, initialState y states son requeridos"
}
```

**Tienda no encontrada:**

```json
{
  "success": false,
  "message": "Tienda no encontrada"
}
```

**Estado inicial no existe:**

```json
{
  "success": false,
  "message": "El estado inicial debe existir en los estados del flujo"
}
```

**isActive no es booleano:**

```json
{
  "success": false,
  "message": "isActive debe ser un valor booleano"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Token de autenticación inválido"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Se requieren permisos de administrador"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Flujo no encontrado"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Descripción del error"
}
```

---

## Estructura de Estados (States)

Los estados del flujo siguen esta estructura:

```json
{
  "nombre_del_estado": {
    "message": "Mensaje a enviar al usuario",
    "options": [
      {
        "input": ["palabra1", "palabra2", "frase completa"],
        "event": "nombre_del_evento",
        "next": "siguiente_estado"
      }
    ]
  }
}
```

**Campos de un Estado:**

| Campo   | Tipo   | Descripción                                  |
| ------- | ------ | -------------------------------------------- |
| message | string | Mensaje que se envía al usuario              |
| options | array  | Array de opciones para navegar entre estados |

**Campos de una Opción:**

| Campo | Tipo   | Descripción                                             |
| ----- | ------ | ------------------------------------------------------- |
| input | array  | Array de strings que el usuario puede escribir          |
| event | string | Nombre del evento que se dispara con esta opción        |
| next  | string | Nombre del siguiente estado al que se debe transicionar |

**Ejemplo completo:**

```json
{
  "welcome": {
    "message": "¡Bienvenido! ¿En qué puedo ayudarte?\n1. Ver productos\n2. Contactar soporte",
    "options": [
      {
        "input": ["1", "productos", "ver productos", "producto"],
        "event": "view_products",
        "next": "products"
      },
      {
        "input": ["2", "soporte", "ayuda", "contactar"],
        "event": "contact_support",
        "next": "support"
      }
    ]
  },
  "products": {
    "message": "Tenemos los siguientes productos disponibles: ...",
    "options": [
      {
        "input": ["volver", "menú", "inicio"],
        "event": "back_to_menu",
        "next": "welcome"
      }
    ]
  },
  "support": {
    "message": "Un asesor te contactará pronto.",
    "options": []
  }
}
```

---

## Filtros de Búsqueda

El parámetro `search` busca coincidencias (case-insensitive) en:

- Nombre del flujo (`name`)
- Descripción (`description`)

---

## Paginación

La respuesta paginada incluye:

| Campo | Descripción          |
| ----- | -------------------- |
| page  | Página actual        |
| limit | Elementos por página |
| total | Total de elementos   |
| pages | Total de páginas     |

---

## Notas Importantes

1. **Soft Delete vs Hard Delete:**

   - El soft delete (`DELETE /:id`) marca el flujo como eliminado pero lo mantiene en la BD
   - El hard delete (`DELETE /:id/hard`) elimina el flujo permanentemente
   - Los flujos con soft delete no aparecen en consultas normales

2. **Validación de Initial State:**

   - El `initialState` debe corresponder a una clave existente en el objeto `states`
   - Esto asegura que el flujo siempre tenga un punto de inicio válido

3. **Relación con Shops:**

   - Cada flujo debe estar asociado a una tienda válida
   - La tienda se puebla automáticamente en las respuestas

4. **Estado Activo/Inactivo:**
   - Los flujos inactivos se mantienen en la BD pero pueden ser ignorados por el sistema
   - Útil para pausar temporalmente un flujo sin eliminarlo
