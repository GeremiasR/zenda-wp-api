# Modelos de Base de Datos

Esta carpeta contiene todos los modelos de MongoDB para la aplicación Zenda WhatsApp API.

## Estructura

- `index.ts` - Archivo de índice que exporta todos los modelos
- `whatsapp-session.model.ts` - Modelo para las sesiones de WhatsApp

## Uso

```typescript
import { WhatsAppSession } from '../models';

// Crear una nueva sesión
const session = new WhatsAppSession({
  sessionId: 'unique-session-id',
  phoneNumber: '+1234567890',
  isConnected: true
});

await session.save();

// Buscar sesiones activas
const activeSessions = await WhatsAppSession.findActiveSessions();

// Verificar si una sesión está activa
const isActive = session.isActive();
```

## Modelos Disponibles

### WhatsAppSession

Modelo para gestionar las sesiones de WhatsApp conectadas.

**Campos:**
- `sessionId` (String, único): Identificador único de la sesión
- `phoneNumber` (String): Número de teléfono asociado
- `isConnected` (Boolean): Estado de conexión
- `lastSeen` (Date): Última vez que se vio la sesión
- `qrCode` (String, opcional): Código QR para autenticación
- `connectionData` (Mixed, opcional): Datos de conexión adicionales
- `createdAt` (Date): Fecha de creación
- `updatedAt` (Date): Fecha de última actualización

**Métodos:**
- `isActive()`: Verifica si la sesión está activa (conectada en las últimas 24 horas)
- `findActiveSessions()`: Encuentra todas las sesiones activas
- `cleanInactiveSessions()`: Marca como inactivas las sesiones que no se han visto en 24 horas

## Agregar Nuevos Modelos

1. Crear el archivo del modelo (ej: `user.model.ts`)
2. Definir la interfaz TypeScript
3. Crear el esquema de Mongoose
4. Exportar el modelo
5. Agregar la exportación en `index.ts`
