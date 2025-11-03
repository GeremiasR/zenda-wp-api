import { Queue } from "bullmq";
import { redisQueueService } from "../services/redis-queue.service";
import { IWhatsAppMessage } from "../providers/whatsapp/interfaces/whatsapp-provider.interface";

/**
 * Interfaz para el payload de un mensaje en la cola
 */
export interface MessageJobPayload {
  shopId: string;
  flowId: string;
  message: IWhatsAppMessage;
  providerId: string; // Para identificar qué provider usar al enviar la respuesta
}

/**
 * Producer para encolar mensajes de WhatsApp
 * Crea colas dinámicamente por tienda: messages-shop-{shopId}
 */
export class MessageQueueProducer {
  private queues: Map<string, Queue> = new Map();

  /**
   * Obtiene o crea una cola para una tienda específica
   */
  private getQueueForShop(shopId: string): Queue {
    const queueName = `messages-shop-${shopId}`;

    // Si ya existe la cola, retornarla
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName)!;
    }

    // Crear nueva cola
    const queue = new Queue(queueName, {
      connection: redisQueueService.getConnectionConfig(),
      defaultJobOptions: {
        attempts: 3, // Reintentos automáticos
        backoff: {
          type: "exponential",
          delay: 2000, // 2 segundos iniciales
        },
        removeOnComplete: {
          age: 3600, // Mantener jobs completados por 1 hora
          count: 1000, // Mantener hasta 1000 jobs completados
        },
        removeOnFail: {
          age: 86400, // Mantener jobs fallidos por 24 horas
        },
      },
    });

    this.queues.set(queueName, queue);
    console.log(`✅ Cola creada para shop ${shopId}: ${queueName}`);

    return queue;
  }

  /**
   * Encola un mensaje entrante para procesamiento
   */
  public async enqueueMessage(payload: MessageJobPayload): Promise<void> {
    try {
      const queue = this.getQueueForShop(payload.shopId);

      // Agregar el job a la cola
      // Generar un ID único para el job: shopId-timestamp-random
      const uniqueJobId = `${payload.shopId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const job = await queue.add("process-message", payload, {
        jobId: uniqueJobId,
        priority: 1, // Prioridad normal (puede ajustarse según necesidad)
      });

      console.log(
        `📨 Mensaje encolado para shop ${payload.shopId}: ${job.id}`
      );
    } catch (error) {
      console.error(
        `❌ Error al encolar mensaje para shop ${payload.shopId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Obtiene el nombre de todas las colas activas
   */
  public getActiveQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Obtiene una cola específica por nombre
   */
  public getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Limpia una cola específica (útil para pruebas o limpieza)
   */
  public async cleanQueue(shopId: string): Promise<void> {
    const queueName = `messages-shop-${shopId}`;
    const queue = this.queues.get(queueName);

    if (queue) {
      await queue.obliterate({ force: true });
      this.queues.delete(queueName);
      console.log(`🧹 Cola limpiada para shop ${shopId}`);
    }
  }

  /**
   * Cierra todas las colas (útil para shutdown)
   */
  public async closeAllQueues(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close()
    );
    await Promise.all(closePromises);
    this.queues.clear();
    console.log("✅ Todas las colas cerradas");
  }

  /**
   * Obtiene estadísticas de una cola específica
   */
  public async getQueueStats(shopId: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const queueName = `messages-shop-${shopId}`;
    const queue = this.queues.get(queueName);

    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}

// Instancia singleton del producer
export const messageQueueProducer = new MessageQueueProducer();

