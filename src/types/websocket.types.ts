/**
 * Enum de módulos WebSocket disponibles
 */
export enum WebSocketModule {
  WP_MANAGER = "WP_MANAGER", // Recibe QR y avisos relacionados a manejo de sesiones
  WP_SHOPUISER = "WP_SHOPUISER", // Recibe notificaciones de mensajes
  ORDERS = "ORDERS", // Recibe notificaciones de pedidos y turnos
  TRANSACTIONS = "TRANSACTIONS", // Recibe notificaciones de pagos
  NOTIFICATIONS = "NOTIFICATIONS", // Recibe avisos y notificaciones de sistema
}

/**
 * Scope de un evento (contexto del evento)
 */
export interface EventScope {
  shopId: string;
  [key: string]: any; // Permite agregar propiedades adicionales
}

/**
 * Estructura de un evento WebSocket
 */
export interface WebSocketEvent {
  id: number; // EventId incremental
  type: string; // Tipo de evento
  module: string; // Módulo asociado al evento
  scope: EventScope; // Contexto del evento
  payload: any; // Datos del evento
  timestamp: number; // Timestamp del evento
}

/**
 * Información de sesión WebSocket almacenada en Redis
 */
export interface WebSocketSession {
  socketId: string; // ID del socket
  userId: string; // ID del usuario
  modules: string[]; // Lista de módulos habilitados (["*"] hardcodeado por ahora)
  shopId: string; // ID de la tienda
  connectedAt: number; // Timestamp de conexión
  lastEventId: number; // Último eventId confirmado
}

/**
 * Payload para request de sincronización
 */
export interface SyncRequest {
  lastEventId: number; // Último eventId que el cliente tiene
}

/**
 * Respuesta de sincronización
 */
export interface SyncResponse {
  events: WebSocketEvent[]; // Eventos faltantes
  requiresFullRefresh: boolean; // Si requiere recargar todo el estado
}

