# Integración de MongoDB en Zenda WhatsApp API

Este documento describe la integración completa de MongoDB en el proyecto Zenda WhatsApp API.

## 📋 Resumen de Cambios

### Dependencias Instaladas
- `mongoose` - ODM para MongoDB
- `@types/mongoose` - Tipos de TypeScript para Mongoose

### Archivos Creados/Modificados

#### Nuevos Archivos
- `src/services/database.service.ts` - Servicio de conexión a MongoDB
- `src/models/whatsapp-session.model.ts` - Modelo para sesiones de WhatsApp
- `src/models/index.ts` - Índice de modelos
- `src/models/README.md` - Documentación de modelos
- `src/utils/database.utils.ts` - Utilidades para base de datos
- `src/examples/mongodb-usage.example.ts` - Ejemplos de uso

#### Archivos Modificados
- `package.json` - Agregadas dependencias de MongoDB
- `env.example` - Agregadas variables de entorno para MongoDB
- `src/config/index.ts` - Agregada configuración de base de datos
- `src/index.ts` - Integrada conexión a MongoDB en el startup

## 🚀 Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Configuración de MongoDB
MONGODB_URI=mongodb://localhost:27017/zenda-wp-api
MONGODB_DATABASE=zenda-wp-api
```

### Conexión a MongoDB

La conexión a MongoDB se establece automáticamente cuando se inicia el servidor. El servicio de base de datos:

- Se conecta usando la URI configurada
- Maneja reconexiones automáticas
- Proporciona logging detallado
- Se desconecta limpiamente al cerrar la aplicación

## 📊 Modelos de Datos

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
- `isActive()`: Verifica si la sesión está activa
- `findActiveSessions()`: Encuentra todas las sesiones activas
- `cleanInactiveSessions()`: Limpia sesiones inactivas

## 🛠️ Uso

### Importar Modelos

```typescript
import { WhatsAppSession } from './models';
```

### Crear una Sesión

```typescript
const session = new WhatsAppSession({
  sessionId: 'unique-session-id',
  phoneNumber: '+1234567890',
  isConnected: true
});

await session.save();
```

### Buscar Sesiones

```typescript
// Buscar todas las sesiones activas
const activeSessions = await WhatsAppSession.findActiveSessions();

// Buscar por número de teléfono
const session = await WhatsAppSession.findOne({ phoneNumber: '+1234567890' });
```

### Actualizar Sesiones

```typescript
await WhatsAppSession.findOneAndUpdate(
  { sessionId: 'session-id' },
  { isConnected: false, lastSeen: new Date() },
  { new: true }
);
```

## 🔧 Servicios

### DatabaseService

Servicio singleton para gestionar la conexión a MongoDB.

```typescript
import { databaseService } from './services/database.service';

// Verificar estado de conexión
const isConnected = databaseService.getConnectionStatus();

// Obtener conexión de Mongoose
const connection = databaseService.getConnection();
```

## 🛡️ Utilidades

### Manejo de Errores

```typescript
import { handleDatabaseError } from './utils/database.utils';

try {
  await session.save();
} catch (error) {
  const errorMessage = handleDatabaseError(error);
  console.error(errorMessage);
}
```

### Conversión de ObjectId

```typescript
import { objectIdToString, stringToObjectId, isValidObjectId } from './utils/database.utils';

// Convertir ObjectId a string
const idString = objectIdToString(session._id);

// Convertir string a ObjectId
const objectId = stringToObjectId('507f1f77bcf86cd799439011');

// Validar ObjectId
const isValid = isValidObjectId('507f1f77bcf86cd799439011');
```

## 📝 Ejemplos

Ver `src/examples/mongodb-usage.example.ts` para ejemplos completos de uso.

## 🚨 Consideraciones Importantes

1. **Conexión**: MongoDB debe estar ejecutándose antes de iniciar la aplicación
2. **Variables de Entorno**: Asegúrate de configurar las variables de entorno correctamente
3. **Índices**: Los índices se crean automáticamente para optimizar consultas
4. **Validación**: Mongoose valida automáticamente los datos antes de guardarlos
5. **Manejo de Errores**: Usa las utilidades proporcionadas para manejar errores de forma consistente

## 🔄 Próximos Pasos

1. Crear más modelos según las necesidades del proyecto
2. Implementar repositorios para encapsular la lógica de acceso a datos
3. Agregar tests unitarios para los modelos
4. Implementar migraciones si es necesario
5. Configurar backups automáticos de la base de datos

## 📚 Recursos Adicionales

- [Documentación de Mongoose](https://mongoosejs.com/docs/)
- [Documentación de MongoDB](https://docs.mongodb.com/)
- [Guía de TypeScript con Mongoose](https://mongoosejs.com/docs/typescript.html)
