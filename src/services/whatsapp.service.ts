import { Boom } from "@hapi/boom";
import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  WAMessage,
  WAMessageKey,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs";

export class WhatsAppService {
  private sock: WASocket | null = null;
  private authFolder: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(sessionName: string = "zenda-session") {
    this.authFolder = path.join(process.cwd(), "auth", sessionName);
    this.ensureAuthFolder();
  }

  private ensureAuthFolder(): void {
    if (!fs.existsSync(this.authFolder)) {
      fs.mkdirSync(this.authFolder, { recursive: true });
    }
  }

  public async connect(): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: ["Zenda WhatsApp Bot", "Chrome", "1.0.0"],
        generateHighQualityLinkPreview: true,
      });

      this.setupEventHandlers(saveCreds);
    } catch (error) {
      console.error("Error al conectar con WhatsApp:", error);
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

      if (qr) {
        console.log("Escanea el código QR con WhatsApp:");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (
          shouldReconnect &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          console.log("Reconectando...");
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 5000);
        } else {
          console.log("Conexión cerrada permanentemente");
          this.isConnected = false;
        }
      } else if (connection === "open") {
        console.log("✅ Conectado exitosamente a WhatsApp");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      }
    });

    // Manejar mensajes entrantes
    this.sock.ev.on("messages.upsert", async (m) => {
      const msg = m.messages[0];
      if (!msg.key.fromMe && m.type === "notify") {
        await this.handleIncomingMessage(msg);
      }
    });

    // Manejar errores de conexión
    this.sock.ev.on("connection.update", (update) => {
      if (update.lastDisconnect?.error) {
        console.error(
          "Error de conexión en WhatsApp:",
          update.lastDisconnect.error
        );
      }
    });
  }

  private async handleIncomingMessage(msg: WAMessage): Promise<void> {
    try {
      const messageText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";

      if (messageText) {
        console.log(`Mensaje recibido de ${msg.key.remoteJid}: ${messageText}`);

        // Respuesta automática básica
        const response = `Hola! Recibí tu mensaje: "${messageText}". ¿En qué puedo ayudarte?`;
        await this.sendMessage(msg.key.remoteJid!, response);
      }
    } catch (error) {
      console.error("Error al manejar mensaje:", error);
    }
  }

  public async sendMessage(jid: string, message: string): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error("WhatsApp no está conectado");
    }

    try {
      await this.sock.sendMessage(jid, { text: message });
      console.log(`Mensaje enviado a ${jid}: ${message}`);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      throw error;
    }
  }

  public async sendMessageToGroup(
    groupJid: string,
    message: string
  ): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error("WhatsApp no está conectado");
    }

    try {
      await this.sock.sendMessage(groupJid, { text: message });
      console.log(`Mensaje enviado al grupo ${groupJid}: ${message}`);
    } catch (error) {
      console.error("Error al enviar mensaje al grupo:", error);
      throw error;
    }
  }

  public async getConnectionStatus(): Promise<{
    isConnected: boolean;
    jid?: string;
  }> {
    if (!this.sock || !this.isConnected) {
      return { isConnected: false };
    }

    return {
      isConnected: true,
      jid: this.sock.user?.id,
    };
  }

  public async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.isConnected = false;
      console.log("Desconectado de WhatsApp");
    }
  }

  public isReady(): boolean {
    return this.isConnected && this.sock !== null;
  }
}

// Instancia singleton del servicio
export const whatsappService = new WhatsAppService();
