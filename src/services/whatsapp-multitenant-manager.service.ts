import { BaileysMultitenantProvider } from "../providers/whatsapp/providers/baileys/baileys-multitenant-provider";
import {
  IWhatsAppProvider,
  IWhatsAppMessage,
  WhatsAppProviderType,
  WhatsAppProviderFactory,
} from "../providers/whatsapp";
// Redis solo se usa para BullMQ (colas), no para sesiones de WhatsApp
import { flowService } from "./flow.service";
import WhatsAppSession from "../models/whatsapp-session.model";
import { messageQueueProducer } from "../queue/producer";
import { messageQueueConsumer } from "../queue/consumer";

export class WhatsAppMultitenantManagerService {
  private activeSessions: Map<string, IWhatsAppProvider> = new Map();

  /**
   * Inicia una sesión de WhatsApp para un shop específico
   */
  public async startShopSession(
    shopId: string,
    flowId: string,
    providerType: WhatsAppProviderType = WhatsAppProviderType.BAILEYS
  ): Promise<{
    qr?: string;
    message: string;
    sessionId: string;
  }> {
    try {
      // Verificar si ya existe una sesión activa
      if (this.activeSessions.has(shopId)) {
        // QR no se almacena, solo se emite via callbacks
        return {
          message: "Sesión ya activa",
          sessionId: `shop_${shopId}`,
          qr: undefined,
        };
      }

      // Verificar si hay sesión con authState válido en MongoDB
      const session = await WhatsAppSession.findOne({
        shopId,
        provider: "baileys",
      });

      if (session?.data) {
        // Verificar que las credenciales son válidas (tiene creds.me.id)
        const authState = session.getAuthState();
        if (authState?.creds?.me?.id) {
          // Restaurar sesión existente (hay authState válido en MongoDB)
          console.log(
            `♻️ Sesión existente con authState válido encontrada en MongoDB para shop ${shopId}. Restaurando...`
          );
          return await this.restoreSession(shopId);
        } else {
          // Sesión sin credenciales válidas, limpiar
          console.log(
            `🧹 Sesión sin credenciales válidas encontrada para shop ${shopId}. Limpiando...`
          );
          await WhatsAppSession.findOneAndUpdate(
            { _id: session._id },
            { $unset: { data: "", number: "" }, isConnected: false },
            { upsert: false }
          ).catch(() => {});
        }
      } else {
        // No hay sesión o no tiene authState, limpiar sesiones huérfanas
        console.log(
          `🧹 No hay authState válido en MongoDB para shop ${shopId}. Limpiando sesiones huérfanas...`
        );

        // Buscar todas las sesiones del shopId sin authState válido
        const orphanSessions = await WhatsAppSession.find({
          shopId,
          $or: [{ data: { $exists: false } }, { data: "" }, { data: null }],
        }).catch(() => []);

        if (orphanSessions.length > 0) {
          console.log(
            `🗑️ Eliminando ${orphanSessions.length} sesión(es) huérfana(s) del shop ${shopId}...`
          );
          // Eliminar completamente todas las sesiones huérfanas
          await WhatsAppSession.deleteMany({
            _id: { $in: orphanSessions.map((s) => s._id) },
          }).catch(() => {});
          console.log(`✅ Sesiones huérfanas eliminadas para shop ${shopId}`);
        }

        // También limpiar cualquier sesión activa en memoria
        if (this.activeSessions.has(shopId)) {
          const oldProvider = this.activeSessions.get(shopId);
          if (oldProvider) {
            try {
              await oldProvider.disconnect();
            } catch (e) {
              // Ignorar errores al desconectar
            }
          }
          this.activeSessions.delete(shopId);
          console.log(
            `🧹 Sesión activa en memoria removida para shop ${shopId}`
          );
        }
      }

      // Crear nueva sesión
      const sessionId = `shop_${shopId}_${flowId}`;
      const phoneNumber = `shop_${shopId}_phone`; // Placeholder, se actualizará cuando se conecte

      // Crear proveedor usando el factory (agnóstico al proveedor)
      let provider: IWhatsAppProvider;

      if (providerType === WhatsAppProviderType.BAILEYS) {
        // Para Baileys multitenant, usar el proveedor específico
        provider = new BaileysMultitenantProvider(
          {
            sessionId,
            phoneNumber,
            provider: providerType,
          },
          shopId
        );
      } else {
        // Para otros proveedores, usar el factory estándar
        provider = WhatsAppProviderFactory.createProvider({
          sessionId,
          phoneNumber,
          provider: providerType,
          credentials: {},
          shopId,
        });
      }

      // Configurar callbacks
      this.setupProviderCallbacks(provider, shopId, flowId);

      // Guardar en memoria
      this.activeSessions.set(shopId, provider);

      // Guardar sesión en MongoDB con flowId
      await WhatsAppSession.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          phoneNumber,
          provider: providerType,
          shopId,
          flowId,
          isConnected: false,
        },
        { upsert: true }
      );

