import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, RefreshToken } from "../models";
import { IUser, IRefreshToken } from "../models";
import Boom from "@hapi/boom";

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-super-seguro";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Interfaces para los tokens
export interface TokenPayload {
  sub: string; // user ID
  email: string;
  roleCode: string;
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

    // Generar tokens
    const tokenPayload: TokenPayload = {
      sub: (user._id as any).toString(),
      email: user.email,
      roleCode: user.roleCode,
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

    // Generar nuevos tokens
    const tokenPayload: TokenPayload = {
      sub: (user._id as any).toString(),
      email: user.email,
      roleCode: user.roleCode,
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
