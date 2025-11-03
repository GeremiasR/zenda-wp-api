🧩 1. Concepto general

Cuando un usuario inicia sesión (por ejemplo, con email y contraseña), el servidor genera un token de acceso (access token) que sirve como "credencial temporal" para acceder a la API sin necesidad de reenviar usuario y contraseña en cada llamada.

Pero como no queremos que ese token dure para siempre (por seguridad), también se entrega un refresh token que permite pedir un nuevo access token cuando el primero expira.

🔐 2. Componentes principales
Tipo de token Duración típica Dónde se usa Propósito
Access Token Corto (5 min – 1h) En cada request al backend (header Authorization: Bearer <token>) Autenticar llamadas a la API
Refresh Token Largo (días o semanas) Guardado solo en cliente seguro (cookie HTTP-only o almacenamiento seguro) Permitir pedir nuevos access tokens sin volver a loguearse
⚙️ 3. Flujo completo paso a paso
🔸 Paso 1: Login

El usuario envía sus credenciales a /auth/login.

Request

POST /auth/login
{
"email": "user@example.com",
"password": "123456"
}

Response

{
"access_token": "eyJhbGciOiJIUzI1...",
"refresh_token": "b1b2c3d4e5..."
}

🔸 Paso 2: Usar el access token

Cada vez que el cliente llama a la API, incluye el token en el header:

Authorization: Bearer eyJhbGciOiJIUzI1...

El backend valida el token (por ejemplo, usando JWT con su firma o consultando su base de datos).
Si es válido y no expiró, procesa la request.

🔸 Paso 3: Expira el access token

Cuando expira, el cliente obtiene un error como:

{
"error": "token_expired"
}

Entonces usa el refresh token para pedir uno nuevo.

🔸 Paso 4: Solicitar nuevo access token

El cliente llama a /auth/refresh:

Request

POST /auth/refresh
{
"refresh_token": "b1b2c3d4e5..."
}

Response

{
"access_token": "nuevoAccessToken...",
"refresh_token": "opcional_nuevo_refresh_token"
}

De ahí en adelante usa el nuevo access token.

🔸 Paso 5: Logout o revocación

Si el usuario hace logout, el refresh token se invalida (por ejemplo, eliminándolo de la DB o poniéndolo en una blacklist).

🧱 4. Ejemplo técnico con JWT

El access token es un JWT firmado (ej: HS256 o RS256) con payload como:

{
"sub": "123",
"role": "admin",
"exp": 1728432200
}

El refresh token puede ser:

Otro JWT de larga duración, o

Un string aleatorio guardado en la base de datos con un user_id y expires_at.

💡 Buenas prácticas

✅ Access token corto (15 min–1h)
✅ Refresh token largo (7–30 días)
✅ Guardar refresh token en cookie HTTP-only y Secure (no en localStorage)
✅ Rotar el refresh token cada vez que se use
✅ Permitir invalidar refresh tokens en caso de logout o robo
✅ Si usás JWT, no guardar información sensible en el payload, ya que cualquiera puede leerla (aunque no modificarla)

🧩 1. Qué necesitas guardar

El único token que debes guardar en la base de datos es el refresh token (o algo que lo represente).
El access token (JWT corto) no se guarda, porque se genera y valida directamente con su firma.

Entonces:
✅ Guardas el refresh token
❌ No guardas el access token

🧱 2. Dónde guardarlo

Tienes dos opciones principales:

Opción A: Guardarlo dentro del documento del usuario

Ideal si tu aplicación es simple o de pocos dispositivos por usuario.

Ejemplo (MongoDB):

{
\_id: ObjectId("..."),
email: "user@example.com",
passwordHash: "...",
refreshTokens: [
{
token: "b1b2c3d4e5...",
createdAt: ISODate("2025-10-05T00:00:00Z"),
expiresAt: ISODate("2025-11-05T00:00:00Z"),
userAgent: "Chrome 140 / Windows 10"
}
]
}

✅ Fácil de implementar
✅ Permite múltiples dispositivos por usuario
⚠️ Puede crecer mucho si el usuario se loguea desde muchos lugares

Opción B: Guardarlo en una colección aparte (refresh_tokens)

Ideal para sistemas medianos o grandes, o donde cada token puede tener control individual (revocación, auditoría, etc.).

Ejemplo:

// Colección: refresh_tokens
{
\_id: ObjectId("..."),
userId: ObjectId("user_id"),
token: "b1b2c3d4e5...",
createdAt: ISODate("2025-10-05T00:00:00Z"),
expiresAt: ISODate("2025-11-05T00:00:00Z"),
revoked: false,
ip: "200.45.XXX.XXX",
userAgent: "Chrome 140 / Windows 10"
}

✅ Permite revocar tokens individuales
✅ Permite seguimiento de sesiones (último acceso, IP, etc.)
✅ Escalable
⚠️ Un poco más de complejidad inicial

⚙️ 3. Flujo con DB

Login:

Generás access y refresh tokens

Guardás el refresh token en la DB (o lo actualizás en el usuario)

Lo devolvés al cliente

Refresh:

Cliente envía su refresh token

Buscás ese token en la DB

Si existe y no expiró → generás un nuevo access token

(Opcional) generás un nuevo refresh token, guardás el nuevo y borrás el anterior

Logout:

Eliminás el refresh token de la DB (o lo marcás como revoked: true)

🔐 4. Ejemplo con Node.js + Mongoose
// refreshToken.model.js
const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
token: { type: String, required: true },
expiresAt: { type: Date, required: true },
revoked: { type: Boolean, default: false }
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);

🧠 5. Buenas prácticas extra

✅ Encriptar o hashear los refresh tokens antes de guardarlos (por ejemplo con bcrypt).
✅ Hacer limpieza de tokens expirados con un cron job.
✅ Asociar cada token a un userAgent o deviceId para control de sesiones.
✅ Si rotás refresh tokens (recomendado), revocá el anterior cada vez que generes uno nuevo.
