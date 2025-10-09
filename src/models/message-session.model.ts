import mongoose, { Document, Schema } from "mongoose";

// Interfaz para el documento de sesión de mensajes
export interface IMessageSession extends Document {
  shopId: mongoose.Types.ObjectId;
  from: string; // Número del usuario que envía el mensaje
  to: string; // Número de WhatsApp al que se envía el mensaje
  flowId: mongoose.Types.ObjectId;
  currentState: string; // Estado actual en el flujo
  lastActivity: Date; // Última actividad en la sesión
  createdAt: Date;
  updatedAt: Date;
}

// Esquema de la sesión de mensajes
const MessageSessionSchema = new Schema<IMessageSession>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    from: {
      type: String,
      required: true,
      index: true,
    },
    to: {
      type: String,
      required: true,
      index: true,
    },
    flowId: {
      type: Schema.Types.ObjectId,
      ref: "Flow",
      required: true,
    },
    currentState: {
      type: String,
      required: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Índices compuestos para consultas eficientes
MessageSessionSchema.index({ from: 1, to: 1, flowId: 1 }, { unique: true });
MessageSessionSchema.index({ shopId: 1 });
MessageSessionSchema.index({ flowId: 1 });

// Método para actualizar el estado actual
MessageSessionSchema.methods.updateState = function (newState: string) {
  this.currentState = newState;
  return this.save();
};

// Método estático para encontrar o crear una sesión
MessageSessionSchema.statics.findOrCreate = async function (
  shopId: mongoose.Types.ObjectId,
  from: string,
  to: string,
  flowId: mongoose.Types.ObjectId,
  initialState: string
): Promise<IMessageSession> {
  let session = await this.findOne({
    from,
    to,
    flowId,
  });

  if (!session) {
    session = new this({
      shopId,
      from,
      to,
      flowId,
      currentState: initialState,
    });
    await session.save();
  }

  return session;
};

// Crear y exportar el modelo
const MessageSession = mongoose.model<IMessageSession>(
  "MessageSession",
  MessageSessionSchema
);

export default MessageSession;
