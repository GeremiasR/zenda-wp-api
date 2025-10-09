import {
  IWhatsAppProvider,
  IWhatsAppMessage,
  IConnectionStatus,
  IWhatsAppProviderConfig,
} from "../../interfaces/whatsapp-provider.interface";

export class TwilioProvider implements IWhatsAppProvider {
  public readonly providerName = "Twilio WhatsApp";
  public readonly providerId = "twilio";

  private connected: boolean = false;
  private config: IWhatsAppProviderConfig;
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  // Callbacks para eventos
  private messageCallback?: (message: IWhatsAppMessage) => Promise<void>;
  private connectionCallback?: (status: IConnectionStatus) => void;
  private qrCallback?: (qr: string) => void;

  constructor(config: IWhatsAppProviderConfig) {
    this.config = config;
    this.accountSid = config.credentials?.accountSid || "";
    this.authToken = config.credentials?.authToken || "";
    this.fromNumber = config.credentials?.fromNumber || "";
  }

  public async connect(): Promise<void> {
    // Twilio no requiere conexión persistente
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
      jid: this.fromNumber,
      provider: this.providerName,
    };
  }

  public async sendMessage(jid: string, message: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Twilio WhatsApp no está configurado");
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${this.accountSid}:${this.authToken}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${this.fromNumber}`,
            To: `whatsapp:${jid}`,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Error al enviar mensaje: ${response.statusText} - ${errorData}`
        );
      }

      console.log(`Mensaje enviado via Twilio a ${jid}: ${message}`);
    } catch (error) {
      console.error("Error al enviar mensaje via Twilio:", error);
      throw error;
    }
  }

  public async sendMessageToGroup(
    groupJid: string,
    message: string
  ): Promise<void> {
    // Twilio maneja grupos de la misma manera que mensajes individuales
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

  // Método específico para procesar webhooks de Twilio
  public async processWebhook(webhookData: any): Promise<void> {
    if (!this.messageCallback) return;

    try {
      const messageSid = webhookData.MessageSid;
      const from = webhookData.From?.replace("whatsapp:", "");
      const to = webhookData.To?.replace("whatsapp:", "");
      const body = webhookData.Body;

      if (messageSid && from && body) {
        const normalizedMessage: IWhatsAppMessage = {
          id: messageSid,
          from: from,
          to: to,
          text: body,
          timestamp: new Date(),
          isGroup: false, // Twilio no distingue grupos en este nivel
          rawMessage: webhookData,
        };

        await this.messageCallback(normalizedMessage);
      }
    } catch (error) {
      console.error("Error al procesar webhook de Twilio:", error);
    }
  }
}
