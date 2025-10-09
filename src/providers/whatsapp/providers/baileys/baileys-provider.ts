import { Boom } from "@hapi/boom";
import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  WAMessage,
} from "@whiskeysockets/baileys";
import pino from "pino";
import path from "path";
import fs from "fs";
import {
  IWhatsAppProvider,
  IWhatsAppMessage,
  IConnectionStatus,
  IWhatsAppProviderConfig,
} from "../../interfaces/whatsapp-provider.interface";

export class BaileysProvider implements IWhatsAppProvider {
  public readonly providerName = "Baileys";
  public readonly providerId = "baileys";

  private sock: WASocket | null = null;
  private authFolder: string;
  private connected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private config: IWhatsAppProviderConfig;

  // Callbacks para eventos
  private messageCallback?: (message: IWhatsAppMessage) => Promise<void>;
  private connectionCallback?: (status: IConnectionStatus) => void;
  private qrCallback?: (qr: string) => void;

  constructor(config: IWhatsAppProviderConfig) {
    this.config = config;
    this.authFolder = path.join(process.cwd(), "auth", config.sessionId);
    this.ensureAuthFolder();
  }

  private ensureAuthFolder(): void {
    if (!fs.existsSync(this.authFolder)) {
      fs.mkdirSync(this.authFolder, { recursive: true });
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnecting || this.connected) {
      return;
    }

    this.isConnecting = true;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // No imprimir QR en terminal, usar callback
        logger: pino({ level: "silent" }),
        browser: ["Zenda WhatsApp Bot", "Chrome", "1.0.0"],
        generateHighQualityLinkPreview: true,
      });

      this.setupEventHandlers(saveCreds);
    } catch (error) {
      this.isConnecting = false;
      console.error("Error al conectar con WhatsApp Baileys:", error);
      throw error;
    }
  }

  private setupEventHandlers(saveCreds: () => Promise<void>): void {
    if (!this.sock) return;

    // Manejar actualización de credenciales
    this.sock.ev.on("creds.update", saveCreds);

    // Manejar actualizaciones de conexión
    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && this.qrCallback) {
        this.qrCallback(qr);
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
          console.log("Reconectando Baileys...");
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 5000);
        } else {
          console.log("Conexión Baileys cerrada permanentemente");
        }
      } else if (connection === "open") {
        console.log("✅ Conectado exitosamente a WhatsApp con Baileys");
        this.connected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        if (this.connectionCallback) {
          this.connectionCallback({
            isConnected: true,
            isConnecting: false,
          });
        }
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
          "Error de conexión en Baileys:",
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
        console.log("Desconectado de WhatsApp Baileys");
      } catch (error) {
        console.error("Error al desconectar de WhatsApp Baileys:", error);
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
      throw new Error("WhatsApp Baileys no está conectado");
    }

    try {
      await this.sock.sendMessage(jid, { text: message });
      console.log(`Mensaje enviado via Baileys a ${jid}: ${message}`);
    } catch (error) {
      console.error("Error al enviar mensaje via Baileys:", error);
      throw error;
    }
  }

  public async sendMessageToGroup(
    groupJid: string,
    message: string
  ): Promise<void> {
    if (!this.sock || !this.connected) {
      throw new Error("WhatsApp Baileys no está conectado");
    }

    try {
      await this.sock.sendMessage(groupJid, { text: message });
      console.log(
        `Mensaje enviado via Baileys al grupo ${groupJid}: ${message}`
      );
    } catch (error) {
      console.error("Error al enviar mensaje al grupo via Baileys:", error);
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
}
