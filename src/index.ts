import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./config";
import routes from "./routes";
import { logger } from "./middlewares/logger.middleware";
import { whatsappService } from "./services/whatsapp.service";
import { databaseService } from "./services/database.service";

// Crear instancia de Express
const app = express();

// Configurar middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Configurar rutas
app.use("/api", routes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido a la API de WhatsApp de Zenda",
    version: process.env.npm_package_version || "0.1.0",
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Iniciar servidor
const PORT = config.server.port;
app.listen(PORT, async () => {
  console.log(
    `Servidor iniciado en el puerto ${PORT} en modo ${config.server.nodeEnv}`
  );

  try {
    // Conectar a MongoDB
    console.log("Conectando a MongoDB...");
    await databaseService.connect();
    console.log("MongoDB conectado exitosamente");

    // Inicializar WhatsApp automáticamente en desarrollo
    if (config.server.nodeEnv === "development") {
      try {
        console.log("Iniciando conexión con WhatsApp...");
        await whatsappService.connect();
      } catch (error) {
        console.error("Error al inicializar WhatsApp:", error);
      }
    }
  } catch (error) {
    console.error("Error al inicializar servicios:", error);
    process.exit(1);
  }
});

// Manejo de errores no capturados
process.on("uncaughtException", (error) => {
  console.error("Error no capturado:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Promesa rechazada no manejada:", error);
  process.exit(1);
});

export default app;
