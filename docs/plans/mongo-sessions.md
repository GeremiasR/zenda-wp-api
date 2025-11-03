Documentación técnica – Persistencia de sesión Baileys con MongoDB
🎯 Objetivo

Centralizar el manejo de sesiones de WhatsApp (Baileys) sin archivos locales, usando MongoDB como única fuente de verdad.

Cada número o dispositivo mantiene una sola sesión persistida (authState) dentro de la base de datos.

⚙️ Arquitectura general
Cliente WhatsApp ⇄ Baileys Worker ⇄ MongoDB

MongoDB almacena todas las credenciales y claves necesarias.

Al iniciar el servicio, el worker restaura la sesión desde la base.

Si la sesión se actualiza, se sobrescribe automáticamente.

🧩 Implementación
// baileysSessionStore.ts
import { initAuthCreds } from '@whiskeysockets/baileys'

export function makeMongoAuthState(db) {
const collection = db.collection('whatsapp_sessions')

return {
/\*\*
_ Carga la sesión desde MongoDB o inicializa una nueva si no existe.
_/
async getAuthState(number) {
const doc = await collection.findOne({ number })
if (!doc) return { creds: initAuthCreds(), keys: {} }

      return JSON.parse(Buffer.from(doc.data, 'base64').toString())
    },

    /**
     * Guarda o actualiza la sesión completa en MongoDB.
     */
    async saveAuthState(number, authState) {
      const data = Buffer.from(JSON.stringify(authState)).toString('base64')

      await collection.updateOne(
        { number },
        { $set: { data, updatedAt: new Date() } },
        { upsert: true }
      )
    },

}
}

🧠 Ejemplo de uso
// index.ts
import { makeWASocket } from '@whiskeysockets/baileys'
import { makeMongoAuthState } from './baileysSessionStore.js'
import { MongoClient } from 'mongodb'

const mongo = new MongoClient(process.env.MONGO_URI)
await mongo.connect()
const db = mongo.db('myapp')

const { getAuthState, saveAuthState } = makeMongoAuthState(db)

// Número asociado a la sesión (puede venir de configuración o DB)
const number = '5491123456789'

// Cargar sesión desde Mongo o crear una nueva
const authState = await getAuthState(number)

// Inicializar Baileys
const sock = makeWASocket({ auth: authState })

// Guardar cada vez que se actualicen las credenciales
sock.ev.on('creds.update', async () => {
await saveAuthState(number, authState)
})

console.log(`📱 Sesión iniciada para ${number}`)

🧱 Estructura en MongoDB

Colección: whatsapp_sessions

{
"\_id": "ObjectId",
"number": "5491123456789",
"data": "eyJjcmVkcyI6eyJrZXlzIjpbXX19", // Base64 del JSON serializado
"updatedAt": "2025-10-14T21:00:00Z"
}

✅ Beneficios

🔐 1 sola sesión por número/dispositivo

🧱 Persistencia incluso tras reinicios o despliegues

⚡ Sin dependencia de Redis ni archivos locales

🧩 Escalable: permite múltiples instancias del servicio conectadas al mismo Mongo

💾 Almacena todas las pre-keys, sender keys y creds en un solo documento
