import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import authService from "../services/auth.service";
import { IUser } from "../models";

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      tokenPayload?: {
        sub: string;
        email: string;
        roleCode: string;
        shopId: string;
      };
    }
  }
}

/**
 * Middleware de autenticación JWT
 * Verifica que el token sea válido y agrega la información del usuario a la request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      throw Boom.unauthorized("Token de acceso requerido");
    }

    // Verificar y decodificar el token
    const tokenPayload = authService.verifyAccessToken(token);

    // Obtener información completa del usuario
    const user = await authService.getUserFromToken(token);

    if (!user) {
      throw Boom.unauthorized("Usuario no encontrado");
    }

    if (!user.isActive) {
      throw Boom.unauthorized("Usuario inactivo");
    }

    // Agregar información del usuario a la request
    req.user = user;
    req.tokenPayload = tokenPayload;

    next();
  } catch (error) {
    if (Boom.isBoom(error)) {
      next(error);
    } else {
      next(Boom.unauthorized("Error de autenticación"));
    }
  }
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega el usuario si existe
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const tokenPayload = authService.verifyAccessToken(token);
      const user = await authService.getUserFromToken(token);

      if (user && user.isActive) {
        req.user = user;
        req.tokenPayload = tokenPayload;
      }
    }

    next();
  } catch (error) {
    // En caso de error, continuar sin autenticación
    next();
  }
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga uno de los roles permitidos
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(Boom.unauthorized("Autenticación requerida"));
      return;
    }

    if (!allowedRoles.includes(req.user.roleCode)) {
      next(Boom.forbidden("Permisos insuficientes"));
      return;
    }

    next();
  };
};

/**
 * Middleware de autorización por tienda
 * Verifica que el usuario pertenezca a la tienda especificada
 */
export const requireShop = (shopIdParam: string = "shopId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(Boom.unauthorized("Autenticación requerida"));
      return;
    }

    const requestedShopId = req.params[shopIdParam] || req.body.shopId;

    if (!requestedShopId) {
      next(Boom.badRequest("ID de tienda requerido"));
      return;
    }

    // Los administradores pueden acceder a cualquier tienda
    if (req.user.roleCode === "ADMIN") {
      next();
      return;
    }

    // Verificar que el usuario pertenezca a la tienda
    if (req.user.shopId.toString() !== requestedShopId) {
      next(Boom.forbidden("No tienes acceso a esta tienda"));
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
export const requireAdmin = requireRole("ADMIN");

/**
 * Middleware para verificar que el usuario sea administrador de tienda o superior
 */
export const requireShopAdmin = requireRole("ADMIN", "SHOPADMIN");

/**
 * Middleware para verificar que el usuario sea usuario de tienda o superior
 */
export const requireShopUser = requireRole("ADMIN", "SHOPADMIN", "SHOPUSER");
