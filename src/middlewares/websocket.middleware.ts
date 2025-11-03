import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import authService, { TokenPayload } from "../services/auth.service";

/**
 * Middleware de autenticación para WebSocket
 * Verifica el token JWT en el handshake de conexión
 *
 * El token puede venir en:
 * - query.token (recomendado)
 * - handshake.auth.token
 * - handshake.headers.authorization (Bearer token)
 */
export async function authenticateWebSocket(
  socket: Socket,
  next: (err?: ExtendedError) => void
): Promise<void> {
  try {
    let token: string | undefined;

    // Intentar obtener el token desde diferentes lugares
    // 1. Desde query string
    if (socket.handshake.query.token) {
      token = Array.isArray(socket.handshake.query.token)
        ? socket.handshake.query.token[0]
        : socket.handshake.query.token;
    }
    // 2. Desde auth object
    else if ((socket.handshake.auth as any)?.token) {
      token = (socket.handshake.auth as any).token;
    }
    // 3. Desde Authorization header
    else if (socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }
    }

    // Si no hay token, rechazar la conexión
    if (!token) {
      console.warn("Intento de conexión WebSocket sin token");
      return next(new Error("Token de autenticación requerido"));
    }

    // Verificar y decodificar el token
    try {
      const tokenPayload = authService.verifyAccessToken(token);

      // Adjuntar el payload al socket para uso posterior
      (socket as any).tokenPayload = tokenPayload;

      // Conexión autenticada exitosamente
      next();
    } catch (error) {
      console.warn("Token WebSocket inválido:", error);
      return next(new Error("Token inválido o expirado"));
    }
  } catch (error) {
    console.error("Error en autenticación WebSocket:", error);
    return next(new Error("Error de autenticación"));
  }
}

/**
 * Middleware opcional para verificar que el socket tiene tokenPayload
 * Útil para handlers que requieren autenticación
 */
export function requireAuth(socket: Socket): TokenPayload {
  const tokenPayload = (socket as any).tokenPayload as TokenPayload;
  if (!tokenPayload) {
    throw new Error("Socket no autenticado");
  }
  return tokenPayload;
}
