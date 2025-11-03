# 🔌 WebSocket Architecture (Frontend + Backend)

## 🎯 Objetivo

Diseñar un sistema de comunicación en tiempo real entre **frontend** y **backend** que:

- Mantenga **una única conexión WebSocket por usuario**, sin importar cuántas pestañas tenga abiertas.
- Garantice **idempotencia** y **consistencia de estado** mediante `eventId` incremental.
- Permita **sincronización entre pestañas** con `BroadcastChannel`.
- Soporte **reconexiones** sin pérdida de mensajes.
- Sea escalable y preparado para múltiples instancias backend.

---

## 🧱 BACKEND

### 1. Autenticación y asociación de sockets

- El WebSocket se inicializa solo después de un **login exitoso**.
- Cada conexión debe incluir un **token JWT** o `userId` para identificar al usuario.
- El backend mantiene un registro por `userId` → `socketId` (solo uno activo por usuario).
- Si el usuario ya tiene una sesión abierta, la nueva puede:
  - Reemplazar la anterior, o
  - Ser rechazada (según configuración de concurrencia).

**Responsabilidad:**  
Mantener en memoria o Redis:

- `userId`
- `socketId`
- `lastEventId` (último evento confirmado)

---

### 2. Emisión de eventos (event sequencing)

- Todos los eventos emitidos incluyen un `eventId` incremental, `type`, `payload` y `timestamp`.
- Los eventos se guardan en Redis o MongoDB por un TTL breve (ej. 5–10 minutos) para recuperación en caso de reconexión.
- Si el cliente se reconecta y envía su `lastEventId`, el backend envía solo los eventos faltantes.

**Estructura mínima del evento:**

```json
{
  "id": 154,
  "type": "order_update",
  "payload": { "orderId": "A123", "status": "ready" },
  "timestamp": 1730569300000
}
```

3. Idempotencia y resincronización

El backend debe permitir al cliente pedir eventos faltantes (request_sync con lastEventId).

Si la diferencia es pequeña, responde con los eventos faltantes.

Si es grande (o el usuario estuvo offline demasiado), responde con una instrucción de "full refresh" del estado.

Esto evita duplicados y asegura que el frontend nunca quede desactualizado.

1. Cada usuario tiene un contexto de sesión

En el backend, cuando el usuario inicia sesión, se guarda su contexto en memoria o Redis:

{
"userId": "u_101",
"shopId": "s_1",
"modules": ["orders", "chat"],
"socketId": "abc123"
}

shopId: identifica a qué tienda pertenece.

modules: lista de módulos habilitados (determina qué eventos recibe).

socketId: identifica la conexión WebSocket activa.

2. Cada evento tiene un ámbito y tipo

Cuando el backend emite un evento, define su scope y type:

{
"id": 587,
"type": "order_created",
"scope": {
"shopId": "s_1"
},
"payload": {
"orderId": "A-509",
"customer": "Juan Pérez"
}
}

3. El router de eventos decide a quién emitir

El backend no emite a todos, sino que filtra:

Busca los usuarios conectados que pertenecen a shopId = s_1.

Dentro de ellos, selecciona los que tengan el módulo "orders" activo.

Emite solo a esos sockets.

Ejemplo lógico:

function emitEvent(event) {
const { shopId } = event.scope;
for (const session of activeSessions) {
if (session.shopId === shopId && session.modules.includes(getModuleForEvent(event.type))) {
io.to(session.socketId).emit("event", event);
}
}
}

4. Mapeo entre tipo de evento y módulo

Definí un mapa centralizado (puede estar en un archivo events.config.js):

{
"order_created": "orders",
"order_updated": "orders",
"transaction_approved": "transactions",
"transaction_failed": "transactions",
"chat_message": "chat"
}

Esto permite mantener controlado qué eventos pertenecen a qué módulo.

5. Manejo en el frontend

Cuando el usuario hace login:

El backend devuelve junto al token la lista de módulos habilitados (modules).

El frontend registra los listeners solo para los tipos de evento permitidos.

Si llega un evento de otro módulo (por error), se ignora automáticamente.

🧠 Concepto general

Cada usuario autenticado establece un WebSocket con el backend.
Ese socket debe:

Ser identificable (ej. socketId → userId o sessionId)

Ser temporal, como la sesión del usuario.

Poder reconectarse y seguir siendo válido mientras el token JWT o sesión sea válida.

