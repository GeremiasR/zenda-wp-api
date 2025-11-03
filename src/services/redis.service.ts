import { createClient, RedisClientType } from "redis";
import config from "../config";

export class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  public async connect(): Promise<void> {
    try {
      // Si hay URL completa, usarla; si no, construir desde host/port
      let redisConfig;

      if (config.redis?.url) {
        // Si hay URL, usarla directamente
        redisConfig = { url: config.redis.url };
      } else {
        // Construir configuración desde host/port
        redisConfig = {
          socket: {
            host: config.redis?.host || "localhost",
            port: config.redis?.port || 6379,
          },
          password: config.redis?.password,
          database:
            typeof config.redis?.database === "string"
              ? parseInt(config.redis.database) || 0
              : config.redis?.database || 0,
        };
      }

      this.client = createClient(redisConfig);

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis conectado exitosamente");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        console.log("Redis desconectado");
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error("Error al conectar con Redis:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }

  public isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  public getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis no está conectado");
    }
    return this.client;
  }

  // Redis ahora solo se usa para BullMQ (colas y workers)
  // Las sesiones de WhatsApp se manejan en MongoDB
}

// Instancia singleton del servicio
export const redisService = new RedisService();
