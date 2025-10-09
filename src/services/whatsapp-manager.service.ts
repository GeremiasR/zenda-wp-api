import {
  WhatsAppProviderFactory,
  IWhatsAppProvider,
  IWhatsAppMessage,
  WhatsAppProviderType,
} from "../providers/whatsapp";
import WhatsAppSession, {
  IWhatsAppSession,
} from "../models/whatsapp-session.model";
import { flowService } from "./flow.service";

export class WhatsAppManagerService {
  private sessions: Map<string, IWhatsAppProvider> = new Map();

  /**
   * Inicializa una sesión de WhatsApp con el proveedor especificado
   */
  public async initializeSession(
    sessionId: string,
    phoneNumber: string,
    provider: WhatsAppProviderType,
    credentials?: any,
    shopId?: string
  ): Promise<IWhatsAppProvider> {
    try {
      // Verificar si ya existe una sesión en la base de datos
      let session = await WhatsAppSession.findOne({ sessionId });

      if (!session) {
        // Crear nueva sesión en la base de datos
        session = new WhatsAppSession({
          sessionId,
          phoneNumber,
          provider,
          credentials,
          shopId,
          isConnected: false,
        });
        await session.save();
      } else {
        // Actualizar la sesión existente
        session.phoneNumber = phoneNumber;
        session.provider = provider;
        session.credentials = credentials;
        session.shopId = shopId;
        await session.save();
      }

      // Crear o obtener el proveedor
      const providerInstance = WhatsAppProviderFactory.createProvider({
        sessionId,
        phoneNumber,
        provider,
        credentials,
      });

      // Configurar callbacks del proveedor
      this.setupProviderCallbacks(providerInstance, sessionId);

      // Guardar la instancia del proveedor
      this.sessions.set(sessionId, providerInstance);

      return providerInstance;
    } catch (error) {
      console.error(`Error al inicializar sesión ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Conecta una sesión específica
   */
  public async connectSession(sessionId: string): Promise<void> {
    const provider = this.sessions.get(sessionId);
    if (!provider) {
      throw new Error(`Sesión ${sessionId} no encontrada`);
    }

    await provider.connect();

    // Actualizar estado en la base de datos
    await WhatsAppSession.findOneAndUpdate(
      { sessionId },
      { isConnected: true, lastSeen: new Date() }
    );
  }

  /**
   * Desconecta una sesión específica
   */
  public async disconnectSession(sessionId: string): Promise<void> {
    const provider = this.sessions.get(sessionId);
    if (!provider) {
      throw new Error(`Sesión ${sessionId} no encontrada`);
    }

    await provider.disconnect();

    // Actualizar estado en la base de datos
    await WhatsAppSession.findOneAndUpdate(
      { sessionId },
      { isConnected: false }
    );
  }

  /**
   * Obtiene el estado de una sesión
   */
  public async getSessionStatus(sessionId: string): Promise<{
    isConnected: boolean;
    jid?: string;
    provider: string;
  }> {
    const provider = this.sessions.get(sessionId);
    if (!provider) {
      throw new Error(`Sesión ${sessionId} no encontrada`);
    }

    return await provider.getConnectionStatus();
  }

  /**
   * Envía un mensaje a través de una sesión específica
   */
  public async sendMessage(
    sessionId: string,
    jid: string,
    message: string
  ): Promise<void> {
    const provider = this.sessions.get(sessionId);
    if (!provider) {
      throw new Error(`Sesión ${sessionId} no encontrada`);
    }

    if (!provider.isConnected()) {
      throw new Error(`Sesión ${sessionId} no está conectada`);
    }

    await provider.sendMessage(jid, message);
  }

  /**
   * Envía un mensaje a un grupo a través de una sesión específica
   */
  public async sendGroupMessage(
    sessionId: string,
    groupJid: string,
    message: string
  ): Promise<void> {
    const provider = this.sessions.get(sessionId);
    if (!provider) {
      throw new Error(`Sesión ${sessionId} no encontrada`);
    }

    if (!provider.isConnected()) {
      throw new Error(`Sesión ${sessionId} no está conectada`);
    }

    await provider.sendMessageToGroup(groupJid, message);
  }

  /**
   * Obtiene todas las sesiones activas
   */
  public async getActiveSessions(): Promise<IWhatsAppSession[]> {
    return await WhatsAppSession.findActiveSessions();
  }

  /**
   * Obtiene sesiones por proveedor
   */
  public async getSessionsByProvider(
    provider: string
  ): Promise<IWhatsAppSession[]> {
    return await WhatsAppSession.findByProvider(provider);
  }

  /**
   * Obtiene sesiones por tienda
   */
  public async getSessionsByShop(shopId: string): Promise<IWhatsAppSession[]> {
    return await WhatsAppSession.findByShop(shopId);
  }

  /**
   * Elimina una sesión
   */
  public async removeSession(sessionId: string): Promise<void> {
    const provider = this.sessions.get(sessionId);
    if (provider) {
      await provider.disconnect();
      this.sessions.delete(sessionId);
    }

    // Eliminar de la base de datos
    await WhatsAppSession.findOneAndDelete({ sessionId });
  }

  /**
   * Configura los callbacks para un proveedor
   */
  private setupProviderCallbacks(
    provider: IWhatsAppProvider,
    sessionId: string
  ): void {
    // Callback para mensajes entrantes
    provider.onMessage(async (message: IWhatsAppMessage) => {
      try {
        console.log(`Mensaje recibido en sesión ${sessionId}:`, message);

        // Procesar el mensaje a través del motor de flujos
        const { response } = await flowService.processMessage(
          message.from,
          message.to,
          message.text
        );

        // Enviar la respuesta generada por el motor de flujos
        if (response) {
          await provider.sendMessage(message.from, response);
        }
      } catch (error) {
        console.error(
          `Error al procesar mensaje en sesión ${sessionId}:`,
          error
        );
      }
    });

    // Callback para actualizaciones de conexión
    provider.onConnectionUpdate(async (status) => {
      try {
        console.log(
          `Estado de conexión actualizado para sesión ${sessionId}:`,
          status
        );

        // Actualizar estado en la base de datos
        await WhatsAppSession.findOneAndUpdate(
          { sessionId },
          {
            isConnected: status.isConnected,
            lastSeen: new Date(),
            qrCode: status.qrCode,
          }
        );
      } catch (error) {
        console.error(
          `Error al actualizar estado de sesión ${sessionId}:`,
          error
        );
      }
    });

    // Callback para códigos QR (solo para Baileys)
    provider.onQRCode(async (qr) => {
      try {
        console.log(`Código QR generado para sesión ${sessionId}`);

        // Guardar código QR en la base de datos
        await WhatsAppSession.findOneAndUpdate({ sessionId }, { qrCode: qr });
      } catch (error) {
        console.error(
          `Error al guardar código QR para sesión ${sessionId}:`,
          error
        );
      }
    });
  }

  /**
   * Inicializa todas las sesiones existentes en la base de datos
   */
  public async initializeExistingSessions(): Promise<void> {
    try {
      const sessions = await WhatsAppSession.find({ isConnected: true });

      for (const session of sessions) {
        try {
          const provider = WhatsAppProviderFactory.createProvider({
            sessionId: session.sessionId,
            phoneNumber: session.phoneNumber,
            provider: session.provider as WhatsAppProviderType,
            credentials: session.credentials,
          });

          this.setupProviderCallbacks(provider, session.sessionId);
          this.sessions.set(session.sessionId, provider);

          // Reconectar si es necesario
          if (session.provider === "baileys") {
            await provider.connect();
          }
        } catch (error) {
          console.error(
            `Error al inicializar sesión existente ${session.sessionId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error al inicializar sesiones existentes:", error);
    }
  }
}

// Instancia singleton del servicio
export const whatsappManagerService = new WhatsAppManagerService();