Redis actúa como un registro distribuido en memoria, manteniendo el estado temporal de cada socket activo.

⚙️ Qué guardar en Redis

Cada conexión puede registrarse así:

{
"key": "ws:user:<userId>",
"value": {
"socketId": "<uuid>",
"modules": ["orders", "transactions"],
"shopId": "1",
"connectedAt": "timestamp"
},
"ttl": 3600
}

key: identifica el socket del usuario.

value: guarda información contextual para enrutar notificaciones.

ttl: igual a la duración del access_token (por ejemplo, 1 hora).

Si el usuario renueva sesión o el refresh_token, podés actualizar el TTL o regenerar la conexión.

🔁 Qué pasa cuando se renueva el token

Si el access_token expira, el socket también caduca (Redis limpia la entrada automáticamente).

Si el usuario renueva su sesión, el frontend puede reabrir el WebSocket y el backend actualiza el TTL.

Esto evita mantener conexiones “muertas” o de usuarios ya deslogueados.

🧩 Beneficio

Esto garantiza:

Idempotencia: si el usuario se reconecta, actualiza el mismo registro Redis.

Escalabilidad: Redis permite consultar sockets activos por shopId, module, etc.

Seguridad: el tiempo de vida del socket está ligado al del token JWT, evitando fugas de sesión.

💡 Resumen final
Elemento Descripción Duración
ws:user:<userId> Registro de conexión WebSocket Igual al TTL del access_token
modules Lista de módulos suscritos Persistente mientras dure la conexión
shopId Contexto de la tienda Persistente
socketId Identificador de sesión WebSocket Renueva al reconectarse

💻 FRONTEND

1. Inicialización después del login

Una vez que el usuario se autentica, se abre (o se recupera) un canal de comunicación compartido llamado BroadcastChannel.

Solo una pestaña (la maestra) abre la conexión WebSocket real al backend.

Las demás pestañas:

Detectan que ya existe una conexión activa.

Se suscriben al canal BroadcastChannel para recibir los mismos mensajes.

Envían comandos o acciones a la pestaña maestra a través del canal.

Resultado: el usuario mantiene una sola conexión WebSocket aunque tenga múltiples pestañas abiertas.

2. Sincronización entre pestañas

Todas las pestañas usan el mismo BroadcastChannel (ej. "ws-sync").

La pestaña maestra reenvía cada mensaje recibido del backend al canal.

Si la pestaña maestra se cierra, otra pestaña toma el rol de maestra y abre una nueva conexión.

3. Control de eventos (idempotencia)

Cada evento incluye un eventId.

El frontend guarda el último eventId procesado (en memoria o localStorage).

Si recibe un evento con event.id <= lastEventId, lo ignora (ya procesado).

Si detecta un salto (event.id > lastEventId + 1), solicita resincronización (request_sync) al backend.

Esto evita estados inconsistentes y eventos duplicados entre pestañas.

4. Reconexión automática

Si la conexión WebSocket se corta:

La pestaña maestra intenta reconectarse con exponential backoff.

Envía su último eventId para recuperar eventos faltantes.

Si el backend determina que la brecha de eventos es muy grande, el frontend realiza un fetch completo de estado.

5. Distribución de eventos a la aplicación

Los mensajes que llegan desde el WebSocket (en la pestaña maestra) o desde el BroadcastChannel (en las demás) se propagan al state manager del frontend (p. ej. Redux, Zustand, Context API).

Los componentes escuchan eventos por type y actualizan su estado local sin necesidad de recargar.

📈 Beneficios del enfoque
Función Descripción
Conexión única por usuario Solo una pestaña mantiene la conexión activa al servidor.
Sincronización multi-pestaña BroadcastChannel replica los eventos entre todas las pestañas abiertas.
Idempotencia garantizada eventId incremental evita duplicados y mantiene consistencia.
Reconexión confiable Reintenta automáticamente y sincroniza eventos faltantes.
Escalable horizontalmente Preparado para Redis Pub/Sub o clústeres distribuidos.
🧩 Resumen técnico

Backend:

Node.js + Socket.IO o WS.

Redis opcional (cola + eventId global + sync entre instancias).

Persistencia temporal de eventos (eventId, type, payload, timestamp).

Frontend:

WebSocket manejado solo por pestaña maestra.

BroadcastChannel para sincronizar entre pestañas.

Control de idempotencia y resincronización por eventId.

Al reconectarse, reenvía lastEventId al backend.