      // Conectar
      await provider.connect();

      // Esperar un poco para que se genere el QR
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // QR no se almacena, solo se emite via callbacks
      // El QR se retornará a través del callback si está disponible
      return {
        qr: undefined,
        message: "Esperando QR...",
        sessionId,
      };
    } catch (error) {
      console.error(`Error al iniciar sesión para shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Restaura una sesión existente desde MongoDB
   * IMPORTANTE: Solo restaura si HAY authState válido en MongoDB
   */
  private async restoreSession(shopId: string): Promise<{
    qr?: string;
    message: string;
    sessionId: string;
  }> {
    try {
      // Buscar la sesión en MongoDB con authState válido
      const session = await WhatsAppSession.findOne({
        shopId,
        provider: "baileys",
        $and: [
          { data: { $exists: true } },
          { data: { $ne: null } },
          { data: { $ne: "" } },
        ],
      });

      if (!session || !session.data) {
        throw new Error(
          `No hay authState válido en MongoDB para shop ${shopId}. No se puede restaurar.`
        );
      }

      console.log(
        `✅ authState encontrado en MongoDB para shop ${shopId}. Restaurando sesión...`
      );

      // Verificar que el authState tiene credenciales válidas
      const authState = session.getAuthState();
      if (!authState || !authState.creds?.me?.id) {
        throw new Error(
          `authState encontrado pero sin credenciales válidas para shop ${shopId}.`
        );
      }

      const sessionId = session.sessionId;
      const phoneNumber =
        session.phoneNumber || session.number || `shop_${shopId}_phone`;
      const flowId = session.flowId?.toString() || "";

      if (!flowId) {
        throw new Error(
          `La sesión para shop ${shopId} no tiene flowId asociado. Por favor, activa WhatsApp nuevamente.`
        );
      }

      const provider = new BaileysMultitenantProvider(
        {
          sessionId,
          phoneNumber,
          provider: WhatsAppProviderType.BAILEYS,
        },
        shopId
      );

      this.setupProviderCallbacks(provider, shopId, flowId);
      this.activeSessions.set(shopId, provider);

      await provider.connect();

      // QR no se almacena, solo se emite via callbacks
      return {
        qr: undefined,
        message: "Sesión restaurada",
        sessionId,
      };
    } catch (error) {
      console.error(`Error al restaurar sesión para shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de una sesión de shop
   */
  public async getShopSessionStatus(shopId: string): Promise<{
    isActive: boolean;
    isConnected: boolean;
    qr?: string;
    phoneNumber?: string;
    lastConnection?: string;
  }> {
    try {
      const provider = this.activeSessions.get(shopId);
      const isActive = !!provider;
      const isConnected = provider ? provider.isConnected() : false;

      // Obtener información desde MongoDB
      const session = await WhatsAppSession.findOne({
        shopId,
        provider: "baileys",
      });

      // QR no se almacena
      const phoneNumber = session?.number || session?.phoneNumber;
      const lastConnection = session?.lastSeen?.toISOString();

      return {
        isActive,
        isConnected,
        qr: undefined,
        phoneNumber,
        lastConnection,
      };
    } catch (error) {
      console.error(
        `Error al obtener estado de sesión para shop ${shopId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Desactiva una sesión de shop
   * Elimina completamente la sesión de Redis, MongoDB y memoria
   */
  public async deactivateShopSession(shopId: string): Promise<void> {
    try {
      console.log(`🛑 Desactivando sesión de WhatsApp para shop ${shopId}...`);

      // Desconectar el proveedor
      const provider = this.activeSessions.get(shopId);
      if (provider) {
        try {
          await provider.disconnect();
        } catch (e) {
          console.error(
            `Error al desconectar provider para shop ${shopId}:`,
            e
          );
        }
        this.activeSessions.delete(shopId);
        console.log(`🧹 Sesión removida de memoria para shop ${shopId}`);
      }

      // Limpiar authState de MongoDB (mantener documento, solo limpiar data)
      const updated = await WhatsAppSession.updateMany(
        { shopId, provider: "baileys" },
        { $unset: { data: "", number: "" }, isConnected: false },
        { upsert: false }
      ).catch(() => null);

      if (updated) {
        console.log(
          `🧹 authState limpiado de MongoDB para shop ${shopId} (${
            updated.modifiedCount || 0
          } documento(s) actualizado(s))`
        );
      }

      console.log(
        `✅ Sesión de WhatsApp completamente desactivada para shop ${shopId}`
      );
    } catch (error) {
      console.error(
        `❌ Error al desactivar sesión para shop ${shopId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Envía un mensaje desde una sesión de shop
   */
  public async sendMessageFromShop(
    shopId: string,
    jid: string,
    message: string
  ): Promise<void> {
    const provider = this.activeSessions.get(shopId);
    if (!provider) {
      throw new Error(`No hay sesión activa para shop ${shopId}`);
    }

    if (!provider.isConnected()) {
      throw new Error(`Sesión no conectada para shop ${shopId}`);
    }

    await provider.sendMessage(jid, message);
  }

  /**
   * Envía un mensaje a grupo desde una sesión de shop
   */
  public async sendGroupMessageFromShop(
    shopId: string,
    groupJid: string,
    message: string
  ): Promise<void> {
    const provider = this.activeSessions.get(shopId);
    if (!provider) {
      throw new Error(`No hay sesión activa para shop ${shopId}`);
    }

    if (!provider.isConnected()) {
      throw new Error(`Sesión no conectada para shop ${shopId}`);
    }

    await provider.sendMessageToGroup(groupJid, message);
  }

  /**
   * Obtiene todas las sesiones activas
   */
  public async getAllActiveSessions(): Promise<
    {
      shopId: string;
      isConnected: boolean;
      phoneNumber?: string;
      lastConnection?: string;
    }[]
  > {
    const sessions: {
      shopId: string;
      isConnected: boolean;
      phoneNumber?: string;
      lastConnection?: string;
    }[] = [];

    for (const [shopId, provider] of this.activeSessions) {
      // Obtener información desde MongoDB
      const session = await WhatsAppSession.findOne({
        shopId,
        provider: "baileys",
      }).catch(() => null);

      sessions.push({
        shopId,
        isConnected: provider.isConnected(),
        phoneNumber: session?.number || session?.phoneNumber,
        lastConnection: session?.lastSeen?.toISOString(),
      });
    }

    return sessions;
  }

  /**
   * Configura los callbacks para un proveedor
   */
  private setupProviderCallbacks(
    provider: IWhatsAppProvider,
    shopId: string,
    flowId: string
  ): void {
    // Callback para mensajes entrantes - ENCOLAR en lugar de procesar directamente
    provider.onMessage(async (message: IWhatsAppMessage) => {
      try {
        console.log(`📨 Mensaje recibido en shop ${shopId}:`, message.text);

        // Encolar el mensaje para procesamiento asíncrono
        await messageQueueProducer.enqueueMessage({
          shopId,
          flowId,
          message,
          providerId: provider.providerId,
        });

        console.log(`✅ Mensaje encolado para shop ${shopId}`);

        // Asegurar que hay un worker para esta tienda
        await messageQueueConsumer.addWorkerForShop(shopId);
      } catch (error) {
        console.error(`❌ Error al encolar mensaje en shop ${shopId}:`, error);
      }
    });

    // Callback para actualizaciones de conexión
    provider.onConnectionUpdate(async (status) => {
      try {
        console.log(
          `Estado de conexión actualizado para shop ${shopId}:`,
          status
        );

        // Obtener el número de teléfono desde la sesión en MongoDB
        const session = await WhatsAppSession.findOne({
          shopId,
          provider: "baileys",
        }).catch(() => null);

        let phoneNumber =
          session?.number || session?.phoneNumber || `shop_${shopId}_phone`;

        // Actualizar estado en MongoDB (QR no se almacena)
        await WhatsAppSession.findOneAndUpdate(
          { shopId },
          {
            isConnected: status.isConnected,
            lastSeen: new Date(),
            number: phoneNumber,
          },
          { upsert: true }
        );
      } catch (error) {
        console.error(
          `Error al actualizar estado de sesión para shop ${shopId}:`,
          error
        );
      }
    });

    // Callback para códigos QR
    // QR no se almacena (duración de 1 minuto, solo en memoria/callbacks)
    provider.onQRCode(async (qr) => {
      try {
        console.log(`Código QR generado para shop ${shopId}`);
        // QR solo se emite via callback, no se guarda
      } catch (error) {
        console.error(
          `Error al procesar código QR para shop ${shopId}:`,
          error
        );
      }
    });
  }

  /**
   * Verifica si las credenciales son válidas (tiene authState con creds.me.id)
   * Las credenciales válidas tienen campos específicos que indican que fueron autenticadas
   */
  private async areCredentialsValid(shopId: string): Promise<boolean> {
    try {
      const session = await WhatsAppSession.findOne({
        shopId,
        provider: "baileys",
        $and: [
          { data: { $exists: true } },
          { data: { $ne: null } },
          { data: { $ne: "" } },
        ],
      });

      if (!session || !session.data) {
        return false;
      }

      // Verificar que el authState tiene credenciales válidas
      const authState = session.getAuthState();
      if (!authState || !authState.creds) {
        return false;
      }

      // Las credenciales válidas tienen el campo "me" que contiene información del usuario autenticado
      // Credenciales válidas tienen "me" (con id, name, etc.) después de escanear el QR
      // Credenciales vacías de initAuthCreds() NO tienen "me"
      const hasMe = !!(
        authState.creds.me &&
        typeof authState.creds.me === "object" &&
        authState.creds.me.id
      );

      // Si tiene "me" con "id", son credenciales válidas y autenticadas
      return hasMe;
    } catch (error) {
      console.error(
        `Error al verificar credenciales para shop ${shopId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Inicializa todas las sesiones existentes al arrancar el servidor
   * IMPORTANTE: Solo restaura sesiones AUTENTICADAS (que tienen creds.me.id)
   * NO restaura sesiones incompletas que nunca se autenticaron (sin QR escaneado)
   */
  public async initializeExistingSessions(): Promise<void> {
    try {
      console.log(
        "🔄 Inicializando sesiones existentes al iniciar servidor..."
      );

      // Obtener sesiones que tienen authState válido en MongoDB
      const sessions = await WhatsAppSession.find({
        provider: "baileys",
        $and: [
          { data: { $exists: true } },
          { data: { $ne: null } },
          { data: { $ne: "" } },
        ],
      }).catch(() => []);

      console.log(`📋 Sesiones con authState en MongoDB: ${sessions.length}`);

      if (sessions.length === 0) {
        console.log(
          "ℹ️  No hay sesiones con authState válido en MongoDB. Limpiando sesiones huérfanas..."
        );

        // Limpiar sesiones huérfanas sin authState válido
        const orphanSessions = await WhatsAppSession.find({
          provider: "baileys",
          $or: [{ data: { $exists: false } }, { data: "" }, { data: null }],
        }).catch(() => []);

        if (orphanSessions.length > 0) {
          await WhatsAppSession.deleteMany({
            _id: { $in: orphanSessions.map((s) => s._id) },
          }).catch(() => {});
          console.log(
            `✅ ${orphanSessions.length} sesión(es) huérfana(s) eliminada(s)`
          );
        }

        return;
      }

      // Restaurar solo sesiones AUTENTICADAS (que tienen creds.me.id)
      let restoredCount = 0;
      let cleanedCount = 0;

      for (const session of sessions) {
        if (!session.shopId) {
          continue;
        }

        const shopId = session.shopId;

        try {
          // Verificar que el authState tiene credenciales VÁLIDAS y AUTENTICADAS
          const authState = session.getAuthState();
          if (!authState || !authState.creds?.me?.id) {
            console.log(
              `⚠️ Shop ${shopId} tiene authState pero NO está autenticado (nunca se escaneó QR). Limpiando...`
            );
            // Limpiar authState inválido/no autenticado
            await WhatsAppSession.findOneAndUpdate(
              { _id: session._id },
              { $unset: { data: "", number: "" }, isConnected: false },
              { upsert: false }
            ).catch(() => {});
            cleanedCount++;
            continue;
          }

          // Si las credenciales son válidas y autenticadas, restaurar la sesión
          console.log(
            `♻️ Restaurando sesión autenticada para shop ${shopId}...`
          );
          await this.restoreSession(shopId);
          restoredCount++;
          console.log(`✅ Sesión restaurada exitosamente para shop ${shopId}`);
        } catch (error) {
          console.error(
            `❌ Error al restaurar sesión para shop ${shopId}:`,
            error
          );
          // Limpiar la sesión fallida
          try {
            await WhatsAppSession.findOneAndUpdate(
              { _id: session._id },
              { $unset: { data: "", number: "" }, isConnected: false },
              { upsert: false }
            ).catch(() => {});
            cleanedCount++;
            console.log(`🧹 Sesión fallida limpiada para shop ${shopId}`);
          } catch (cleanupError) {
            console.error(
              `Error al limpiar sesión fallida para shop ${shopId}:`,
              cleanupError
            );
          }
        }
      }

      console.log(
        `✅ ${restoredCount} sesión(es) autenticada(s) restaurada(s)`
      );
      if (cleanedCount > 0) {
        console.log(`🧹 ${cleanedCount} sesión(es) incompleta(s) limpiada(s)`);
      }
      console.log("✅ Inicialización de sesiones completada");
    } catch (error) {
      console.error("❌ Error al inicializar sesiones existentes:", error);
    }
  }
}

// Instancia singleton del servicio
export const whatsappMultitenantManagerService =
  new WhatsAppMultitenantManagerService();
