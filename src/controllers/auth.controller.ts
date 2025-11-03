import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import authService, {
  LoginCredentials,
  RefreshTokenRequest,
} from "../services/auth.service";

class AuthController {
  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Autenticar usuario
   *     description: Autentica un usuario con email y contraseña, devuelve tokens JWT
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login exitoso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Login exitoso"
   *                 data:
   *                   $ref: '#/components/schemas/AuthTokens'
   *       400:
   *         description: Datos de entrada inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Credenciales inválidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validar datos de entrada
      if (!email || !password) {
        throw Boom.badRequest("Email y contraseña son requeridos");
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw Boom.badRequest("Formato de email inválido");
      }

      const credentials: LoginCredentials = { email, password };

      // Obtener información del cliente para auditoría
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      const tokens = await authService.login(credentials, ip, userAgent);

      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/refresh
   * Renueva un access token usando un refresh token
   */
  async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw Boom.badRequest("Refresh token es requerido");
      }

      const refreshRequest: RefreshTokenRequest = { refresh_token };
      const tokens = await authService.refreshToken(refreshRequest);

      res.status(200).json({
        success: true,
        message: "Token renovado exitosamente",
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   * Revoca un refresh token (logout)
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw Boom.badRequest("Refresh token es requerido");
      }

      await authService.logout(refresh_token);

      res.status(200).json({
        success: true,
        message: "Logout exitoso",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout-all
   * Revoca todos los refresh tokens del usuario autenticado
   */
  async logoutAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tokenPayload) {
        throw Boom.unauthorized("Usuario no autenticado");
      }

      await authService.logoutAll(req.tokenPayload.sub);

      res.status(200).json({
        success: true,
        message: "Logout de todos los dispositivos exitoso",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   * Obtiene información del usuario autenticado
   * Nota: Requiere middleware loadUser para obtener información completa
   */
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Este endpoint requiere el middleware loadUser
      if (!req.user) {
        throw Boom.unauthorized("Usuario no autenticado");
      }

      // Obtener información del usuario sin la contraseña
      // Incluir permisos desde el token payload (ya que está disponible sin consultar Redis)
      const userProfile = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        roles: req.user.roles || [],
        permissions: req.tokenPayload?.permissions || {},
        shopId: req.user.shopId,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      };

      res.status(200).json({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: userProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/verify
   * Verifica si un token es válido
   */
  async verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        throw Boom.badRequest("Token es requerido");
      }

      const payload = authService.verifyAccessToken(token);

      res.status(200).json({
        success: true,
        message: "Token válido",
        data: {
          valid: true,
          payload,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Token inválido",
        data: {
          valid: false,
        },
      });
    }
  }

  /**
   * GET /auth/health
   * Endpoint de salud para el servicio de autenticación
   */
  async health(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: "Servicio de autenticación funcionando correctamente",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
