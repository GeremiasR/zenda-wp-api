import mongoose, { Document, Schema } from "mongoose";

// Interfaz para el documento de sesión de WhatsApp
export interface IWhatsAppSession extends Document {
  sessionId: string;
  phoneNumber: string;
  isConnected: boolean;
  lastSeen: Date;
  qrCode?: string;
  connectionData?: any;
  createdAt: Date;
  updatedAt: Date;
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
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: "whatsapp_sessions", // Nombre de la colección en MongoDB
  }
);

// Índices adicionales para optimizar consultas
WhatsAppSessionSchema.index({ phoneNumber: 1, isConnected: 1 });
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

// Método estático para encontrar sesiones activas
WhatsAppSessionSchema.statics.findActiveSessions = function () {
  return this.find({ isConnected: true });
};

// Método estático para limpiar sesiones inactivas
WhatsAppSessionSchema.statics.cleanInactiveSessions = function () {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 24);
  
  return this.updateMany(
    { 
      isConnected: true, 
      lastSeen: { $lt: cutoffDate } 
    },
    { 
      $set: { isConnected: false } 
    }
  );
};

// Crear y exportar el modelo
const WhatsAppSession = mongoose.model<IWhatsAppSession>("WhatsAppSession", WhatsAppSessionSchema);

export default WhatsAppSession;
