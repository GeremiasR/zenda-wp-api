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

  // Métodos específicos para sesiones de WhatsApp
  public async saveSessionData(
    shopId: string,
    sessionData: any
  ): Promise<void> {
    const key = `session:shop:${shopId}`;
    await this.getClient().setEx(key, 86400, JSON.stringify(sessionData)); // 24 horas
  }

  public async getSessionData(shopId: string): Promise<any | null> {
    const key = `session:shop:${shopId}`;
    const data = await this.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }

  public async saveCredentials(shopId: string, creds: any): Promise<void> {
    const key = `session:shop:${shopId}:creds`;
    await this.getClient().setEx(key, 86400, JSON.stringify(creds));
  }

  public async getCredentials(shopId: string): Promise<any | null> {
    const key = `session:shop:${shopId}:creds`;
    const data = await this.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }

  public async saveKeys(shopId: string, keys: any): Promise<void> {
    const key = `session:shop:${shopId}:keys`;
    await this.getClient().setEx(key, 86400, JSON.stringify(keys));
  }

  public async getKeys(shopId: string): Promise<any | null> {
    const key = `session:shop:${shopId}:keys`;
    const data = await this.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }

  public async saveQRCode(shopId: string, qr: string): Promise<void> {
    const key = `session:shop:${shopId}:qr`;
    await this.getClient().setEx(key, 300, qr); // 5 minutos
  }

  public async getQRCode(shopId: string): Promise<string | null> {
    const key = `session:shop:${shopId}:qr`;
    return await this.getClient().get(key);
  }

  public async deleteSession(shopId: string): Promise<void> {
    const keys = [
      `session:shop:${shopId}`,
      `session:shop:${shopId}:creds`,
      `session:shop:${shopId}:keys`,
      `session:shop:${shopId}:qr`,
    ];

    await this.getClient().del(keys);
  }

  public async isSessionActive(shopId: string): Promise<boolean> {
    const key = `session:shop:${shopId}`;
    const exists = await this.getClient().exists(key);
    return exists === 1;
  }

  public async getAllActiveSessions(): Promise<string[]> {
    const pattern = "session:shop:*:creds";
    const keys = await this.getClient().keys(pattern);
    return keys.map((key) =>
      key.replace("session:shop:", "").replace(":creds", "")
    );
  }
}

// Instancia singleton del servicio
export const redisService = new RedisService();
