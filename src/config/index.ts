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
    apiToken: process.env.WHATSAPP_API_TOKEN || "",
    apiUrl: process.env.WHATSAPP_API_URL || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  },

  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || "default_secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
};

export default config;
