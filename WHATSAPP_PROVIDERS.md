# Sistema de Proveedores de WhatsApp

Este documento explica cómo usar el nuevo sistema modular de proveedores de WhatsApp en Zenda.

## Arquitectura

El sistema está diseñado para ser completamente modular y permitir que cada tienda (shop) use diferentes proveedores de WhatsApp de manera independiente.

### Estructura de Carpetas

```
src/providers/whatsapp/
├── interfaces/
│   └── whatsapp-provider.interface.ts    # Interfaces base
├── providers/
│   ├── baileys/                          # Proveedor Baileys
│   ├── cloud-api/                        # Proveedor WhatsApp Cloud API
│   ├── twilio/                           # Proveedor Twilio
│   └── index.ts                          # Exportaciones de proveedores
├── whatsapp-provider-factory.ts          # Factory para crear proveedores
└── index.ts                              # Exportaciones principales
```

## Proveedores Disponibles

### 1. Baileys

- **ID**: `baileys`
- **Descripción**: Cliente de WhatsApp no oficial usando la librería Baileys
- **Uso**: Ideal para desarrollo y pruebas
- **Credenciales**: No requiere credenciales externas

### 2. WhatsApp Cloud API

- **ID**: `cloud_api`
- **Descripción**: API oficial de WhatsApp Business
- **Uso**: Producción con WhatsApp Business
- **Credenciales**:
  - `accessToken`: Token de acceso de Meta
  - `phoneNumberId`: ID del número de teléfono
  - `webhookVerifyToken`: Token de verificación del webhook

### 3. Twilio

- **ID**: `twilio`
- **Descripción**: Servicio de WhatsApp de Twilio
- **Uso**: Producción con Twilio
- **Credenciales**:
  - `accountSid`: SID de la cuenta de Twilio
  - `authToken`: Token de autenticación
  - `fromNumber`: Número de teléfono de Twilio

## Uso de la API

### 1. Crear una Sesión

```bash
POST /api/whatsapp/sessions
Content-Type: application/json

{
  "sessionId": "tienda-1-session",
  "phoneNumber": "1234567890",
  "provider": "baileys",
  "shopId": "tienda-1",
  "credentials": {
    // Credenciales específicas del proveedor
  }
}
```

### 2. Conectar una Sesión

```bash
POST /api/whatsapp/sessions/{sessionId}/connect
```

### 3. Desconectar una Sesión

```bash
POST /api/whatsapp/sessions/{sessionId}/disconnect
```

### 4. Obtener Estado de una Sesión

```bash
GET /api/whatsapp/sessions/{sessionId}/status
```

### 5. Enviar un Mensaje

```bash
POST /api/whatsapp/send
Content-Type: application/json

{
  "sessionId": "tienda-1-session",
  "jid": "1234567890@s.whatsapp.net",
  "message": "Hola, ¿cómo estás?"
}
```

### 6. Enviar Mensaje a Grupo

```bash
POST /api/whatsapp/send-group
Content-Type: application/json

{
  "sessionId": "tienda-1-session",
  "groupJid": "1234567890@g.us",
  "message": "Mensaje para el grupo"
}
```

### 7. Obtener Todas las Sesiones Activas

```bash
GET /api/whatsapp/sessions
```

### 8. Eliminar una Sesión

```bash
DELETE /api/whatsapp/sessions/{sessionId}
```

## Ejemplos de Configuración

### Baileys (Desarrollo)

```json
{
  "sessionId": "dev-session",
  "phoneNumber": "1234567890",
  "provider": "baileys",
  "shopId": "tienda-dev"
}
```

### WhatsApp Cloud API (Producción)

```json
{
  "sessionId": "prod-session",
  "phoneNumber": "1234567890",
  "provider": "cloud_api",
  "shopId": "tienda-prod",
  "credentials": {
    "accessToken": "EAAxxxxxxxxxxxx",
    "phoneNumberId": "123456789012345",
    "webhookVerifyToken": "mi_token_secreto"
  }
}
```

### Twilio (Producción)

```json
{
  "sessionId": "twilio-session",
  "phoneNumber": "1234567890",
  "provider": "twilio",
  "shopId": "tienda-twilio",
  "credentials": {
    "accountSid": "ACxxxxxxxxxxxx",
    "authToken": "xxxxxxxxxxxx",
    "fromNumber": "whatsapp:+1234567890"
  }
}
```

## Ventajas del Nuevo Sistema

1. **Modularidad**: Cada proveedor es independiente
2. **Escalabilidad**: Fácil agregar nuevos proveedores
3. **Flexibilidad**: Cada tienda puede usar diferentes proveedores
4. **Mantenibilidad**: Código organizado y fácil de mantener
5. **Reutilización**: Los proveedores pueden ser reutilizados
6. **Testing**: Fácil hacer pruebas unitarias de cada proveedor

## Migración desde el Sistema Anterior

El sistema anterior con `whatsappService` ha sido reemplazado por `whatsappManagerService`. Los cambios principales son:

1. **Sesiones múltiples**: Ahora se pueden tener múltiples sesiones simultáneas
2. **Proveedores**: Cada sesión puede usar un proveedor diferente
3. **API REST**: Nueva API REST para gestionar sesiones
4. **Base de datos**: Las sesiones se guardan en MongoDB

## Próximos Pasos

1. Implementar webhooks para Cloud API y Twilio
2. Agregar más proveedores (Meta Business API, etc.)
3. Implementar balanceador de carga entre proveedores
4. Agregar métricas y monitoreo por proveedor
5. Implementar cache de sesiones para mejor rendimiento
