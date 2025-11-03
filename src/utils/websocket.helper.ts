import { webSocketEventService } from "../services/websocket-event.service";
import { EventScope } from "../types/websocket.types";

/**
 * Función helper global para emitir eventos WebSocket desde cualquier servicio
 * 
 * Ejemplo de uso:
 * ```typescript
 * import { emitWebSocketEvent } from "../utils/websocket.helper";
 * 
 * // Emitir evento de pedido creado
 * await emitWebSocketEvent("order_created", {
 *   orderId: "123",
 *   customer: "Juan Pérez",
 *   total: 1500
 * }, {
 *   shopId: "shop_123"
 * });
 * ```
 * 
 * @param eventType Tipo de evento (debe estar en el diccionario EVENT_MODULE_MAP)
 * @param payload Datos del evento
 * @param scope Contexto del evento (debe incluir shopId como mínimo)
 */
export async function emitWebSocketEvent(
  eventType: string,
  payload: any,
  scope: EventScope
): Promise<void> {
  try {
    await webSocketEventService.emitEvent(eventType, payload, scope);
  } catch (error) {
    console.error(`Error al emitir evento WebSocket ${eventType}:`, error);
    // No lanzar el error para que no afecte el flujo principal
    // Si necesitas manejar errores, envuelve la llamada en un try-catch
  }
}

/**
 * Función helper para emitir eventos a un usuario específico
 * 
 * @param userId ID del usuario destinatario
 * @param eventType Tipo de evento
 * @param payload Datos del evento
 * @param scope Contexto del evento
 */
export async function emitWebSocketEventToUser(
  userId: string,
  eventType: string,
  payload: any,
  scope: EventScope
): Promise<void> {
  try {
    await webSocketEventService.emitEventToUser(userId, eventType, payload, scope);
  } catch (error) {
    console.error(`Error al emitir evento WebSocket ${eventType} a usuario ${userId}:`, error);
  }
}

