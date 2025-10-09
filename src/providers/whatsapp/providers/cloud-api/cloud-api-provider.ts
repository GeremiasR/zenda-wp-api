import {
  IWhatsAppProvider,
  IWhatsAppMessage,
  IConnectionStatus,
  IWhatsAppProviderConfig,
} from "../../interfaces/whatsapp-provider.interface";

export class CloudAPIProvider implements IWhatsAppProvider {
  public readonly providerName = "WhatsApp Cloud API";
  public readonly providerId = "cloud_api";

  private connected: boolean = false;
  private config: IWhatsAppProviderConfig;
  private accessToken: string;
  private phoneNumberId: string;
  private webhookVerifyToken: string;

  // Callbacks para eventos
  private messageCallback?: (message: IWhatsAppMessage) => Promise<void>;
  private connectionCallback?: (status: IConnectionStatus) => void;
  private qrCallback?: (qr: string) => void;

  constructor(config: IWhatsAppProviderConfig) {
    this.config = config;
    this.accessToken = config.credentials?.accessToken || "";
    this.phoneNumberId = config.credentials?.phoneNumberId || "";
    this.webhookVerifyToken = config.credentials?.webhookVerifyToken || "";
  }

  public async connect(): Promise<void> {
    // Cloud API no requiere conexión persistente como Baileys
    // La conexión se establece a través de webhooks
    this.connected = true;

    if (this.connectionCallback) {
      this.connectionCallback({
        isConnected: true,
        isConnecting: false,
      });
    }
  }

  public async disconnect(): Promise<void> {
    this.connected = false;

    if (this.connectionCallback) {
      this.connectionCallback({
        isConnected: false,
        isConnecting: false,
      });
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async getConnectionStatus(): Promise<{
    isConnected: boolean;
    jid?: string;
    provider: string;
  }> {
    return {
      isConnected: this.connected,
      jid: this.phoneNumberId,
      provider: this.providerName,
    };
  }

  public async sendMessage(jid: string, message: string): Promise<void> {
    if (!this.connected) {
      throw new Error("WhatsApp Cloud API no está configurado");
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: jid,
            type: "text",
            text: {
              body: message,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error al enviar mensaje: ${response.statusText}`);
      }

      console.log(`Mensaje enviado via Cloud API a ${jid}: ${message}`);
    } catch (error) {
      console.error("Error al enviar mensaje via Cloud API:", error);
      throw error;
    }
  }

  public async sendMessageToGroup(
    groupJid: string,
    message: string
  ): Promise<void> {
    // Cloud API maneja grupos de la misma manera que mensajes individuales
    await this.sendMessage(groupJid, message);
  }

  public onMessage(
    callback: (message: IWhatsAppMessage) => Promise<void>
  ): void {
    this.messageCallback = callback;
  }

  public onConnectionUpdate(
    callback: (status: IConnectionStatus) => void
  ): void {
    this.connectionCallback = callback;
  }

  public onQRCode(callback: (qr: string) => void): void {
    this.qrCallback = callback;
  }

  // Método específico para procesar webhooks de Cloud API
  public async processWebhook(webhookData: any): Promise<void> {
    if (!this.messageCallback) return;

    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        for (const message of value.messages) {
          const normalizedMessage: IWhatsAppMessage = {
            id: message.id,
            from: message.from,
            to: this.phoneNumberId,
            text: message.text?.body || "",
            timestamp: new Date(parseInt(message.timestamp) * 1000),
            isGroup: false, // Cloud API no distingue grupos en este nivel
            rawMessage: message,
          };

          await this.messageCallback(normalizedMessage);
        }
      }
    } catch (error) {
      console.error("Error al procesar webhook de Cloud API:", error);
    }
  }
}
