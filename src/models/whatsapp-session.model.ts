import mongoose, { Document, Schema, Model } from "mongoose";
import { AuthenticationState } from "@whiskeysockets/baileys";

// Interfaz para el documento de sesión de WhatsApp
export interface IWhatsAppSession extends Document {
  sessionId: string;
  phoneNumber: string;
  provider: string; // Tipo de proveedor (baileys, cloud_api, twilio, etc.)
  isConnected: boolean;
  lastSeen: Date;
  qrCode?: string;
  connectionData?: any;
  data?: string; // authState completo serializado en Base64 (creds + keys)
  number?: string; // Número de teléfono una vez autenticado (después de escanear QR)
  shopId?: string; // ID de la tienda asociada
  flowId?: mongoose.Types.ObjectId; // ID del flujo asociado
  createdAt: Date;
  updatedAt: Date;
  isActive(): boolean;
  getAuthState(): AuthenticationState | null;
  saveAuthState(authState: AuthenticationState): Promise<void>;
}

// Interfaz para los métodos estáticos del modelo
export interface IWhatsAppSessionModel extends Model<IWhatsAppSession> {
  findActiveSessions(): Promise<IWhatsAppSession[]>;
  findByProvider(provider: string): Promise<IWhatsAppSession[]>;
  findByShop(shopId: string): Promise<IWhatsAppSession[]>;
  findByFlow(flowId: string): Promise<IWhatsAppSession[]>;
  cleanInactiveSessions(): Promise<any>;
}

// Esquema de la sesión de WhatsApp
const WhatsAppSessionSchema = new Schema<IWhatsAppSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["baileys", "cloud_api", "twilio", "meta_business"],
      default: "baileys",
      index: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    qrCode: {
      type: String,
      required: false,
    },
    connectionData: {
      type: Schema.Types.Mixed,
      required: false,
    },
    data: {
      type: String,
      required: false,
    },
    number: {
      type: String,
      required: false,
      index: true,
    },
    shopId: {
      type: String,
      required: false,
      index: true,
    },
    flowId: {
      type: Schema.Types.ObjectId,
      ref: "Flow",
      required: false,
      index: true,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: "whatsapp_sessions", // Nombre de la colección en MongoDB
  }
);

// Índices adicionales para optimizar consultas
WhatsAppSessionSchema.index({ phoneNumber: 1, isConnected: 1 });
WhatsAppSessionSchema.index({ provider: 1, isConnected: 1 });
WhatsAppSessionSchema.index({ shopId: 1, isConnected: 1 });
WhatsAppSessionSchema.index({ flowId: 1, isConnected: 1 });
WhatsAppSessionSchema.index({ number: 1, isConnected: 1 });
WhatsAppSessionSchema.index({ createdAt: -1 });

// Middleware pre-save para actualizar lastSeen cuando cambie isConnected
WhatsAppSessionSchema.pre("save", function (next) {
  if (this.isModified("isConnected") && this.isConnected) {
    this.lastSeen = new Date();
  }
  next();
});

// Método de instancia para verificar si la sesión está activa
WhatsAppSessionSchema.methods.isActive = function (): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - this.lastSeen.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);

  // Considerar activa si se conectó en las últimas 24 horas
  return this.isConnected && hoursDiff < 24;
};

// Método de instancia para obtener authState desde Base64
WhatsAppSessionSchema.methods.getAuthState = function (): AuthenticationState | null {
  if (!this.data) {
    return null;
  }

  try {
    const decoded = Buffer.from(this.data, "base64").toString("utf-8");
    const authState = JSON.parse(decoded);
    return authState as AuthenticationState;
  } catch (error) {
    console.error("Error al deserializar authState desde Base64:", error);
    return null;
  }
};

// Método de instancia para guardar authState como Base64
WhatsAppSessionSchema.methods.saveAuthState = async function (
  authState: AuthenticationState
): Promise<void> {
  try {
    const serialized = JSON.stringify(authState);
    const base64 = Buffer.from(serialized, "utf-8").toString("base64");
    this.data = base64;

    // Si tiene creds.me.id, actualizar number
    if (authState.creds?.me?.id) {
      this.number = authState.creds.me.id;
    }

    await this.save();
  } catch (error) {
    console.error("Error al serializar authState a Base64:", error);
    throw error;
  }
};

// Método estático para encontrar sesiones activas
WhatsAppSessionSchema.statics.findActiveSessions = function () {
  return this.find({ isConnected: true });
};

// Método estático para encontrar sesiones por proveedor
WhatsAppSessionSchema.statics.findByProvider = function (provider: string) {
  return this.find({ provider, isConnected: true });
};

// Método estático para encontrar sesiones por tienda
WhatsAppSessionSchema.statics.findByShop = function (shopId: string) {
  return this.find({ shopId, isConnected: true });
};

// Método estático para encontrar sesiones por flujo
WhatsAppSessionSchema.statics.findByFlow = function (flowId: string) {
  return this.find({ flowId, isConnected: true });
};

// Método estático para limpiar sesiones inactivas
WhatsAppSessionSchema.statics.cleanInactiveSessions = function () {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 24);

  return this.updateMany(
    {
      isConnected: true,
      lastSeen: { $lt: cutoffDate },
    },
    {
      $set: { isConnected: false },
    }
  );
};

// Crear y exportar el modelo
const WhatsAppSession = mongoose.model<IWhatsAppSession, IWhatsAppSessionModel>(
  "WhatsAppSession",
  WhatsAppSessionSchema
);

export default WhatsAppSession;
