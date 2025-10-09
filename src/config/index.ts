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

  // Configuración de MongoDB
  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/zenda-mvp",
    database: process.env.MONGODB_DATABASE || "zenda-mvp",
  },

  // Configuración de Redis
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DATABASE || "0"),
  },
};

export default config;
