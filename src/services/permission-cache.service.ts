import { redisService } from "./redis.service";
import { ConsolidatedPermissions } from "./permission.service";
import { parseJWTExpiresInToSeconds } from "../utils/jwt-ttl.utils";

/**
 * Servicio para cachear permisos de usuarios en Redis
 */
export class PermissionCacheService {
  private readonly REDIS_KEY_PREFIX = "permissions:user:";

  /**
   * Guarda permisos de un usuario en Redis
   * @param userId ID del usuario
   * @param permissions Permisos consolidados
   */
  async saveUserPermissions(
    userId: string,
    permissions: ConsolidatedPermissions
  ): Promise<void> {
    try {
      const client = redisService.getClient();
      const key = `${this.REDIS_KEY_PREFIX}${userId}`;

      // Calcular TTL desde JWT_EXPIRES_IN (igual al access_token)
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
      const ttl = parseJWTExpiresInToSeconds(jwtExpiresIn);

      // Guardar permisos en Redis con TTL
      await client.setEx(key, ttl, JSON.stringify(permissions));

      console.log(
        `Permisos guardados en Redis para userId=${userId} con TTL=${ttl}s`
      );
    } catch (error) {
      console.error("Error al guardar permisos en Redis:", error);
      throw error;
    }
  }

  /**
   * Obtiene permisos de un usuario desde Redis
   * @param userId ID del usuario
   * @returns Permisos consolidados o null si no existe
   */
  async getUserPermissions(
    userId: string
  ): Promise<ConsolidatedPermissions | null> {
    try {
      const client = redisService.getClient();
      const key = `${this.REDIS_KEY_PREFIX}${userId}`;

      const data = await client.get(key);
      if (!data) {
        return null;
      }

      return JSON.parse(data) as ConsolidatedPermissions;
    } catch (error) {
      console.error("Error al obtener permisos de Redis:", error);
      return null;
    }
  }

  /**
   * Elimina permisos de un usuario de Redis
   * @param userId ID del usuario
   */
  async deleteUserPermissions(userId: string): Promise<void> {
    try {
      const client = redisService.getClient();
      const key = `${this.REDIS_KEY_PREFIX}${userId}`;

      await client.del(key);
    } catch (error) {
      console.error("Error al eliminar permisos de Redis:", error);
      throw error;
    }
  }

  /**
   * Renueva el TTL de los permisos de un usuario
   * @param userId ID del usuario
   * @param permissions Permisos consolidados (opcional, si no se proporciona se obtiene de Redis)
   */
  async renewPermissionsTTL(
    userId: string,
    permissions?: ConsolidatedPermissions
  ): Promise<void> {
    try {
      if (!permissions) {
        const cachedPermissions = await this.getUserPermissions(userId);
        if (!cachedPermissions) {
          return;
        }
        permissions = cachedPermissions;
      }

      // Re-guardar para renovar el TTL
      await this.saveUserPermissions(userId, permissions);
    } catch (error) {
      console.error("Error al renovar TTL de permisos:", error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const permissionCacheService = new PermissionCacheService();
