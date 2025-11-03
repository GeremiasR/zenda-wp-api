import { redisService } from "./redis.service";
import { webSocketSessionService } from "./websocket-session.service";
import { WebSocketEvent, EventScope } from "../types/websocket.types";
import { websocketConfig, getModuleForEvent, shouldReceiveEvent } from "../config/websocket.config";
import { Server } from "socket.io";

/**
 * Servicio para gestionar eventos WebSocket con secuenciación y filtrado
 */
export class WebSocketEventService {
  private io: Server | null = null;
  private eventIdCounter: number = 0;

  /**
   * Inicializa el servicio con la instancia de Socket.IO
   * @param io Instancia de Socket.IO Server
   */
  async initialize(io: Server): Promise<void> {
    this.io = io;
    // Inicializar contador desde Redis o desde 0
    await this.loadEventIdCounter();
  }

  /**
   * Carga el contador de eventos desde Redis
   */
  private async loadEventIdCounter(): Promise<void> {
    try {
      const client = redisService.getClient();
      const key = "ws:event:id:counter";
      const value = await client.get(key);
      if (value) {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) {
          this.eventIdCounter = parsed;
        } else {
          this.eventIdCounter = 0;
        }
      } else {
        this.eventIdCounter = 0;
      }
    } catch (error) {
      console.error("Error al cargar contador de eventos:", error);
      this.eventIdCounter = 0;
    }
  }

  /**
   * Guarda el contador de eventos en Redis
   */
  private async saveEventIdCounter(): Promise<void> {
    try {
      const client = redisService.getClient();
      const key = "ws:event:id:counter";
      await client.set(key, this.eventIdCounter.toString());
    } catch (error) {
      console.error("Error al guardar contador de eventos:", error);
    }
  }

  /**
   * Genera un nuevo eventId incremental
   */
  private async generateEventId(): Promise<number> {
    this.eventIdCounter++;
    await this.saveEventIdCounter();
    return this.eventIdCounter;
  }

  /**
   * Guarda un evento en Redis para recuperación en caso de reconexión
   * @param event Evento a guardar
   */
  private async saveEvent(event: WebSocketEvent): Promise<void> {
    try {
      const client = redisService.getClient();
      const key = `${websocketConfig.redisKeyPrefix.event}${event.id}`;

      await client.setEx(key, websocketConfig.eventTTL, JSON.stringify(event));
    } catch (error) {
      console.error("Error al guardar evento en Redis:", error);
    }
  }

  /**
   * Obtiene eventos desde un eventId específico
   * @param fromEventId EventId desde el cual obtener eventos
   * @returns Lista de eventos faltantes
   */
  async getEventsFrom(fromEventId: number): Promise<WebSocketEvent[]> {
    try {
      const client = redisService.getClient();
      const events: WebSocketEvent[] = [];
      const maxEvents = websocketConfig.maxSyncEvents;

      // Buscar eventos desde fromEventId + 1 hasta el contador actual
      for (let id = fromEventId + 1; id <= this.eventIdCounter && events.length < maxEvents; id++) {
        const key = `${websocketConfig.redisKeyPrefix.event}${id}`;
        const data = await client.get(key);

        if (data) {
          const event = JSON.parse(data) as WebSocketEvent;
          events.push(event);
        }
      }

      return events;
    } catch (error) {
      console.error("Error al obtener eventos desde eventId:", error);
      return [];
    }
  }

  /**
   * Emite un evento a los usuarios que deben recibirlo basándose en módulos y scope
   * @param eventType Tipo de evento
   * @param payload Datos del evento
   * @param scope Contexto del evento (shopId requerido)
   */
  async emitEvent(
    eventType: string,
    payload: any,
    scope: EventScope
  ): Promise<void> {
    if (!this.io) {
      console.error("WebSocket Event Service no está inicializado");
      return;
    }

    // Obtener el módulo del evento
    const eventModule = getModuleForEvent(eventType);
    if (!eventModule) {
      console.warn(`Tipo de evento '${eventType}' no está mapeado a ningún módulo. Evento no emitido.`);
      return;
    }

    // Generar eventId y crear el evento
    const eventId = await this.generateEventId();
    const event: WebSocketEvent = {
      id: eventId,
      type: eventType,
      module: eventModule,
      scope,
      payload,
      timestamp: Date.now(),
    };

    // Guardar el evento en Redis para recuperación
    await this.saveEvent(event);

    // Obtener todas las sesiones del shopId
    const sessions = await webSocketSessionService.getSessionsByShopId(scope.shopId);

    // Filtrar sesiones que deben recibir el evento
    const targetSessions = sessions.filter((session) =>
      shouldReceiveEvent(session.modules, eventType)
    );

    // Verificar que hay sesiones antes de emitir
    if (targetSessions.length === 0) {
      console.log(`Evento ${eventType} (ID: ${eventId}) para shopId=${scope.shopId}: No hay sesiones activas que deban recibir este evento`);
      return;
    }

    // Emitir el evento a cada sesión del shopId
    let successCount = 0;
    for (const session of targetSessions) {
      try {
        // Verificar que el socket aún existe antes de emitir
        const socket = this.io.sockets.sockets.get(session.socketId);
        if (!socket) {
          console.warn(`Socket ${session.socketId} para userId=${session.userId} ya no existe, saltando...`);
          continue;
        }

        // Emitir el evento al socket correspondiente
        socket.emit("event", event);
        successCount++;
        
        // Actualizar lastEventId de la sesión
        await webSocketSessionService.updateLastEventId(session.userId, eventId);
      } catch (error) {
        console.error(`Error al emitir evento a sesión ${session.socketId} (userId=${session.userId}):`, error);
      }
    }

    console.log(
      `Evento ${eventType} (ID: ${eventId}) para shopId=${scope.shopId}: ` +
      `Emitido a ${successCount}/${targetSessions.length} sesión(es) ` +
      `(total usuarios del shop: ${sessions.length})`
    );
  }

  /**
   * Emite un evento a un usuario específico
   * @param userId ID del usuario
   * @param eventType Tipo de evento
   * @param payload Datos del evento
   * @param scope Contexto del evento
   */
  async emitEventToUser(
    userId: string,
    eventType: string,
    payload: any,
    scope: EventScope
  ): Promise<void> {
    if (!this.io) {
      console.error("WebSocket Event Service no está inicializado");
      return;
    }

    // Obtener la sesión del usuario
    const session = await webSocketSessionService.getSession(userId);
    if (!session) {
      console.warn(`Usuario ${userId} no tiene sesión activa`);
      return;
    }

    // Verificar si el usuario debe recibir el evento
    if (!shouldReceiveEvent(session.modules, eventType)) {
      return;
    }

    // Obtener el módulo del evento
    const eventModule = getModuleForEvent(eventType);
    if (!eventModule) {
      return;
    }

    // Generar eventId y crear el evento
    const eventId = await this.generateEventId();
    const event: WebSocketEvent = {
      id: eventId,
      type: eventType,
      module: eventModule,
      scope,
      payload,
      timestamp: Date.now(),
    };

    // Guardar el evento en Redis
    await this.saveEvent(event);

    // Emitir el evento
    try {
      this.io.to(session.socketId).emit("event", event);
      await webSocketSessionService.updateLastEventId(userId, eventId);
    } catch (error) {
      console.error(`Error al emitir evento a usuario ${userId}:`, error);
    }
  }
}

// Instancia singleton del servicio
export const webSocketEventService = new WebSocketEventService();

