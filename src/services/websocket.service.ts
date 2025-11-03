import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { webSocketSessionService } from "./websocket-session.service";
import { webSocketEventService } from "./websocket-event.service";
import { websocketConfig } from "../config/websocket.config";
import { authenticateWebSocket } from "../middlewares/websocket.middleware";
import { TokenPayload } from "./auth.service";
import { SyncRequest, SyncResponse, WebSocketModule } from "../types/websocket.types";
import { permissionCacheService } from "./permission-cache.service";

/**
 * Servicio principal de WebSocket
 */
export class WebSocketService {
  private io: Server | null = null;
  private httpServer: HTTPServer | null = null;

  /**
   * Inicializa el servidor WebSocket adjuntándolo al servidor HTTP
   * @param httpServer Servidor HTTP de Express
   */
  initialize(httpServer: HTTPServer): void {
    // Crear instancia de Socket.IO
    this.io = new Server(httpServer, {
      cors: websocketConfig.cors,
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    this.httpServer = httpServer;

    // Inicializar el servicio de eventos (async, pero no esperamos para no bloquear)
    webSocketEventService.initialize(this.io).catch((error) => {
      console.error("Error al inicializar servicio de eventos WebSocket:", error);
    });

    // Configurar middleware de autenticación
    this.io.use(async (socket: Socket, next) => {
      try {
        await authenticateWebSocket(socket, next);
      } catch (error) {
        console.error("Error en autenticación WebSocket:", error);
        next(new Error("Autenticación fallida"));
      }
    });

    // Configurar handlers de conexión
    this.io.on("connection", (socket: Socket) => {
      this.handleConnection(socket);
    });

    console.log("WebSocket Server inicializado");
  }

  /**
   * Maneja una nueva conexión WebSocket
   * @param socket Socket del cliente
   */
  private async handleConnection(socket: Socket): Promise<void> {
    const tokenPayload = (socket as any).tokenPayload as TokenPayload;
    if (!tokenPayload) {
      console.error("Socket sin tokenPayload");
      socket.disconnect();
      return;
    }

    const userId = tokenPayload.sub;
    const shopId = tokenPayload.shopId;

    console.log(`Cliente WebSocket conectado: userId=${userId}, socketId=${socket.id}`);

    // Verificar si ya existe una sesión activa para este usuario
    const existingSession = await webSocketSessionService.getSession(userId);
    if (existingSession) {
      // Desconectar la sesión anterior
      console.log(`Desconectando sesión anterior para userId=${userId}, socketId=${existingSession.socketId}`);
      this.io?.sockets.sockets.get(existingSession.socketId)?.disconnect();
      await webSocketSessionService.deleteSession(userId);
    }

    // Obtener módulos y acciones del usuario desde Redis (permisos cacheados)
    let userModules: string[] = [];
    
    try {
      const permissions = await permissionCacheService.getUserPermissions(userId);
      
      if (permissions && permissions.modules) {
        // Mapear módulos RBAC a módulos WebSocket
        userModules = this.mapRBACModulesToWebSocketModules(permissions.modules);
        
        console.log(`Módulos WebSocket para userId=${userId}:`, userModules);
      } else {
        // Si no hay permisos en Redis, usar módulos del token como fallback
        console.warn(`Permisos no encontrados en Redis para userId=${userId}, usando token como fallback`);
        if (tokenPayload.permissions) {
          const rbacModules = Object.keys(tokenPayload.permissions);
          userModules = this.mapRBACModulesToWebSocketModules(rbacModules);
        }
      }
      
      // Si aún no hay módulos, usar "*" como fallback final
      if (userModules.length === 0) {
        console.warn(`No se encontraron módulos para userId=${userId}, usando "*" como fallback`);
        userModules = ["*"];
      }
    } catch (error) {
      console.error(`Error al obtener permisos para userId=${userId}:`, error);
      // Fallback a "*" si hay error
      userModules = ["*"];
    }

    await webSocketSessionService.saveSession(userId, {
      socketId: socket.id,
      modules: userModules, // Usar módulos reales del usuario
      shopId,
      connectedAt: Date.now(),
      lastEventId: 0,
    });

    // Enviar confirmación de conexión
    socket.emit("connected", {
      userId,
      shopId,
      modules: userModules,
      socketId: socket.id,
    });

    // Configurar handlers de eventos
    this.setupEventHandlers(socket, userId, shopId);

    // Manejar desconexión
    socket.on("disconnect", async () => {
      await this.handleDisconnection(userId, socket.id);
    });
  }

  /**
   * Configura los handlers de eventos del socket
   * @param socket Socket del cliente
   * @param userId ID del usuario
   * @param shopId ID de la tienda
   */
  private setupEventHandlers(socket: Socket, userId: string, shopId: string): void {
    // Handler para request de sincronización
    socket.on("sync_request", async (data: SyncRequest) => {
      await this.handleSyncRequest(socket, userId, data);
    });

    // Handler para ping (mantener conexión viva)
    socket.on("ping", () => {
      socket.emit("pong");
    });
  }

  /**
   * Maneja un request de sincronización
   * @param socket Socket del cliente
   * @param userId ID del usuario
   * @param data Datos del sync request
   */
  private async handleSyncRequest(
    socket: Socket,
    userId: string,
    data: SyncRequest
  ): Promise<void> {
    try {
      const { lastEventId } = data;

      // Obtener eventos faltantes
      const events = await webSocketEventService.getEventsFrom(lastEventId);

      // Determinar si requiere full refresh
      const requiresFullRefresh =
        events.length === 0 && lastEventId > 0
          ? false
          : events.length >= websocketConfig.maxSyncEvents;

      const response: SyncResponse = {
        events,
        requiresFullRefresh,
      };

      socket.emit("sync_response", response);

      // Actualizar lastEventId en la sesión
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        await webSocketSessionService.updateLastEventId(userId, lastEvent.id);
      }
    } catch (error) {
      console.error("Error al manejar sync request:", error);
      socket.emit("sync_response", {
        events: [],
        requiresFullRefresh: true,
      } as SyncResponse);
    }
  }

  /**
   * Maneja la desconexión de un cliente
   * @param userId ID del usuario
   * @param socketId ID del socket
   */
  private async handleDisconnection(userId: string, socketId: string): Promise<void> {
    console.log(`Cliente WebSocket desconectado: userId=${userId}, socketId=${socketId}`);

    // Verificar que la sesión sea la correcta (evitar race conditions)
    const session = await webSocketSessionService.getSession(userId);
    if (session && session.socketId === socketId) {
      // Solo eliminar si es la sesión activa actual
      await webSocketSessionService.deleteSession(userId);
    }
  }

  /**
   * Mapea módulos RBAC a módulos WebSocket
   * @param rbacModules Módulos RBAC del usuario (ej: ["user", "shop", "orders"])
   * @returns Módulos WebSocket correspondientes (ej: ["ORDERS", "TRANSACTIONS"])
   */
  private mapRBACModulesToWebSocketModules(rbacModules: string[]): string[] {
    const moduleMap: Record<string, string> = {
      // Mapeo de módulos RBAC a módulos WebSocket
      orders: WebSocketModule.ORDERS,
      transactions: WebSocketModule.TRANSACTIONS,
      whatsapp: WebSocketModule.WP_SHOPUISER,
      // Agregar más mapeos según sea necesario
    };

    const wsModules = new Set<string>();

    // Mapear módulos conocidos
    for (const rbacModule of rbacModules) {
      const wsModule = moduleMap[rbacModule.toLowerCase()];
      if (wsModule) {
        wsModules.add(wsModule);
      }
    }

    // Siempre agregar WP_MANAGER y NOTIFICATIONS si tienen acceso a whatsapp o cualquier módulo
    // WP_MANAGER: para recibir QR y avisos de sesiones (si tiene acceso a whatsapp)
    if (rbacModules.some((m) => m.toLowerCase() === "whatsapp")) {
      wsModules.add(WebSocketModule.WP_MANAGER);
    }

    // NOTIFICATIONS: para recibir avisos del sistema (todos los usuarios con roles activos)
    if (rbacModules.length > 0) {
      wsModules.add(WebSocketModule.NOTIFICATIONS);
    }

    return Array.from(wsModules);
  }

  /**
   * Obtiene la instancia de Socket.IO
   * @returns Instancia de Socket.IO Server o null
   */
  getIO(): Server | null {
    return this.io;
  }

  /**
   * Verifica si el servicio está inicializado
   * @returns true si está inicializado
   */
  isInitialized(): boolean {
    return this.io !== null && this.httpServer !== null;
  }

  /**
   * Cierra el servidor WebSocket
   */
  async close(): Promise<void> {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.httpServer = null;
    console.log("WebSocket Server cerrado");
  }
}

// Instancia singleton del servicio
export const webSocketService = new WebSocketService();

