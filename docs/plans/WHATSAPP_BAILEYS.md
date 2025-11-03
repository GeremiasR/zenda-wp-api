# WhatsApp Integration con Baileys

Este proyecto implementa una integración básica de WhatsApp utilizando la biblioteca Baileys.

## 🚀 Características

- ✅ Conexión automática a WhatsApp
- ✅ Envío de mensajes individuales
- ✅ Envío de mensajes a grupos
- ✅ Manejo automático de reconexión
- ✅ Respuesta automática a mensajes entrantes
- ✅ API REST para controlar la conexión

## 📦 Dependencias Instaladas

- `@whiskeysockets/baileys` - Biblioteca principal para WhatsApp
- `@hapi/boom` - Manejo de errores
- `qrcode-terminal` - Mostrar código QR en terminal
- `pino` - Sistema de logging

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `env.example`:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de WhatsApp con Baileys
WHATSAPP_SESSION_NAME=zenda-session
WHATSAPP_MAX_RECONNECT_ATTEMPTS=5
WHATSAPP_RECONNECT_DELAY=5000

# Configuración de seguridad
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

## 🚀 Uso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar en modo desarrollo

```bash
npm run dev
```

### 3. Conectar WhatsApp

Cuando ejecutes la aplicación, aparecerá un código QR en la terminal. Escanéalo con WhatsApp:

1. Abre WhatsApp en tu teléfono
2. Ve a Configuración > Dispositivos vinculados
3. Escanea el código QR que aparece en la terminal

## 📡 API Endpoints

### Conectar a WhatsApp

```http
POST /api/whatsapp/connect
```

### Desconectar de WhatsApp

```http
POST /api/whatsapp/disconnect
```

### Obtener estado de conexión

```http
GET /api/whatsapp/status
```

### Enviar mensaje individual

```http
POST /api/whatsapp/send
Content-Type: application/json

{
  "jid": "5491234567890@s.whatsapp.net",
  "message": "Hola desde Zenda!"
}
```

### Enviar mensaje a grupo

```http
POST /api/whatsapp/send-group
Content-Type: application/json

{
  "groupJid": "120363123456789012@g.us",
  "message": "Mensaje para el grupo"
}
```

## 📁 Estructura de Archivos

```
src/
├── services/
│   └── whatsapp.service.ts    # Servicio principal de WhatsApp
├── controllers/
│   └── whatsapp.controller.ts # Controladores para la API
├── routes/
│   └── whatsapp.routes.ts     # Rutas de la API
└── config/
    └── index.ts               # Configuración de la aplicación
```

## 🔄 Flujo de Conexión

1. La aplicación se inicia y automáticamente intenta conectar con WhatsApp
2. Se muestra un código QR en la terminal
3. El usuario escanea el código QR con WhatsApp
4. La conexión se establece y se guarda la sesión en `auth/zenda-session/`
5. La aplicación puede enviar y recibir mensajes

## 🛠️ Funcionalidades del Servicio

### WhatsAppService

- **connect()**: Establece conexión con WhatsApp
- **disconnect()**: Cierra la conexión
- **sendMessage(jid, message)**: Envía mensaje a un número específico
- **sendMessageToGroup(groupJid, message)**: Envía mensaje a un grupo
- **getConnectionStatus()**: Obtiene el estado actual de la conexión
- **isReady()**: Verifica si la conexión está lista

### Manejo Automático de Eventos

- **Conexión**: Manejo automático de reconexión en caso de desconexión
- **Mensajes**: Respuesta automática a mensajes entrantes
- **Errores**: Logging de errores y manejo de excepciones

## ⚠️ Consideraciones Importantes

1. **Términos de Servicio**: El uso de APIs no oficiales puede violar los términos de servicio de WhatsApp
2. **Uso Responsable**: Evita prácticas que puedan considerarse spam
3. **Sesiones**: Las sesiones se guardan en la carpeta `auth/` para evitar reconexiones frecuentes
4. **Reconexión**: La aplicación maneja automáticamente las reconexiones

## 🐛 Solución de Problemas

### Error de Conexión

- Verifica que el código QR se haya escaneado correctamente
- Asegúrate de que no haya otra sesión activa de WhatsApp Web

### Mensajes No Enviados

- Verifica que la conexión esté activa con `GET /api/whatsapp/status`
- Asegúrate de que el JID del destinatario sea correcto

### Reconexión Frecuente

- Verifica la estabilidad de tu conexión a internet
- Revisa los logs para identificar errores específicos

## 📝 Logs

La aplicación genera logs detallados que incluyen:

- Estado de conexión
- Mensajes enviados y recibidos
- Errores y excepciones
- Eventos de reconexión

Los logs se muestran en la consola y pueden ser configurados según las necesidades del proyecto.
