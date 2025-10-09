import { Boom } from "@hapi/boom";
import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  WASocket,
  WAMessage,
  AuthenticationState,
} from "@whiskeysockets/baileys";
import { initAuthCreds } from "@whiskeysockets/baileys/lib/Utils/auth-utils";
import pino from "pino";
import {
  IWhatsAppProvider,
  IWhatsAppMessage,
  IConnectionStatus,
  IWhatsAppProviderConfig,
} from "../../interfaces/whatsapp-provider.interface";
import { redisService } from "../../../../services/redis.service";

export class BaileysMultitenantProvider implements IWhatsAppProvider {
  public readonly providerName = "Baileys Multitenant";
  public readonly providerId = "baileys_multitenant";

  private sock: WASocket | null = null;
  private connected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private config: IWhatsAppProviderConfig;
  private shopId: string;

  // Callbacks para eventos
  private messageCallback?: (message: IWhatsAppMessage) => Promise<void>;
  private connectionCallback?: (status: IConnectionStatus) => void;
  private qrCallback?: (qr: string) => void;

  constructor(config: IWhatsAppProviderConfig, shopId: string) {
    this.config = config;
    this.shopId = shopId;
  }

  public async connect(): Promise<void> {
    if (this.isConnecting || this.connected) {
      return;
    }

    this.isConnecting = true;

    try {
      // Obtener credenciales desde Redis
      const creds = await redisService.getCredentials(this.shopId);
      const keys = await redisService.getKeys(this.shopId);

      console.log(`🔍 Intentando conectar Baileys para shop ${this.shopId}`);
      console.log(`📋 Credenciales encontradas:`, !!creds);
      console.log(`🔑 Keys encontradas:`, !!keys);

      // Si no hay credenciales, inicializar credenciales nuevas (para nueva sesión)
      // Si hay credenciales, usar las existentes (para restaurar sesión)
      const authState: AuthenticationState = creds
        ? { creds, keys: keys || {} }
        : { creds: initAuthCreds(), keys: {} };

      this.sock = makeWASocket({
        auth: authState,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Zenda WhatsApp Bot", "Chrome", "1.0.0"],
        generateHighQualityLinkPreview: true,
      });

      this.setupEventHandlers();
    } catch (error) {
      this.isConnecting = false;
      console.error(
        `Error al conectar con WhatsApp Baileys para shop ${this.shopId}:`,
        error
      );
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.sock) return;

    // Manejar actualización de credenciales
    this.sock.ev.on("creds.update", async (update) => {
      try {
        await redisService.saveCredentials(this.shopId, update);
        await redisService.saveKeys(this.shopId, update);
      } catch (error) {
        console.error(
          `Error al guardar credenciales para shop ${this.shopId}:`,
          error
        );
      }
    });

    // Manejar actualizaciones de conexión
    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && this.qrCallback) {
        this.qrCallback(qr);
        // Guardar QR en Redis temporalmente
        redisService.saveQRCode(this.shopId, qr).catch(console.error);
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        this.connected = false;
        this.isConnecting = false;

        if (this.connectionCallback) {
          this.connectionCallback({
            isConnected: false,
            isConnecting: false,
            lastError: lastDisconnect?.error?.message,
          });
        }

        if (
          shouldReconnect &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          console.log(`Reconectando Baileys para shop ${this.shopId}...`);
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 5000);
        } else {
          console.log(
            `Conexión Baileys cerrada permanentemente para shop ${this.shopId}`
          );
        }
      } else if (connection === "open") {
        console.log(
          `✅ Conectado exitosamente a WhatsApp con Baileys para shop ${this.shopId}`
        );
        this.connected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        if (this.connectionCallback) {
          this.connectionCallback({
            isConnected: true,
            isConnecting: false,
          });
        }

        // Guardar estado de sesión activa
        const phoneNumber = this.normalizePhoneNumber(
          this.sock?.user?.id || ""
        );
        console.log(
          `📱 Número de teléfono detectado para shop ${this.shopId}: ${phoneNumber}`
        );

        redisService
          .saveSessionData(this.shopId, {
            connected: true,
            number: phoneNumber,
            jid: this.sock?.user?.id, // Guardar también el JID completo
            lastConnection: new Date().toISOString(),
            provider: this.providerId,
          })
          .catch(console.error);
      }
    });

    // Manejar mensajes entrantes
    this.sock.ev.on("messages.upsert", async (m) => {
      const msg = m.messages[0];
      if (!msg.key.fromMe && m.type === "notify" && this.messageCallback) {
        const normalizedMessage = this.normalizeMessage(msg);
        await this.messageCallback(normalizedMessage);
      }
    });

    // Manejar errores de conexión
    this.sock.ev.on("connection.update", (update) => {
      if (update.lastDisconnect?.error) {
        console.error(
          `Error de conexión en Baileys para shop ${this.shopId}:`,
          update.lastDisconnect.error
        );
        if (this.connectionCallback) {
          this.connectionCallback({
            isConnected: false,
            isConnecting: false,
            lastError: update.lastDisconnect.error.message,
          });
        }
      }
    });
  }

  private normalizeMessage(msg: WAMessage): IWhatsAppMessage {
    const messageText =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    const fromNumber = this.normalizePhoneNumber(
      msg.key.remoteJid || undefined
    );
    const toNumber = this.normalizePhoneNumber(this.sock?.user?.id || "");
    const isGroup = msg.key.remoteJid?.includes("@g.us") || false;

    return {
      id: msg.key.id || "",
      from: fromNumber,
      to: toNumber,
      text: messageText,
      timestamp: new Date(
        msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now()
      ),
      isGroup,
      groupId: isGroup ? msg.key.remoteJid || undefined : undefined,
      rawMessage: msg,
    };
  }

  private normalizePhoneNumber(jid?: string): string {
    if (!jid) return "";
    let normalized = jid.split("@")[0];
    normalized = normalized.split(":")[0];
    normalized = normalized.split(".")[0];
    return normalized;
  }

  public async disconnect(): Promise<void> {
    if (this.sock) {
      try {
        await this.sock.logout();
        this.sock = null;
        this.connected = false;
        this.isConnecting = false;

        // Limpiar datos de Redis
        await redisService.deleteSession(this.shopId);

        console.log(
          `Desconectado de WhatsApp Baileys para shop ${this.shopId}`
        );
      } catch (error) {
        console.error(
          `Error al desconectar de WhatsApp Baileys para shop ${this.shopId}:`,
          error
        );
        throw error;
      }
    }
  }

  public isConnected(): boolean {
    return this.connected && this.sock !== null;
  }

  public async getConnectionStatus(): Promise<{
    isConnected: boolean;
    jid?: string;
    provider: string;
  }> {
    if (!this.sock || !this.connected) {
      return {
        isConnected: false,
        provider: this.providerName,
      };
    }

    return {
      isConnected: true,
      jid: this.sock.user?.id,
      provider: this.providerName,
    };
  }

  public async sendMessage(jid: string, message: string): Promise<void> {
    if (!this.sock || !this.connected) {
      throw new Error(
        `WhatsApp Baileys no está conectado para shop ${this.shopId}`
      );
    }

    try {
      await this.sock.sendMessage(jid, { text: message });
      console.log(
        `Mensaje enviado via Baileys a ${jid} desde shop ${this.shopId}: ${message}`
      );
    } catch (error) {
      console.error(
        `Error al enviar mensaje via Baileys para shop ${this.shopId}:`,
        error
      );
      throw error;
    }
  }

  public async sendMessageToGroup(
    groupJid: string,
    message: string
  ): Promise<void> {
    if (!this.sock || !this.connected) {
      throw new Error(
        `WhatsApp Baileys no está conectado para shop ${this.shopId}`
      );
    }

    try {
      await this.sock.sendMessage(groupJid, { text: message });
      console.log(
        `Mensaje enviado via Baileys al grupo ${groupJid} desde shop ${this.shopId}: ${message}`
      );
    } catch (error) {
      console.error(
        `Error al enviar mensaje al grupo via Baileys para shop ${this.shopId}:`,
        error
      );
      throw error;
    }
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

  // Método específico para obtener QR desde Redis
  public async getQRCode(): Promise<string | null> {
    return await redisService.getQRCode(this.shopId);
  }
}
