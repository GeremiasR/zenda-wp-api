# Guía para Probar el Sistema de Colas Redis + BullMQ

## Prerequisitos

1. **Redis debe estar corriendo**
   ```bash
   # Verificar que Redis esté corriendo
   redis-cli ping
   # Debe responder: PONG
   ```

2. **Variables de entorno configuradas**
   - Verifica que `.env` tenga la configuración de Redis
   - Ejemplo:
     ```
     REDIS_URL=redis://localhost:6379
     # O
     REDIS_HOST=localhost
     REDIS_PORT=6379
     ```

## Paso 1: Iniciar el Servidor

```bash
npm run dev
```

Deberías ver logs como:
```
Conectando a Redis (sesiones)...
Redis (sesiones) conectado exitosamente
Conectando a Redis Queue (BullMQ)...
Redis Queue (BullMQ) conectado exitosamente
Inicializando worker de mensajes...
✅ Worker creado para shop {shopId}: messages:shop-{shopId}
Worker de mensajes inicializado exitosamente
```

## Paso 2: Preparar Datos de Prueba

### 2.1 Crear un Shop (si no existe)

```bash
# Usar Postman, curl, o tu cliente HTTP favorito
POST http://localhost:3000/api/admin/shops
Authorization: Bearer {tu_token_admin}
Content-Type: application/json

{
  "name": "Tienda de Prueba",
  "internalName": "tienda-prueba",
  "description": "Tienda para probar colas"
}
```

Guarda el `_id` del shop creado (ejemplo: `507f1f77bcf86cd799439011`)

### 2.2 Crear un Flow (si no existe)

```bash
POST http://localhost:3000/api/admin/flows
Authorization: Bearer {tu_token_admin}
Content-Type: application/json

{
  "name": "Flow de Prueba",
  "description": "Flow para probar el sistema de colas",
  "shopId": "507f1f77bcf86cd799439011",
  "initialState": "menu",
  "states": {
    "menu": {
      "message": "Hola! Elige una opción:\n1) Saludo\n2) Despedida",
      "options": [
        {
          "input": ["1", "saludo"],
          "event": "SALUDO",
          "next": "saludo"
        },
        {
          "input": ["2", "despedida"],
          "event": "DESPEDIDA",
          "next": "despedida"
        }
      ]
    },
    "saludo": {
      "message": "¡Hola! ¿Cómo estás?",
      "options": [
        {
          "input": ["menu", "volver"],
          "event": "BACK",
          "next": "menu"
        }
      ]
    },
    "despedida": {
      "message": "¡Hasta luego!",
      "options": [
        {
          "input": ["menu", "volver"],
          "event": "BACK",
          "next": "menu"
        }
      ]
    }
  },
  "isActive": true
}
```

Guarda el `_id` del flow creado (ejemplo: `507f191e810c19729de860ea`)

## Paso 3: Activar WhatsApp para el Shop

```bash
POST http://localhost:3000/api/whatsapp-shop/activate
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "shopId": "507f1f77bcf86cd799439011",
  "flowId": "507f191e810c19729de860ea"
}
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "QR generado exitosamente",
  "data": {
    "shopId": "507f1f77bcf86cd799439011",
    "flowId": "507f191e810c19729de860ea",
    "sessionId": "shop_507f1f77bcf86cd799439011_507f191e810c19729de860ea",
    "qr": "2@..." // Código QR en base64
  }
}
```

### 3.1 Escanear el QR

- Obtén el QR con:
  ```bash
  GET http://localhost:3000/api/whatsapp-shop/507f1f77bcf86cd799439011/qr
  Authorization: Bearer {tu_token}
  ```
- Escanéalo con WhatsApp desde tu teléfono
- Espera a que se conecte (verificar con status)

### 3.2 Verificar Estado de Conexión

```bash
GET http://localhost:3000/api/whatsapp-shop/507f1f77bcf86cd799439011/status
Authorization: Bearer {tu_token}
```

Debe mostrar `"isConnected": true` cuando esté conectado.

## Paso 4: Probar el Sistema de Colas

### 4.1 Enviar un Mensaje desde WhatsApp

1. Abre WhatsApp en tu teléfono
2. Envía un mensaje al número que se conectó
3. **Observa los logs del servidor**, deberías ver:

```
📨 Mensaje recibido en shop 507f1f77bcf86cd799439011: {texto del mensaje}
✅ Mensaje encolado para shop 507f1f77bcf86cd799439011
🔄 Procesando mensaje para shop 507f1f77bcf86cd799439011, job {jobId}: {texto}
✅ Respuesta enviada para shop 507f1f77bcf86cd799439011, job {jobId}
✅ Job {jobId} completado en cola messages:shop-507f1f77bcf86cd799439011
```

### 4.2 Verificar que se Recibió la Respuesta

- Deberías recibir una respuesta automática en WhatsApp
- La respuesta dependerá del flow configurado

## Paso 5: Monitorear las Colas

### 5.1 Ver Logs del Worker

