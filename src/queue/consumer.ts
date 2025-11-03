import { Worker } from "bullmq";
import { redisQueueService } from "../services/redis-queue.service";
import { handleIncomingMessage } from "../handlers/messageHandler";
import WhatsAppSession from "../models/whatsapp-session.model";
import { messageQueueProducer } from "./producer";

/**
 * Worker que procesa mensajes de WhatsApp desde las colas
 * Procesa múltiples colas de tiendas activas dinámicamente
 */
export class MessageQueueConsumer {
  private workers: Map<string, Worker> = new Map();
  private isRunning: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia el worker para procesar mensajes
   * Crea un worker para cada cola activa y los actualiza periódicamente
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️  Worker ya está corriendo");
      return;
    }

    try {
      console.log("🚀 Iniciando worker de mensajes...");

      // Inicializar colas para tiendas activas
      await this.initializeWorkers();

      // Actualizar workers periódicamente (cada 30 segundos) para detectar nuevas tiendas
      this.updateInterval = setInterval(async () => {
        await this.updateWorkers();
      }, 30000); // 30 segundos

      this.isRunning = true;
      console.log("✅ Worker de mensajes iniciado exitosamente");
    } catch (error) {
      console.error("❌ Error al iniciar worker:", error);
      throw error;
    }
  }

  /**
   * Inicializa workers para todas las tiendas activas
   */
  private async initializeWorkers(): Promise<void> {
    try {
      // Obtener todas las tiendas activas desde MongoDB (sesiones con authState válido)
      const sessions = await WhatsAppSession.find({
        provider: "baileys",
        $and: [
          { data: { $exists: true } },
          { data: { $ne: null } },
          { data: { $ne: "" } },
        ],
        shopId: { $exists: true, $ne: null },
      }).catch(() => []);

      const activeShops = sessions
        .map((session) => session.shopId)
        .filter((shopId): shopId is string => !!shopId);

      console.log(
        `📋 Tiendas activas encontradas: ${activeShops.length}`
      );

      // Crear workers para cada tienda activa
      for (const shopId of activeShops) {
        await this.createWorkerForShop(shopId);
      }
    } catch (error) {
      console.error("❌ Error al inicializar workers:", error);
      throw error;
    }
  }

  /**
   * Crea un worker para una tienda específica
   */
  private async createWorkerForShop(shopId: string): Promise<void> {
    const queueName = `messages-shop-${shopId}`;

    // Si ya existe el worker, no crear otro
    if (this.workers.has(queueName)) {
      return;
    }

    try {
      // Crear el worker para esta cola
      const worker = new Worker(
        queueName,
        async (job) => {
          console.log(
            `🔄 Procesando job ${job.id} de la cola ${queueName}`
          );
          await handleIncomingMessage(job);
        },
        {
          connection: redisQueueService.getConnectionConfig(),
          concurrency: 1, // Procesar 1 mensaje a la vez por tienda (FIFO)
          limiter: {
            max: 10, // Máximo 10 mensajes por segundo por worker
            duration: 1000,
          },
        }
      );

      // Manejar eventos del worker
      worker.on("completed", (job) => {
        console.log(
          `✅ Job ${job.id} completado en cola ${queueName}`
        );
      });

      worker.on("failed", (job, err) => {
        console.error(
          `❌ Job ${job?.id} falló en cola ${queueName}:`,
          err
        );
      });

      worker.on("error", (err) => {
        console.error(
          `❌ Error en worker de cola ${queueName}:`,
          err
        );
      });

      this.workers.set(queueName, worker);
      console.log(`✅ Worker creado para shop ${shopId}: ${queueName}`);
    } catch (error) {
      console.error(
        `❌ Error al crear worker para shop ${shopId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Actualiza la lista de workers para incluir nuevas tiendas activas
   */
  private async updateWorkers(): Promise<void> {
    try {
      // Obtener todas las tiendas activas desde MongoDB (sesiones con authState válido)
      const sessions = await WhatsAppSession.find({
        provider: "baileys",
        $and: [
          { data: { $exists: true } },
          { data: { $ne: null } },
          { data: { $ne: "" } },
        ],
        shopId: { $exists: true, $ne: null },
      }).catch(() => []);

      const activeShops = sessions
        .map((session) => session.shopId)
        .filter((shopId): shopId is string => !!shopId);

      // Crear workers para nuevas tiendas
      for (const shopId of activeShops) {
        const queueName = `messages-shop-${shopId}`;
        if (!this.workers.has(queueName)) {
          await this.createWorkerForShop(shopId);
        }
      }

      // Opcional: cerrar workers de tiendas que ya no están activas
      // (por ahora mantenemos los workers incluso si la tienda se desactiva)
    } catch (error) {
      console.error("❌ Error al actualizar workers:", error);
    }
  }

  /**
   * Crea un worker para una tienda específica (método público para usar desde fuera)
   */
  public async addWorkerForShop(shopId: string): Promise<void> {
    await this.createWorkerForShop(shopId);
  }

  /**
   * Elimina un worker para una tienda específica
   */
  public async removeWorkerForShop(shopId: string): Promise<void> {
    const queueName = `messages-shop-${shopId}`;
    const worker = this.workers.get(queueName);

    if (worker) {
      await worker.close();
      this.workers.delete(queueName);
      console.log(`🗑️  Worker eliminado para shop ${shopId}`);
    }
  }

  /**
   * Detiene todos los workers
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("🛑 Deteniendo worker de mensajes...");

    // Limpiar intervalo de actualización
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Cerrar todos los workers
    const closePromises = Array.from(this.workers.values()).map((worker) =>
      worker.close()
    );
    await Promise.all(closePromises);
    this.workers.clear();

    this.isRunning = false;
    console.log("✅ Worker de mensajes detenido");
  }

  /**
   * Obtiene estadísticas de todos los workers
   */
  public async getStats(): Promise<{
    activeWorkers: number;
    queues: string[];
  }> {
    return {
      activeWorkers: this.workers.size,
      queues: Array.from(this.workers.keys()),
    };
  }
}

// Instancia singleton del consumer
export const messageQueueConsumer = new MessageQueueConsumer();

