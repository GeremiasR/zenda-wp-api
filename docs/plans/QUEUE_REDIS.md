🧠 Documentación técnica — Arquitectura WhatsApp Bot (Baileys + Redis Queue)
📌 Objetivo

Implementar un sistema de mensajería basado en Baileys para recibir y responder mensajes de WhatsApp en tiempo real, utilizando Redis y BullMQ para asegurar procesamiento ordenado, escalable y resiliente.
El servicio debe permitir manejar múltiples conversaciones simultáneas por un mismo número, evitando condiciones de carrera y pérdida de mensajes.

🏗️ Arquitectura general
┌────────────────────────┐
│ Cliente de WhatsApp │
└───────────┬────────────┘
│
(WebSocket / Baileys)
│
┌─────────────▼─────────────┐
│ Servicio de Mensajes │
│ (Express + Baileys) │
└─────────────┬─────────────┘
│
(Encola mensaje)
│
┌───────────▼────────────┐
│ Redis Queue │
│ (BullMQ) │
└───────────┬────────────┘
│
(Procesamiento ordenado)
│
┌───────────▼────────────┐
│ Worker Bot │
│ (procesa y responde) │
└────────────────────────┘

⚙️ Componentes

1. Baileys Connection

Maneja la conexión con WhatsApp Web, escucha los mensajes entrantes y los encola.

Responsabilidades:

Iniciar sesión con useMultiFileAuthState.

Escuchar eventos messages.upsert.

Enviar los mensajes entrantes a la cola messages.

2. Redis + BullMQ

Sistema de colas para procesar mensajes de forma secuencial y confiable.

Roles:

Productor: Encola los mensajes entrantes.

Consumidor (Worker): Procesa los mensajes uno por uno, ejecutando la lógica del bot.

3. Worker

Servicio Node.js que procesa la cola y responde a los usuarios.

Responsabilidades:

Leer mensajes en orden FIFO desde Redis.

Ejecutar la lógica de negocio (handlers/messageHandler.ts).

Enviar respuestas por Baileys (sock.sendMessage).

4. Express Server

Backend principal.
Opcionalmente expone endpoints REST (por ejemplo, monitoreo, registro de tiendas, estadísticas, etc.).
Puede vivir en el mismo proceso que el worker o separado.

🗂️ Estructura recomendada del proyecto
src/
├── baileys/
│ └── connection.ts # Conexión WhatsApp y eventos entrantes
├── queue/
│ ├── producer.ts # Encola mensajes entrantes
│ └── consumer.ts # Worker que procesa la cola
├── handlers/
│ └── messageHandler.ts # Lógica del bot (turnos, pedidos, etc.)
├── redis.ts # Configuración de conexión Redis
├── server.ts # Express API (opcional)
└── index.ts # Punto de inicio del servicio

🧩 Flujo de ejecución

El cliente envía un mensaje por WhatsApp.

Baileys lo recibe en messages.upsert.

El mensaje se encola en Redis mediante BullMQ.

El Worker procesa el mensaje de la cola:

Ejecuta la lógica de negocio.

Envía la respuesta a través de Baileys.

El flujo se repite de forma ordenada y segura.

🧠 Configuración técnica
Redis

Configurar una instancia Redis accesible desde ambos procesos (Express y Worker):

// src/redis.ts
import { Redis } from 'ioredis';
export const redis = new Redis({ host: 'localhost', port: 6379 });

Cola BullMQ

Producer:

import { Queue } from 'bullmq';
import { redis } from '../redis.js';

export const messageQueue = new Queue('messages', { connection: redis });
export const enqueueMessage = (payload) => messageQueue.add('incoming', payload);

Consumer (Worker):

import { Worker } from 'bullmq';
import { redis } from '../redis.js';
import { handleIncomingMessage } from '../handlers/messageHandler.js';

export const worker = new Worker(
'messages',
async job => handleIncomingMessage(job.data),
{ connection: redis }
);

Baileys
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { enqueueMessage } from '../queue/producer.js';

const { state, saveCreds } = await useMultiFileAuthState('./auth');
export const sock = makeWASocket({ auth: state, printQRInTerminal: true });

sock.ev.on('creds.update', saveCreds);
sock.ev.on('messages.upsert', async ({ messages }) => {
const m = messages[0];
if (!m.message || m.key.fromMe) return;
await enqueueMessage({ from: m.key.remoteJid, message: m.message.conversation });
});

🚀 Ejecución
Opción simple (Express + Worker en el mismo proceso)
// index.ts
import './queue/consumer.js';
import './baileys/connection.js';
import express from 'express';

const app = express();
app.listen(3000, () => console.log('Bot y cola activos 🚀'));

Opción avanzada (procesos separados)
node src/server.js # Express
node src/queue/consumer.js # Worker

📊 Escalabilidad

Una cola por tienda (messages:store-1, messages:store-2, etc.).

Workers dedicados por tienda o compartidos con filtro por storeId.

Redis maneja múltiples colas sin bloqueo.

🧱 Buenas prácticas

Persistir authState en disco o base de datos.

Limitar frecuencia de envíos (evita bans).

Implementar reintentos automáticos en el worker ({ attempts: 3 }).

Loguear mensajes en DB para trazabilidad.

Separar lógica de negocio del código de mensajería.
