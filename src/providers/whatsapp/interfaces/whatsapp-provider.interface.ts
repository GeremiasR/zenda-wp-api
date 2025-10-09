import { WAMessage } from "@whiskeysockets/baileys";

// Interfaz base para todos los proveedores de WhatsApp
export interface IWhatsAppProvider {
  // Identificación del proveedor
  readonly providerName: string;
  readonly providerId: string;

  // Gestión de conexión
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): Promise<{
    isConnected: boolean;
    jid?: string;
    provider: string;
  }>;

  // Envío de mensajes
  sendMessage(jid: string, message: string): Promise<void>;
  sendMessageToGroup(groupJid: string, message: string): Promise<void>;

  // Eventos
  onMessage(callback: (message: IWhatsAppMessage) => Promise<void>): void;
  onConnectionUpdate(callback: (status: IConnectionStatus) => void): void;
  onQRCode(callback: (qr: string) => void): void;
}

// Interfaz para mensajes normalizados
export interface IWhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  isGroup: boolean;
  groupId?: string;
  rawMessage?: any; // Mensaje original del proveedor
}

// Interfaz para estado de conexión
export interface IConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastError?: string;
  qrCode?: string;
}

// Interfaz para configuración de proveedores
export interface IWhatsAppProviderConfig {
  sessionId: string;
  phoneNumber: string;
  provider: string;
  credentials?: any;
  options?: any;
  shopId?: string;
}

// Enum para tipos de proveedores
export enum WhatsAppProviderType {
  BAILEYS = "baileys",
  CLOUD_API = "cloud_api",
  TWILIO = "twilio",
  META_BUSINESS = "meta_business",
}
