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
 * Verifica que el token sea válido y agrega el payload del token a la request
 * NO consulta la base de datos para mejorar el rendimiento
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

    // Agregar payload del token a la request (sin consultar DB)
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
 * No falla si no hay token, pero agrega el payload si existe
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
      req.tokenPayload = tokenPayload;
    }

    next();
  } catch (error) {
    // En caso de error, continuar sin autenticación
    next();
  }
};

/**
 * Middleware para cargar el usuario completo desde la base de datos
 * Usar solo cuando se necesite información adicional del usuario más allá del token
 * Requiere que authenticateToken se haya ejecutado antes
 */
export const loadUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tokenPayload) {
      throw Boom.unauthorized("Autenticación requerida");
    }

    // Obtener información completa del usuario desde la DB
    const user = await authService.getUserFromToken(
      req.headers.authorization?.split(" ")[1] || ""
    );

    if (!user) {
      throw Boom.unauthorized("Usuario no encontrado");
    }

    if (!user.isActive) {
      throw Boom.unauthorized("Usuario inactivo");
    }

    // Agregar información completa del usuario a la request
    req.user = user;

    next();
  } catch (error) {
    if (Boom.isBoom(error)) {
      next(error);
    } else {
      next(Boom.unauthorized("Error al cargar usuario"));
    }
  }
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga uno de los roles permitidos
 * Usa el roleCode del token (no consulta DB)
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tokenPayload) {
      next(Boom.unauthorized("Autenticación requerida"));
      return;
    }

    if (!allowedRoles.includes(req.tokenPayload.roleCode)) {
      next(Boom.forbidden("Permisos insuficientes"));
      return;
    }

    next();
  };
};

/**
 * Middleware de autorización por tienda
 * Verifica que el usuario pertenezca a la tienda especificada
 * Usa el shopId del token (no consulta DB)
 */
export const requireShop = (shopIdParam: string = "shopId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tokenPayload) {
      next(Boom.unauthorized("Autenticación requerida"));
      return;
    }

    const requestedShopId = req.params[shopIdParam] || req.body.shopId;

    if (!requestedShopId) {
      next(Boom.badRequest("ID de tienda requerido"));
      return;
    }

    // Los administradores pueden acceder a cualquier tienda
    if (req.tokenPayload.roleCode === "ADMIN") {
      next();
      return;
    }

    // Verificar que el usuario pertenezca a la tienda
    if (req.tokenPayload.shopId !== requestedShopId) {
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
