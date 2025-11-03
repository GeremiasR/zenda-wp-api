import { redisService } from "./redis.service";
import { WebSocketSession } from "../types/websocket.types";
import { websocketConfig } from "../config/websocket.config";
import { parseJWTExpiresInToSeconds } from "../utils/jwt-ttl.utils";

/**
 * Servicio para gestionar sesiones WebSocket en Redis
 */
export class WebSocketSessionService {
  /**
   * Guarda una sesión WebSocket en Redis
   * @param userId ID del usuario
   * @param session Datos de la sesión
   * @param ttl TTL en segundos (opcional, si no se proporciona usa el del access_token)
   */
  async saveSession(
    userId: string,
    session: Omit<WebSocketSession, "userId">,
    ttl?: number
  ): Promise<void> {
    try {
      const client = redisService.getClient();
      const key = `${websocketConfig.redisKeyPrefix.session}${userId}`;

      const sessionData: WebSocketSession = {
        ...session,
        userId,
      };

      // Calcular TTL: usar el proporcionado o calcular desde JWT_EXPIRES_IN
      let sessionTTL: number;
      if (ttl !== undefined) {
        sessionTTL = ttl;
      } else {
        // Calcular TTL desde JWT_EXPIRES_IN (igual al del access_token)
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
        sessionTTL = parseJWTExpiresInToSeconds(jwtExpiresIn);
      }

      // Guardar en Redis con TTL igual al del access_token
      await client.setEx(
        key,
        sessionTTL,
        JSON.stringify(sessionData)
      );

      console.log(`Sesión WebSocket guardada para userId=${userId} con TTL=${sessionTTL}s`);
    } catch (error) {
      console.error("Error al guardar sesión WebSocket:", error);
      throw error;
    }
  }

  /**
   * Obtiene una sesión WebSocket desde Redis
   * @param userId ID del usuario
   * @returns Sesión o null si no existe
   */
  async getSession(userId: string): Promise<WebSocketSession | null> {
    try {
      const client = redisService.getClient();
      const key = `${websocketConfig.redisKeyPrefix.session}${userId}`;

      const data = await client.get(key);
      if (!data) {
        return null;
      }

      return JSON.parse(data) as WebSocketSession;
    } catch (error) {
      console.error("Error al obtener sesión WebSocket:", error);
      return null;
    }
  }

  /**
   * Elimina una sesión WebSocket de Redis
   * @param userId ID del usuario
   */
  async deleteSession(userId: string): Promise<void> {
    try {
      const client = redisService.getClient();
      const key = `${websocketConfig.redisKeyPrefix.session}${userId}`;

      await client.del(key);
    } catch (error) {
      console.error("Error al eliminar sesión WebSocket:", error);
      throw error;
    }
  }

  /**
   * Actualiza el lastEventId de una sesión
   * @param userId ID del usuario
   * @param lastEventId Nuevo lastEventId
   */
  async updateLastEventId(userId: string, lastEventId: number): Promise<void> {
    try {
      const session = await this.getSession(userId);
      if (!session) {
        return;
      }

      session.lastEventId = lastEventId;
      await this.saveSession(userId, session);
    } catch (error) {
      console.error("Error al actualizar lastEventId:", error);
      throw error;
    }
  }

  /**
   * Actualiza el socketId de una sesión (útil para reconexiones)
   * @param userId ID del usuario
   * @param socketId Nuevo socketId
   */
  async updateSocketId(userId: string, socketId: string): Promise<void> {
    try {
      const session = await this.getSession(userId);
      if (!session) {
        return;
      }

      session.socketId = socketId;
      await this.saveSession(userId, session);
    } catch (error) {
      console.error("Error al actualizar socketId:", error);
      throw error;
    }
  }

  /**
   * Renueva el TTL de una sesión (usando el TTL del access_token)
   * @param userId ID del usuario
   */
  async renewSessionTTL(userId: string): Promise<void> {
    try {
      const session = await this.getSession(userId);
      if (!session) {
        return;
      }

      // Re-guardar la sesión para renovar el TTL (usará el TTL del access_token automáticamente)
      await this.saveSession(userId, session);
    } catch (error) {
      console.error("Error al renovar TTL de sesión:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las sesiones activas de un shopId
   * @param shopId ID de la tienda
   * @returns Lista de sesiones
   */
  async getSessionsByShopId(shopId: string): Promise<WebSocketSession[]> {
    try {
      const client = redisService.getClient();
      const pattern = `${websocketConfig.redisKeyPrefix.session}*`;

      const keys = await client.keys(pattern);
      const sessions: WebSocketSession[] = [];

      for (const key of keys) {
        const data = await client.get(key);
        if (data) {
          const session = JSON.parse(data) as WebSocketSession;
          if (session.shopId === shopId) {
            sessions.push(session);
          }
        }
      }

      return sessions;
    } catch (error) {
      console.error("Error al obtener sesiones por shopId:", error);
      return [];
    }
  }
}

// Instancia singleton del servicio
export const webSocketSessionService = new WebSocketSessionService();

