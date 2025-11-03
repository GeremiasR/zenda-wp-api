import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import config from "./config";
import routes from "./routes";
import { logger } from "./middlewares/logger.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { setupSwagger } from "./middlewares/swagger.middleware";
import { whatsappManagerService } from "./services/whatsapp-manager.service";
import { whatsappMultitenantManagerService } from "./services/whatsapp-multitenant-manager.service";
import { databaseService } from "./services/database.service";
import { redisService } from "./services/redis.service";
import { redisQueueService } from "./services/redis-queue.service";
import { messageQueueConsumer } from "./queue/consumer";
import { initializeRoles } from "./utils/init-roles";
import { createDefaultAdmin } from "./utils/create-admin-user";
import { testBaileysConnection } from "./utils/test-baileys-connection";
import { webSocketService } from "./services/websocket.service";

// Crear instancia de Express
const app = express();

// Crear servidor HTTP
const httpServer = createServer(app);

// Configurar middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Configurar Swagger UI
setupSwagger(app);

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
app.use(notFoundHandler);

// Manejo de errores (debe ir al final)
app.use(errorHandler);

// Inicializar WebSocket Server
webSocketService.initialize(httpServer);

// Iniciar servidor
const PORT = config.server.port;
httpServer.listen(PORT, async () => {
  console.log(
    `Servidor iniciado en el puerto ${PORT} en modo ${config.server.nodeEnv}`
  );

  try {
    // Conectar a MongoDB
    console.log("Conectando a MongoDB...");
    await databaseService.connect();
    console.log("MongoDB conectado exitosamente");

    // Conectar a Redis (para sesiones)
    console.log("Conectando a Redis (sesiones)...");
    await redisService.connect();
    console.log("Redis (sesiones) conectado exitosamente");

    // Conectar a Redis Queue (para BullMQ)
    console.log("Conectando a Redis Queue (BullMQ)...");
    await redisQueueService.connect();
    console.log("Redis Queue (BullMQ) conectado exitosamente");

    // Inicializar worker de mensajes
    console.log("Inicializando worker de mensajes...");
    await messageQueueConsumer.start();
    console.log("Worker de mensajes inicializado exitosamente");

    // Inicializar roles por defecto
    console.log("Inicializando roles por defecto...");
    await initializeRoles();

    // Crear usuario administrador por defecto (solo en desarrollo)
    if (config.server.nodeEnv === "development") {
      try {
        await createDefaultAdmin();
      } catch (error) {
        console.log(
          "Usuario administrador ya existe o error al crearlo:",
          error
        );
      }
    }

    // Inicializar sesiones existentes de WhatsApp
    try {
      console.log("Inicializando sesiones existentes de WhatsApp...");
      await whatsappManagerService.initializeExistingSessions();
    } catch (error) {
      console.error("Error al inicializar sesiones de WhatsApp:", error);
    }

    // Inicializar sesiones multitenant existentes
    try {
      console.log("Inicializando sesiones multitenant existentes...");
      await whatsappMultitenantManagerService.initializeExistingSessions();
    } catch (error) {
      console.error("Error al inicializar sesiones multitenant:", error);
    }

    // Prueba de conexión Baileys con guardado en archivos (solo en desarrollo)
    /*     if (config.server.nodeEnv === "development") {
      try {
        console.log("🧪 Iniciando prueba de conexión Baileys (guardado en archivos)...");
        await testBaileysConnection();
      } catch (error) {
        console.error("Error en prueba de conexión Baileys:", error);
      }
    } */
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

// Manejo de señales para shutdown graceful
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} recibida. Cerrando servidor...`);

  try {
    // Detener worker de mensajes
    console.log("Deteniendo worker de mensajes...");
    await messageQueueConsumer.stop();

    // Cerrar WebSocket Server
    console.log("Cerrando WebSocket Server...");
    await webSocketService.close();

    // Desconectar de Redis Queue
    await redisQueueService.disconnect();

    // Cerrar servidor HTTP
    httpServer.close(() => {
      console.log("Servidor HTTP cerrado");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error durante shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
