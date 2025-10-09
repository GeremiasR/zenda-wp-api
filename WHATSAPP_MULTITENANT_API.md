# API de WhatsApp Multitenant

Esta documentación describe la API para la funcionalidad multitenant de WhatsApp, que permite a cada shop activar y gestionar su propia sesión de WhatsApp desde el Back Office.

## Autenticación

Todas las rutas requieren autenticación mediante JWT token en el header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Activar WhatsApp para un Shop

**POST** `/api/whatsapp-shop/activate`

Activa una sesión de WhatsApp para un shop específico.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "shopId": "shop_123",
  "flowId": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

**Parámetros:**

- `shopId` (string, requerido): ID único del shop
- `flowId` (string, requerido): ID del flujo de conversación a usar

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "QR generado exitosamente",
  "data": {
    "shopId": "shop_123",
    "flowId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "sessionId": "shop_123_64f8a1b2c3d4e5f6a7b8c9d0",
    "qr": "2@ABC123DEF456..."
  }
}
```

**Respuesta si ya está activo (200):**

```json
{
  "success": true,
  "message": "Sesión ya activa",
  "data": {
    "shopId": "shop_123",
    "sessionId": "shop_shop_123",
    "qr": "2@ABC123DEF456..."
  }
}
```

### 2. Obtener Estado de WhatsApp de un Shop

**GET** `/api/whatsapp-shop/:shopId/status`

Obtiene el estado actual de la sesión de WhatsApp de un shop.

**Headers:**

```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Estado obtenido exitosamente",
  "data": {
    "shopId": "shop_123",
    "isActive": true,
    "isConnected": true,
    "phoneNumber": "5491123456789@s.whatsapp.net",
    "lastConnection": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Obtener QR de un Shop

**GET** `/api/whatsapp-shop/:shopId/qr`

Obtiene el código QR actual para conectar WhatsApp (útil para polling).

**Headers:**

```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "QR obtenido",
  "data": {
    "shopId": "shop_123",
    "qr": "2@ABC123DEF456...",
    "isConnected": false
  }
}
```

### 4. Desactivar WhatsApp de un Shop

**POST** `/api/whatsapp-shop/:shopId/deactivate`

Desactiva la sesión de WhatsApp de un shop.

**Headers:**

```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "WhatsApp desactivado exitosamente",
  "data": {
    "shopId": "shop_123"
  }
}
```

### 5. Enviar Mensaje desde un Shop

**POST** `/api/whatsapp-shop/send`

Envía un mensaje de WhatsApp desde la sesión de un shop.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "shopId": "shop_123",
  "jid": "5491123456789@s.whatsapp.net",
  "message": "Hola! ¿Cómo estás?"
}
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Mensaje enviado exitosamente",
  "data": {
    "shopId": "shop_123",
    "jid": "5491123456789@s.whatsapp.net",
    "message": "Hola! ¿Cómo estás?"
  }
}
```

### 6. Enviar Mensaje a Grupo desde un Shop

**POST** `/api/whatsapp-shop/send-group`

Envía un mensaje a un grupo de WhatsApp desde la sesión de un shop.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "shopId": "shop_123",
  "groupJid": "120363123456789012@g.us",
  "message": "Mensaje para el grupo"
}
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Mensaje enviado al grupo exitosamente",
  "data": {
    "shopId": "shop_123",
    "groupJid": "120363123456789012@g.us",
    "message": "Mensaje para el grupo"
  }
}
```

### 7. Obtener Todas las Sesiones Activas (Solo Admins)

**GET** `/api/whatsapp-shop/admin/sessions`

Obtiene todas las sesiones activas del sistema (solo para administradores).

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Sesiones activas obtenidas",
  "data": [
    {
      "shopId": "shop_123",
      "isConnected": true,
      "phoneNumber": "5491123456789@s.whatsapp.net",
      "lastConnection": "2024-01-15T10:30:00.000Z"
    },
    {
      "shopId": "shop_456",
      "isConnected": false,
      "phoneNumber": null,
      "lastConnection": null
    }
  ]
}
```

## Códigos de Error

### 400 Bad Request

```json
{
  "success": false,
  "message": "Se requiere el shopId"
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
  "message": "No tienes permisos para activar WhatsApp en este shop"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error al activar WhatsApp",
  "error": "Descripción del error"
}
```

## Flujo de Uso desde el Frontend

### 1. Activar WhatsApp

```javascript
// 1. El usuario hace clic en "Activar WhatsApp"
const activateWhatsApp = async (shopId) => {
  const response = await fetch("/api/whatsapp-shop/activate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shopId }),
  });

  const data = await response.json();

  if (data.success && data.data.qr) {
    // Mostrar QR al usuario
    showQRCode(data.data.qr);
  }
};
```

### 2. Polling para Estado

```javascript
// 2. Hacer polling para verificar si se conectó
const checkConnectionStatus = async (shopId) => {
  const response = await fetch(`/api/whatsapp-shop/${shopId}/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (data.data.isConnected) {
    // Ocultar QR y mostrar estado conectado
    hideQRCode();
    showConnectedStatus(data.data.phoneNumber);
  } else if (data.data.qr) {
    // Actualizar QR si cambió
    updateQRCode(data.data.qr);
  }
};

// Hacer polling cada 3 segundos
setInterval(() => checkConnectionStatus(shopId), 3000);
```

### 3. Enviar Mensaje

```javascript
// 3. Enviar mensaje desde el panel
const sendMessage = async (shopId, phoneNumber, message) => {
  const response = await fetch("/api/whatsapp-shop/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shopId,
      jid: `${phoneNumber}@s.whatsapp.net`,
      message,
    }),
  });

  const data = await response.json();
  return data;
};
```

## Características Técnicas

- **Almacenamiento**: Las sesiones se almacenan en Redis, no en archivos
- **Escalabilidad**: Cada shop tiene su propia sesión independiente
- **Persistencia**: Las credenciales se guardan automáticamente en Redis
- **Reconexión**: Reconexión automática en caso de desconexión
- **Seguridad**: Autenticación JWT y verificación de permisos por shop
- **Monitoreo**: Endpoint para administradores para ver todas las sesiones

## Configuración Requerida

### Variables de Entorno

```env
# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=0

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

### Dependencias

- `redis`: Cliente de Redis
- `@whiskeysockets/baileys`: Librería de WhatsApp
- `jsonwebtoken`: Para autenticación JWT
