import { Job } from "bullmq";
import { flowService } from "../services/flow.service";
import { MessageJobPayload } from "../queue/producer";
import { whatsappMultitenantManagerService } from "../services/whatsapp-multitenant-manager.service";

/**
 * Handler para procesar mensajes de WhatsApp desde la cola
 * Este handler se ejecuta en el worker y procesa cada mensaje de forma ordenada
 */
export async function handleIncomingMessage(
  job: Job<MessageJobPayload>
): Promise<void> {
  const { shopId, flowId, message, providerId } = job.data;

  try {
    console.log(
      `🔄 Procesando mensaje para shop ${shopId}, job ${job.id}:`,
      message.text
    );

    // Procesar el mensaje a través del motor de flujos
    const { response } = await flowService.processMessageByFlowId(
      message.from,
      message.to,
      message.text,
      flowId
    );

    // Si hay una respuesta, enviarla a través del provider correspondiente
    if (response) {
      // Obtener el JID completo para enviar el mensaje
      // El formato de JID en WhatsApp es: número@s.whatsapp.net o número:...@g.us para grupos
      let jid: string;
      
      // Intentar obtener el JID desde el rawMessage (Baileys) si está disponible
      if (message.rawMessage && message.rawMessage.key?.remoteJid) {
        jid = message.rawMessage.key.remoteJid;
      } else if (message.isGroup && message.groupId) {
        // Para grupos, usar el groupId si está disponible
        jid = message.groupId;
      } else if (message.from.includes("@")) {
        // Si ya tiene formato JID completo, usarlo
        jid = message.from;
      } else {
        // Construir JID completo para chat individual
        jid = `${message.from}@s.whatsapp.net`;
      }

      await whatsappMultitenantManagerService.sendMessageFromShop(
        shopId,
        jid,
        response
      );

      console.log(
        `✅ Respuesta enviada para shop ${shopId}, job ${job.id}`
      );
    } else {
      console.log(
        `⚠️ No hay respuesta generada para shop ${shopId}, job ${job.id}`
      );
    }
  } catch (error) {
    console.error(
      `❌ Error al procesar mensaje para shop ${shopId}, job ${job.id}:`,
      error
    );

    // Re-lanzar el error para que BullMQ pueda manejarlo (reintentos, etc.)
    throw error;
  }
}

