🧩 Objetivo general

Querés que cada shop pueda:

Iniciar sesión en su Back Office (autenticado con tu API).

Desde su panel, ver su flow configurado (en MongoDB).

Al hacer clic en “Activar WhatsApp”, tu backend:

Crea o restaura una sesión Baileys.

Genera un QR temporal.

Se lo envía al dashboard para que el usuario lo escanee.

Cuando el QR se escanea, la sesión queda activa y persistida en Redis.

A partir de ahí, los mensajes entrantes van directo al flow engine del shop.

🧠 Arquitectura conceptual
[ FRONT (BackOffice) ] ←→ [ EXPRESS API ]
│
├─ MongoDB → shops, flows, users
├─ Redis → sesiones WhatsApp
└─ Baileys Workers

🧩 Flujo paso a paso
1️⃣ El Shop presiona “Activar”

Desde el panel se hace una llamada al endpoint de tu API:

POST /api/whatsapp/activate
Headers: Authorization: Bearer <token>
Body: { shopId: "shop_123" }

2️⃣ Tu API inicializa la sesión (si no existe)
// routes/whatsapp.js
import express from "express";
import { startShopSession } from "../services/whatsappManager.js";

const router = express.Router();

router.post("/activate", async (req, res) => {
const { shopId } = req.body;
const qr = await startShopSession(shopId);
res.json({ qr });
});

export default router;

3️⃣ Manager de sesiones (whatsappManager.js)

Este módulo:

Verifica si ya existe una sesión activa en Redis.

Si no existe → crea una nueva conexión Baileys y devuelve el QR.

Si ya existe → devuelve estado “ya conectado”.

import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import redis from "./redisClient.js";

const activeSessions = new Map(); // memoria local

export async function startShopSession(shopId) {
// Si ya está activa, no recrear
if (activeSessions.has(shopId)) {
return { message: "Session already active" };
}

const prefix = `session:shop:${shopId}`;
const creds = await redis.get(`${prefix}:creds`);
const keys = await redis.get(`${prefix}:keys`);

const state = {
creds: creds ? JSON.parse(creds) : null,
keys: keys ? JSON.parse(keys) : {},
};

const sock = makeWASocket({
auth: state,
printQRInTerminal: false,
});

// Guardar automáticamente los updates
sock.ev.on("creds.update", async (updated) => {
await redis.set(`${prefix}:creds`, JSON.stringify(updated.creds));
await redis.set(`${prefix}:keys`, JSON.stringify(updated.keys));
});

// Enviar QR al dashboard (por WebSocket o almacenando temporalmente)
let currentQR;
sock.ev.on("connection.update", (update) => {
const { qr, connection } = update;
if (qr) currentQR = qr;

    if (connection === "open") {
      console.log(`[SHOP ${shopId}] WhatsApp conectado ✅`);
      activeSessions.set(shopId, sock);
    }

});

// Esperar a que se genere el QR
await new Promise((resolve) => setTimeout(resolve, 3000));

return currentQR
? { qr: currentQR }
: { message: "QR no disponible (puede estar reconectando)" };
}

4️⃣ El front recibe el QR y lo muestra

Podés usar una librería para mostrarlo visualmente:

// React (BackOffice)
import QRCode from "react-qr-code";

function WhatsAppActivation({ qr }) {
return qr ? (
<div>
<h3>Escaneá este QR con tu WhatsApp</h3>
<QRCode value={qr} size={256} />
</div>
) : (
<p>Esperando QR...</p>
);
}

5️⃣ El shop escanea el QR → sesión activa

Una vez escaneado:

Baileys actualiza las credenciales.

El connection.update pasa a "open".

Guardás en MongoDB algo como:

{
"shopId": "shop_123",
"whatsapp": {
"connected": true,
"number": "54911xxxxxxx",
"lastConnection": "2025-10-06T19:00:00Z"
}
}

🚀 Resultado

El shop puede activar o desactivar su número desde el panel.

El servidor maneja todas las sesiones en memoria y Redis.

No necesitás crear carpetas ni subir archivos.

El sistema es escalable y dinámico.
