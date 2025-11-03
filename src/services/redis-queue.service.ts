import Redis from "ioredis";
import config from "../config";

/**
 * Servicio de Redis para BullMQ
 * BullMQ requiere ioredis en lugar del cliente redis estándar
 */
export class RedisQueueService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  /**
   * Conecta a Redis usando ioredis
   */
  public async connect(): Promise<void> {
    try {
      // Si hay URL completa, usarla; si no, construir desde host/port
      let redisConfig: any;

      if (config.redis?.url) {
        // Si hay URL, usarla directamente
        redisConfig = config.redis.url;
      } else {
        // Construir configuración desde host/port
        redisConfig = {
          host: config.redis?.host || "localhost",
          port: config.redis?.port || 6379,
          password: config.redis?.password,
          db:
            typeof config.redis?.database === "string"
              ? parseInt(config.redis.database) || 0
              : config.redis?.database || 0,
        };
      }

      // Configurar maxRetriesPerRequest como null para BullMQ
      // BullMQ requiere esto para operaciones bloqueantes
      if (typeof redisConfig === "string") {
        // Si es una URL, crear cliente con maxRetriesPerRequest: null
        this.client = new Redis(redisConfig, {
          maxRetriesPerRequest: null,
        });
      } else {
        // Si es un objeto de configuración, agregar maxRetriesPerRequest: null
        this.client = new Redis({
          ...redisConfig,
          maxRetriesPerRequest: null,
        });
      }

      this.client.on("error", (err) => {
        console.error("Redis Queue Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis Queue conectado exitosamente");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        console.log("Redis Queue listo");
        this.isConnected = true;
      });

      this.client.on("close", () => {
        console.log("Redis Queue desconectado");
        this.isConnected = false;
      });

      // Esperar a que la conexión esté lista
      await new Promise<void>((resolve, reject) => {
        if (!this.client) {
          reject(new Error("Cliente Redis no inicializado"));
          return;
        }

        if (this.client.status === "ready") {
          this.isConnected = true;
          resolve();
          return;
        }

        this.client.once("ready", () => {
          this.isConnected = true;
          resolve();
        });

        this.client.once("error", (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error("Error al conectar con Redis Queue:", error);
      throw error;
    }
  }

  /**
   * Desconecta de Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Verifica si Redis está conectado y listo
   */
  public isReady(): boolean {
    return (
      this.isConnected && this.client !== null && this.client.status === "ready"
    );
  }

  /**
   * Obtiene el cliente Redis de ioredis
   * @throws Error si Redis no está conectado
   */
  public getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis Queue no está conectado");
    }
    return this.client;
  }

  /**
   * Obtiene la configuración de conexión para BullMQ
   * BullMQ acepta un cliente Redis directamente o un objeto de configuración
   * Si el cliente está conectado, lo retorna; si no, retorna la configuración
   */
  public getConnectionConfig():
    | Redis
    | {
        host: string;
        port: number;
        password?: string;
        db?: number;
        maxRetriesPerRequest: null;
      } {
    // Si el cliente está conectado y listo, retornarlo (BullMQ lo usará directamente)
    if (this.client && this.isReady()) {
      return this.client;
    }

    // Si no está conectado, retornar configuración para que BullMQ cree su propio cliente
    // BullMQ puede usar host/port o crear un nuevo cliente Redis con la configuración
    // IMPORTANTE: BullMQ requiere maxRetriesPerRequest: null para operaciones bloqueantes
    if (config.redis?.url) {
      // Si hay URL, crear un nuevo cliente Redis con la URL y maxRetriesPerRequest: null
      return new Redis(config.redis.url, {
        maxRetriesPerRequest: null,
      });
    }

    // Retornar configuración de host/port (BullMQ creará su propio cliente)
    // IMPORTANTE: Incluir maxRetriesPerRequest: null
    return {
      host: config.redis?.host || "localhost",
      port: config.redis?.port || 6379,
      password: config.redis?.password,
      db:
        typeof config.redis?.database === "string"
          ? parseInt(config.redis.database) || 0
          : config.redis?.database || 0,
      maxRetriesPerRequest: null, // Requerido por BullMQ para operaciones bloqueantes
    };
  }
}

// Instancia singleton del servicio
export const redisQueueService = new RedisQueueService();
