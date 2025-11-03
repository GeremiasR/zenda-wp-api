import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, RefreshToken } from "../models";
import { IUser, IRefreshToken } from "../models";
import Boom from "@hapi/boom";
import { permissionService } from "./permission.service";
import { permissionCacheService } from "./permission-cache.service";

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-super-seguro";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Interfaces para los tokens
export interface TokenPayload {
  sub: string; // user ID
  email: string;
  roles: string[]; // Array de códigos de roles
  permissions: Record<string, string[]>; // Módulo → Acciones permitidas (ej: { "user": ["view", "create"], "shop": ["view"] })
  shopId: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

class AuthService {
  /**
   * Genera un access token JWT
   */
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "zenda-wp-api",
      audience: "zenda-client",
    } as jwt.SignOptions);
  }

  /**
   * Genera un refresh token aleatorio
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Calcula la fecha de expiración del refresh token
   */
  private getRefreshTokenExpiration(): Date {
    const expirationDays = parseInt(REFRESH_TOKEN_EXPIRES_IN.replace("d", ""));
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);
    return expirationDate;
  }

  /**
   * Autentica un usuario con email y contraseña
   */
  async login(
    credentials: LoginCredentials,
    ip?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    const { email, password } = credentials;

    // Buscar usuario por email
    const user = await User.findOne({ email, isActive: true }).populate(
      "shopId"
    );
    if (!user) {
      throw Boom.unauthorized("Credenciales inválidas");
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw Boom.unauthorized("Credenciales inválidas");
    }

    // Calcular permisos consolidados del usuario basándose en sus roles
    const userRoles = (user.roles as string[]) || [];
    const permissions = await permissionService.calculateUserPermissions(userRoles);

    // Si no hay permisos, el usuario no tiene roles asignados
    if (!permissions) {
      console.warn(`Usuario ${user._id} no tiene roles asignados o sus roles no tienen permisos`);
    }

    // Guardar permisos en Redis (cache)
    if (permissions) {
      try {
        await permissionCacheService.saveUserPermissions(
          (user._id as any).toString(),
          permissions
        );
      } catch (error) {
        console.error("Error al guardar permisos en Redis:", error);
        // No fallar el login si Redis falla, pero loguear el error
      }
    }

    // Generar tokens con permisos
    const tokenPayload: TokenPayload = {
      sub: (user._id as any).toString(),
      email: user.email,
      roles: userRoles,
      permissions: permissions?.permissions || {},
      shopId: (user.shopId as any)._id.toString(),
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshTokenValue = this.generateRefreshToken();
    const expiresAt = this.getRefreshTokenExpiration();

    // Guardar refresh token en la base de datos
    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: refreshTokenValue,
      expiresAt,
      ip,
      userAgent,
    });

    await refreshTokenDoc.save();

    // El WebSocket se inicializa automáticamente cuando el cliente se conecta
    // después de recibir el access_token. No es necesario hacer nada aquí ya que
    // el cliente debe conectarse usando el token recibido.
    // Para futuras implementaciones: aquí se podría emitir un evento de login_successful
    // o notificar otros servicios sobre el login exitoso.

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
    };
  }

  /**
   * Renueva un access token usando un refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<AuthTokens> {
    const { refresh_token } = request;

    // Buscar el refresh token en la base de datos
    const refreshTokenDoc = await RefreshToken.findOne({
      token: refresh_token,
      revoked: false,
      expiresAt: { $gt: new Date() },
    }).populate("userId");

    if (!refreshTokenDoc) {
      throw Boom.unauthorized("Refresh token inválido o expirado");
    }

    const user = refreshTokenDoc.userId as unknown as IUser;

    // Verificar que el usuario sigue activo
    if (!user.isActive) {
      throw Boom.unauthorized("Usuario inactivo");
    }

    // Calcular permisos consolidados del usuario
    const userRoles = (user.roles as string[]) || [];
    const permissions = await permissionService.calculateUserPermissions(userRoles);

    // Guardar permisos en Redis (cache)
    if (permissions) {
      try {
        await permissionCacheService.saveUserPermissions(
          (user._id as any).toString(),
          permissions
        );
      } catch (error) {
        console.error("Error al guardar permisos en Redis:", error);
      }
    }

    // Generar nuevos tokens con permisos
    const tokenPayload: TokenPayload = {
      sub: (user._id as any).toString(),
      email: user.email,
      roles: userRoles,
      permissions: permissions?.permissions || {},
      shopId: (user.shopId as any).toString(),
    };

    const newAccessToken = this.generateAccessToken(tokenPayload);
    const newRefreshTokenValue = this.generateRefreshToken();
    const newExpiresAt = this.getRefreshTokenExpiration();

    // Revocar el refresh token anterior
    refreshTokenDoc.revoked = true;
    await refreshTokenDoc.save();

    // Guardar el nuevo refresh token
    const newRefreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: newRefreshTokenValue,
      expiresAt: newExpiresAt,
      ip: refreshTokenDoc.ip,
      userAgent: refreshTokenDoc.userAgent,
    });

    await newRefreshTokenDoc.save();

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshTokenValue,
    };
  }

  /**
   * Revoca un refresh token (logout)
   */
  async logout(refreshToken: string): Promise<void> {
    const refreshTokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      revoked: false,
    });

    if (refreshTokenDoc) {
      refreshTokenDoc.revoked = true;
      await refreshTokenDoc.save();
    }
  }

  /**
   * Revoca todos los refresh tokens de un usuario
   */
  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { userId, revoked: false },
      { revoked: true }
    );
  }

  /**
   * Verifica y decodifica un access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: "zenda-wp-api",
        audience: "zenda-client",
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw Boom.unauthorized("Token expirado");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw Boom.unauthorized("Token inválido");
      } else {
        throw Boom.unauthorized("Error de autenticación");
      }
    }
  }

  /**
   * Limpia tokens expirados (para usar en cron jobs)
   */
  async cleanExpiredTokens(): Promise<number> {
    const result = await RefreshToken.deleteMany({
      $or: [{ expiresAt: { $lt: new Date() } }, { revoked: true }],
    });

    return result.deletedCount || 0;
  }

  /**
   * Obtiene información del usuario desde el token
   */
  async getUserFromToken(token: string): Promise<IUser | null> {
    try {
      const payload = this.verifyAccessToken(token);
      const user = await User.findById(payload.sub).populate("shopId");
      return user;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