Los logs del servidor mostrarán:
- Cuando se encola un mensaje: `📨 Mensaje encolado...`
- Cuando se procesa: `🔄 Procesando mensaje...`
- Cuando se completa: `✅ Job completado...`
- Si hay errores: `❌ Job falló...`

### 5.2 Usar Redis CLI para Inspeccionar Colas

```bash
# Conectar a Redis
redis-cli

# Ver todas las claves de colas
KEYS messages:shop:*

# Ver jobs en espera (waiting)
# BullMQ usa listas específicas para cada estado
KEYS bull:messages:shop-*:waiting

# Ver jobs activos
KEYS bull:messages:shop-*:active

# Ver jobs completados
KEYS bull:messages:shop-*:completed

# Ver jobs fallidos
KEYS bull:messages:shop-*:failed
```

## Paso 6: Probar Múltiples Mensajes

### 6.1 Enviar Varios Mensajes Rápidamente

Envía varios mensajes desde WhatsApp en rápida sucesión:
1. "1"
2. "saludo"
3. "menu"

**Observa:**
- Los mensajes se encolan uno por uno
- Se procesan en orden (FIFO)
- Cada mensaje genera su propia respuesta

### 6.2 Verificar Orden de Procesamiento

Los logs mostrarán que se procesan en el mismo orden que se recibieron:
```
📨 Mensaje encolado para shop...
🔄 Procesando mensaje... job-1
✅ Job-1 completado
🔄 Procesando mensaje... job-2
✅ Job-2 completado
```

## Paso 7: Probar Múltiples Tiendas

### 7.1 Activar Segunda Tienda

1. Crea otro shop y flow
2. Activa WhatsApp para la segunda tienda
3. Conecta otro número de WhatsApp

### 7.2 Enviar Mensajes a Ambas Tiendas

- Envía mensajes a ambas tiendas simultáneamente
- **Observa:** Se procesan en paralelo (diferentes colas)
- Cada tienda tiene su propia cola: `messages:shop-{shopId1}` y `messages:shop-{shopId2}`

## Paso 8: Probar Reintentos (Opcional)

### 8.1 Simular Error

Puedes modificar temporalmente el handler para forzar un error:

```typescript
// En src/handlers/messageHandler.ts
if (message.text === "error") {
  throw new Error("Error de prueba");
}
```

### 8.2 Enviar Mensaje que Cause Error

1. Envía el mensaje "error" desde WhatsApp
2. **Observa:** El job falla y se reintenta automáticamente (3 intentos)
3. Verifica en logs: `❌ Job falló...`

## Solución de Problemas

### Problema: "Redis Queue no está conectado"
**Solución:**
- Verifica que Redis esté corriendo: `redis-cli ping`
- Verifica las variables de entorno de Redis
- Revisa los logs al iniciar el servidor

### Problema: "No hay sesión activa para shop"
**Solución:**
- Activa WhatsApp para el shop primero
- Verifica que esté conectado con el endpoint de status
- Revisa los logs de conexión

### Problema: Mensajes no se procesan
**Solución:**
1. Verifica que el worker esté iniciado (logs al arrancar)
2. Verifica que haya workers para la tienda activa
3. Revisa los logs de errores
4. Verifica que Redis esté accesible

### Problema: Mensajes se encolan pero no se procesan
**Solución:**
1. Verifica que el handler no tenga errores
2. Revisa los logs de errores del worker
3. Verifica que FlowService funcione correctamente
4. Revisa que el provider esté conectado para enviar respuestas

## Monitoreo Avanzado

### Ver Estadísticas de Colas (si agregas endpoint)

Puedes agregar un endpoint para ver estadísticas:

```typescript
// En algún controller
import { messageQueueProducer } from "../queue/producer";

const stats = await messageQueueProducer.getQueueStats(shopId);
// stats = { waiting: 0, active: 1, completed: 5, failed: 0 }
```

### Ver Stats del Worker

```typescript
import { messageQueueConsumer } from "../queue/consumer";

const stats = await messageQueueConsumer.getStats();
// stats = { activeWorkers: 2, queues: ["messages:shop-1", "messages:shop-2"] }
```

## Checklist de Prueba

- [ ] Redis está corriendo
- [ ] Servidor inicia sin errores
- [ ] Worker se inicializa correctamente
- [ ] Shop y Flow creados
- [ ] WhatsApp activado para shop
- [ ] QR escaneado y conectado
- [ ] Mensaje enviado desde WhatsApp
- [ ] Mensaje encolado (logs)
- [ ] Mensaje procesado (logs)
- [ ] Respuesta recibida en WhatsApp
- [ ] Múltiples mensajes procesados en orden
- [ ] Múltiples tiendas funcionan en paralelo

## Siguientes Pasos

1. **Agregar métricas**: Implementar endpoint para ver estadísticas de colas
2. **Dashboard**: Crear interfaz web para monitorear colas
3. **Alertas**: Configurar alertas para jobs fallidos
4. **Escalabilidad**: Probar con más tiendas y mayor volumen

---

¡El sistema está listo para usar! 🚀

