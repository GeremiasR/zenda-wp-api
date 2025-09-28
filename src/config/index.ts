import dotenv from "dotenv";
import path from "path";

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
  },

  // Configuración de WhatsApp
  whatsapp: {
    sessionName: process.env.WHATSAPP_SESSION_NAME || "zenda-session",
    maxReconnectAttempts: parseInt(
      process.env.WHATSAPP_MAX_RECONNECT_ATTEMPTS || "5"
    ),
    reconnectDelay: parseInt(process.env.WHATSAPP_RECONNECT_DELAY || "5000"),
  },

  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || "default_secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
};

export default config;
