import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import { permissionCacheService } from "../services/permission-cache.service";
import { permissionService } from "../services/permission.service";
import { TokenPayload } from "../services/auth.service";

/**
 * Acciones críticas que requieren verificación en Redis
 */
const CRITICAL_ACTIONS = ["create", "update", "delete", "manage"];

/**
 * Middleware de autorización basado en módulos y acciones
 * 
 * - Para acciones críticas (CREATE/UPDATE/DELETE): consulta Redis como fuente de verdad
 * - Para acciones de lectura (VIEW): solo usa el token (sin consultar Redis)
 * 
 * @param module Módulo requerido (ej: "user", "shop", "orders")
 * @param action Acción requerida (ej: "view", "create", "update", "delete")
 * @returns Middleware de Express
 */
export const authorize = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verificar que el usuario está autenticado
      if (!req.tokenPayload) {
        next(Boom.unauthorized("Autenticación requerida"));
        return;
      }

      const tokenPayload = req.tokenPayload as TokenPayload;
      const userId = tokenPayload.sub;
      const isCriticalAction = CRITICAL_ACTIONS.includes(action.toLowerCase());

      let permissions;

      if (isCriticalAction) {
        // Para acciones críticas: consultar Redis como fuente de verdad
        permissions = await permissionCacheService.getUserPermissions(userId);

        // Si no está en Redis, usar permisos del token como fallback
        if (!permissions) {
          console.warn(`Permisos no encontrados en Redis para userId=${userId}, usando token como fallback`);
          
          // Construir objeto de permisos desde el token
          permissions = {
            modules: Object.keys(tokenPayload.permissions || {}),
            permissions: tokenPayload.permissions || {},
          };
        }
      } else {
        // Para acciones de lectura (view): solo usar token (sin consultar Redis)
        permissions = {
          modules: Object.keys(tokenPayload.permissions || {}),
          permissions: tokenPayload.permissions || {},
        };
      }

      // Verificar si tiene el permiso requerido
      const hasPermission = permissionService.hasPermission(permissions, module, action);

      if (!hasPermission) {
        next(
          Boom.forbidden(
            `Permisos insuficientes. Se requiere el módulo '${module}' con acción '${action}'`
          )
        );
        return;
      }

      // Usuario autorizado, continuar
      next();
    } catch (error) {
      console.error("Error en middleware de autorización:", error);
      next(Boom.internal("Error al verificar permisos"));
    }
  };
};

/**
 * Middleware de autorización múltiple (OR)
 * Permite acceso si tiene cualquiera de los permisos especificados
 * 
 * Para acciones críticas consulta Redis, para VIEW solo usa el token.
 * 
 * @param permissions Array de permisos [module, action]
 * @returns Middleware de Express
 */
export const authorizeAny = (
  permissions: Array<{ module: string; action: string }>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tokenPayload) {
        next(Boom.unauthorized("Autenticación requerida"));
        return;
      }

      const tokenPayload = req.tokenPayload as TokenPayload;
      const userId = tokenPayload.sub;

      // Verificar si alguna acción es crítica
      const hasCriticalAction = permissions.some((perm) =>
        CRITICAL_ACTIONS.includes(perm.action.toLowerCase())
      );

      let userPermissions;

      if (hasCriticalAction) {
        // Si hay alguna acción crítica, consultar Redis
        userPermissions = await permissionCacheService.getUserPermissions(userId);

        // Si no está en Redis, usar token como fallback
        if (!userPermissions) {
          userPermissions = {
            modules: Object.keys(tokenPayload.permissions || {}),
            permissions: tokenPayload.permissions || {},
          };
        }
      } else {
        // Solo acciones de lectura, usar token
        userPermissions = {
          modules: Object.keys(tokenPayload.permissions || {}),
          permissions: tokenPayload.permissions || {},
        };
      }

      // Verificar si tiene alguno de los permisos requeridos
      const hasAnyPermission = permissions.some((perm) =>
        permissionService.hasPermission(userPermissions, perm.module, perm.action)
      );

      if (!hasAnyPermission) {
        next(Boom.forbidden("Permisos insuficientes"));
        return;
      }

      next();
    } catch (error) {
      console.error("Error en middleware de autorización múltiple:", error);
      next(Boom.internal("Error al verificar permisos"));
    }
  };
};

/**
 * Middleware de autorización múltiple (AND)
 * Requiere que tenga todos los permisos especificados
 * 
 * Para acciones críticas consulta Redis, para VIEW solo usa el token.
 * 
 * @param permissions Array de permisos [module, action]
 * @returns Middleware de Express
 */
export const authorizeAll = (
  permissions: Array<{ module: string; action: string }>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tokenPayload) {
        next(Boom.unauthorized("Autenticación requerida"));
        return;
      }

      const tokenPayload = req.tokenPayload as TokenPayload;
      const userId = tokenPayload.sub;

      // Verificar si alguna acción es crítica
      const hasCriticalAction = permissions.some((perm) =>
        CRITICAL_ACTIONS.includes(perm.action.toLowerCase())
      );

      let userPermissions;

      if (hasCriticalAction) {
        // Si hay alguna acción crítica, consultar Redis
        userPermissions = await permissionCacheService.getUserPermissions(userId);

        // Si no está en Redis, usar token como fallback
        if (!userPermissions) {
          userPermissions = {
            modules: Object.keys(tokenPayload.permissions || {}),
            permissions: tokenPayload.permissions || {},
          };
        }
      } else {
        // Solo acciones de lectura, usar token
        userPermissions = {
          modules: Object.keys(tokenPayload.permissions || {}),
          permissions: tokenPayload.permissions || {},
        };
      }

      // Verificar si tiene todos los permisos requeridos
      const hasAllPermissions = permissions.every((perm) =>
        permissionService.hasPermission(userPermissions, perm.module, perm.action)
      );

      if (!hasAllPermissions) {
        next(Boom.forbidden("Permisos insuficientes"));
        return;
      }

      next();
    } catch (error) {
      console.error("Error en middleware de autorización múltiple:", error);
      next(Boom.internal("Error al verificar permisos"));
    }
  };
};

