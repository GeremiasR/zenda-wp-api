# Arquitectura del Sistema de Proveedores de WhatsApp

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        API REST Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  /api/whatsapp/sessions                                         │
│  /api/whatsapp/sessions/:id/connect                            │
│  /api/whatsapp/sessions/:id/disconnect                         │
│  /api/whatsapp/sessions/:id/status                             │
│  /api/whatsapp/send                                             │
│  /api/whatsapp/send-group                                       │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WhatsApp Controller                          │
├─────────────────────────────────────────────────────────────────┤
│  - createSession()                                              │
│  - connectSession()                                             │
│  - disconnectSession()                                          │
│  - getSessionStatus()                                           │
│  - sendMessage()                                                │
│  - sendGroupMessage()                                           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                WhatsApp Manager Service                         │
├─────────────────────────────────────────────────────────────────┤
│  - initializeSession()                                          │
│  - connectSession()                                             │
│  - disconnectSession()                                          │
│  - getSessionStatus()                                           │
│  - sendMessage()                                                │
│  - sendGroupMessage()                                           │
│  - initializeExistingSessions()                                │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                WhatsApp Provider Factory                        │
├─────────────────────────────────────────────────────────────────┤
│  - createProvider()                                             │
│  - getProvider()                                                │
│  - getAllProviders()                                            │
│  - getProvidersByType()                                         │
│  - removeProvider()                                             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Provider Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Baileys   │  │ Cloud API   │  │   Twilio    │             │
│  │  Provider   │  │  Provider   │  │  Provider   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                  │
│         ▼                 ▼                 ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Baileys   │  │   Meta      │  │   Twilio    │             │
│  │  Library    │  │  Graph API  │  │   API       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              WhatsApp Sessions Collection                   │ │
│  │  - sessionId (unique)                                      │ │
│  │  - phoneNumber                                             │ │
│  │  - provider (baileys|cloud_api|twilio|meta_business)      │ │
│  │  - isConnected                                             │ │
│  │  - lastSeen                                                │ │
│  │  - qrCode                                                  │ │
│  │  - connectionData                                          │ │
│  │  - credentials                                             │ │
│  │  - shopId                                                  │ │
│  │  - createdAt                                               │ │
│  │  - updatedAt                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Creación de Sesión

```
Cliente → API → Controller → Manager → Factory → Provider → Database
```

### 2. Envío de Mensaje

```
Cliente → API → Controller → Manager → Provider → WhatsApp API
```

### 3. Recepción de Mensaje

```
WhatsApp API → Provider → Manager → Flow Service → Response
```

## Ventajas de la Nueva Arquitectura

### 1. **Modularidad**

- Cada proveedor es independiente
- Fácil agregar nuevos proveedores
- Código organizado y mantenible

### 2. **Escalabilidad**

- Múltiples sesiones simultáneas
- Cada tienda puede usar diferentes proveedores
- Balanceador de carga entre proveedores

### 3. **Flexibilidad**

- Cambiar proveedores sin afectar el código
- Configuración por sesión
- Credenciales específicas por proveedor

### 4. **Mantenibilidad**

- Interfaces claras y consistentes
- Separación de responsabilidades
- Fácil testing unitario

### 5. **Reutilización**

- Proveedores pueden ser reutilizados
- Factory pattern para creación
- Configuración centralizada

## Comparación con el Sistema Anterior

| Aspecto            | Sistema Anterior  | Nuevo Sistema         |
| ------------------ | ----------------- | --------------------- |
| **Proveedores**    | Solo Baileys      | Múltiples proveedores |
| **Sesiones**       | Una sesión global | Múltiples sesiones    |
| **Configuración**  | Hardcoded         | Por sesión            |
| **Escalabilidad**  | Limitada          | Alta                  |
| **Mantenibilidad** | Media             | Alta                  |
| **Testing**        | Difícil           | Fácil                 |

## Próximos Pasos

1. **Implementar Webhooks**

   - Cloud API webhook handler
   - Twilio webhook handler
   - Meta Business webhook handler

2. **Agregar Más Proveedores**

   - Meta Business API
   - Otros proveedores de WhatsApp

3. **Mejorar el Sistema**

   - Balanceador de carga
   - Cache de sesiones
   - Métricas y monitoreo
   - Rate limiting por proveedor

4. **Optimizaciones**
   - Pool de conexiones
   - Compresión de datos
   - Retry automático
   - Circuit breaker pattern
