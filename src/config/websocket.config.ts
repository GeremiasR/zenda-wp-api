import { WebSocketModule } from "../types/websocket.types";

/**
 * Mapa centralizado que asocia tipos de eventos a sus módulos correspondientes
 *
 * Este diccionario permite que el sistema filtre automáticamente qué usuarios
 * deben recibir qué eventos basándose en sus módulos habilitados.
 *
 * Para agregar un nuevo tipo de evento:
 * 1. Agregar la entrada al diccionario con el tipo de evento y su módulo
 * 2. El sistema automáticamente filtrará y emitirá a los usuarios correctos
 */
export const EVENT_MODULE_MAP: Record<string, WebSocketModule> = {
  // Eventos de WP_MANAGER
  qr_code_generated: WebSocketModule.WP_MANAGER,
  qr_code_expired: WebSocketModule.WP_MANAGER,
  session_connected: WebSocketModule.WP_MANAGER,
  session_disconnected: WebSocketModule.WP_MANAGER,
  session_restored: WebSocketModule.WP_MANAGER,
  session_error: WebSocketModule.WP_MANAGER,

  // Eventos de WP_SHOPUISER
  message_received: WebSocketModule.WP_SHOPUISER,
  message_sent: WebSocketModule.WP_SHOPUISER,
  message_delivered: WebSocketModule.WP_SHOPUISER,
  message_read: WebSocketModule.WP_SHOPUISER,
  message_failed: WebSocketModule.WP_SHOPUISER,

  // Eventos de ORDERS
  order_created: WebSocketModule.ORDERS,
  order_updated: WebSocketModule.ORDERS,
  order_cancelled: WebSocketModule.ORDERS,
  order_completed: WebSocketModule.ORDERS,
  turn_created: WebSocketModule.ORDERS,
  turn_updated: WebSocketModule.ORDERS,
  turn_cancelled: WebSocketModule.ORDERS,

  // Eventos de TRANSACTIONS
  transaction_created: WebSocketModule.TRANSACTIONS,
  transaction_approved: WebSocketModule.TRANSACTIONS,
  transaction_failed: WebSocketModule.TRANSACTIONS,
  transaction_refunded: WebSocketModule.TRANSACTIONS,
  payment_received: WebSocketModule.TRANSACTIONS,
  payment_failed: WebSocketModule.TRANSACTIONS,

  // Eventos de NOTIFICATIONS
  notification_created: WebSocketModule.NOTIFICATIONS,
  notification_read: WebSocketModule.NOTIFICATIONS,
  notification_dismissed: WebSocketModule.NOTIFICATIONS,
  system_alert: WebSocketModule.NOTIFICATIONS,
  system_notification: WebSocketModule.NOTIFICATIONS,
  announcement: WebSocketModule.NOTIFICATIONS,
};

/**
 * Obtiene el módulo asociado a un tipo de evento
 * @param eventType Tipo de evento
 * @returns Módulo asociado o null si no existe
 */
export function getModuleForEvent(eventType: string): WebSocketModule | null {
  return EVENT_MODULE_MAP[eventType] || null;
}

/**
 * Verifica si un módulo está suscrito a un tipo de evento
 * @param modules Lista de módulos del usuario (puede incluir "*" para todos)
 * @param eventType Tipo de evento
 * @returns true si el usuario debe recibir el evento
 */
export function shouldReceiveEvent(
  modules: string[],
  eventType: string
): boolean {
  // Si el usuario tiene "*", recibe todos los eventos
  if (modules.includes("*")) {
    return true;
  }

  // Obtener el módulo del evento
  const eventModule = getModuleForEvent(eventType);
  if (!eventModule) {
    // Si el evento no tiene módulo definido, no se emite
    return false;
  }

  // Verificar si el usuario tiene el módulo habilitado
  return modules.includes(eventModule);
}

/**
 * Configuración de WebSocket
 */
export const websocketConfig = {
  // TTL para eventos en Redis (en segundos)
  eventTTL: parseInt(process.env.WEBSOCKET_EVENT_TTL || "600"), // 10 minutos por defecto

  // TTL para sesiones en Redis (en segundos)
  sessionTTL: parseInt(process.env.WEBSOCKET_SESSION_TTL || "3600"), // 1 hora por defecto (igual que JWT)

  // Prefijo para keys en Redis
  redisKeyPrefix: {
    session: "ws:user:",
    event: "ws:event:",
  },

  // Número máximo de eventos para resincronización antes de requerir full refresh
  maxSyncEvents: parseInt(process.env.WEBSOCKET_MAX_SYNC_EVENTS || "100"),

  // CORS configuration
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN?.split(",") || "*",
    credentials: true,
  },
};
