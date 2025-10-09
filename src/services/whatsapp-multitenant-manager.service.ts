import { BaileysMultitenantProvider } from "../providers/whatsapp/providers/baileys/baileys-multitenant-provider";
import {
  IWhatsAppProvider,
  IWhatsAppMessage,
  WhatsAppProviderType,
  WhatsAppProviderFactory,
} from "../providers/whatsapp";
import { redisService } from "./redis.service";
import { flowService } from "./flow.service";
import WhatsAppSession from "../models/whatsapp-session.model";

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
        const qr = await redisService.getQRCode(shopId);
        return {
          message: "Sesión ya activa",
          sessionId: `shop_${shopId}`,
          qr: qr || undefined,
        };
      }

      // Verificar si hay una sesión en Redis
      const isActive = await redisService.isSessionActive(shopId);
      if (isActive) {
        // Restaurar sesión existente
        return await this.restoreSession(shopId);
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

      // Obtener QR
      const qr = await redisService.getQRCode(shopId);

      return {
        qr: qr || undefined,
        message: qr ? "QR generado exitosamente" : "Esperando QR...",
        sessionId,
      };
    } catch (error) {
      console.error(`Error al iniciar sesión para shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Restaura una sesión existente desde Redis
   */
  private async restoreSession(shopId: string): Promise<{
    qr?: string;
    message: string;
    sessionId: string;
  }> {
    try {
      // Buscar la sesión en MongoDB para obtener flowId
      const session = await WhatsAppSession.findOne({
        shopId,
        isConnected: true,
      });
      if (!session) {
        throw new Error(`No se encontró sesión activa para shop ${shopId}`);
      }

      const sessionId = session.sessionId;
      const phoneNumber = session.phoneNumber;
      const flowId = session.flowId?.toString() || "";

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

      const qr = await redisService.getQRCode(shopId);

      return {
        qr: qr || undefined,
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

      let qr: string | null = null;
      let phoneNumber: string | undefined;
      let lastConnection: string | undefined;

      if (isActive) {
        qr = await redisService.getQRCode(shopId);
        const sessionData = await redisService.getSessionData(shopId);
        phoneNumber = sessionData?.number;
        lastConnection = sessionData?.lastConnection;
      }

      return {
        isActive,
        isConnected,
        qr: qr || undefined,
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
   */
  public async deactivateShopSession(shopId: string): Promise<void> {
    try {
      const provider = this.activeSessions.get(shopId);
      if (provider) {
        await provider.disconnect();
        this.activeSessions.delete(shopId);
      }

      // Limpiar datos de Redis
      await redisService.deleteSession(shopId);

      // Actualizar en MongoDB
      await WhatsAppSession.findOneAndUpdate(
        { shopId },
        { isConnected: false }
      );

      console.log(`Sesión desactivada para shop ${shopId}`);
    } catch (error) {
      console.error(`Error al desactivar sesión para shop ${shopId}:`, error);
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
      const sessionData = await redisService.getSessionData(shopId);
      sessions.push({
        shopId,
        isConnected: provider.isConnected(),
        phoneNumber: sessionData?.number,
        lastConnection: sessionData?.lastConnection,
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
    // Callback para mensajes entrantes
    provider.onMessage(async (message: IWhatsAppMessage) => {
      try {
        console.log(`Mensaje recibido en shop ${shopId}:`, message);

        // Procesar el mensaje a través del motor de flujos usando flowId
        const { response } = await flowService.processMessageByFlowId(
          message.from,
          message.to,
          message.text,
          flowId
        );

        // Enviar la respuesta generada por el motor de flujos
        if (response) {
          await provider.sendMessage(message.from, response);
        }
      } catch (error) {
        console.error(`Error al procesar mensaje en shop ${shopId}:`, error);
      }
    });

    // Callback para actualizaciones de conexión
    provider.onConnectionUpdate(async (status) => {
      try {
        console.log(
          `Estado de conexión actualizado para shop ${shopId}:`,
          status
        );

        // Obtener el número de teléfono desde Redis si está conectado
        let phoneNumber = `shop_${shopId}_phone`; // Placeholder por defecto
        if (status.isConnected) {
          const sessionData = await redisService.getSessionData(shopId);
          phoneNumber = sessionData?.number || phoneNumber;
          console.log(
            `📱 Número actualizado en MongoDB para shop ${shopId}: ${phoneNumber}`
          );
        }

        // Actualizar estado en MongoDB
        await WhatsAppSession.findOneAndUpdate(
          { shopId },
          {
            isConnected: status.isConnected,
            lastSeen: new Date(),
            qrCode: status.qrCode,
            phoneNumber: phoneNumber,
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
    provider.onQRCode(async (qr) => {
      try {
        console.log(`Código QR generado para shop ${shopId}`);
        await redisService.saveQRCode(shopId, qr);
      } catch (error) {
        console.error(`Error al guardar código QR para shop ${shopId}:`, error);
      }
    });
  }

  /**
   * Inicializa todas las sesiones existentes al arrancar el servidor
   */
  public async initializeExistingSessions(): Promise<void> {
    try {
      console.log("🔄 Inicializando sesiones existentes...");
      const activeShops = await redisService.getAllActiveSessions();
      console.log(
        `Sesiones con credenciales encontradas: ${activeShops.length}`
      );

      if (activeShops.length === 0) {
        console.log("ℹ️  No hay sesiones activas para restaurar");
        return;
      }

      for (const shopId of activeShops) {
        try {
          await this.restoreSession(shopId);
          console.log(`✅ Sesión restaurada para shop ${shopId}`);
        } catch (error) {
          console.error(
            `❌ Error al restaurar sesión para shop ${shopId}:`,
            error
          );
          // Limpiar la sesión fallida
          try {
            await redisService.deleteSession(shopId);
            console.log(`🧹 Sesión fallida limpiada para shop ${shopId}`);
          } catch (cleanupError) {
            console.error(
              `Error al limpiar sesión fallida para shop ${shopId}:`,
              cleanupError
            );
          }
        }
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
