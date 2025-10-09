import mongoose, { Document, Schema } from "mongoose";

// Interfaz para la opción de un estado
export interface IFlowOption {
  input: string[];
  event: string;
  next: string;
}

// Interfaz para un estado del flujo
export interface IFlowState {
  message: string;
  options: IFlowOption[];
}

// Interfaz para el documento de flujo
export interface IFlow extends Document {
  name: string;
  description: string;
  shopId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isDeleted: boolean;
  initialState: string;
  states: Record<string, IFlowState>;
  getState(stateName: string): IFlowState | null;
  getNextState(
    currentState: string,
    userInput: string
  ): { nextState: string; event: string } | null;
}

// Schema para las opciones de un estado
const FlowOptionSchema = new Schema<IFlowOption>(
  {
    input: {
      type: [String],
      required: true,
    },
    event: {
      type: String,
      required: true,
    },
    next: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Schema para un estado del flujo
const FlowStateSchema = new Schema<IFlowState>(
  {
    message: {
      type: String,
      required: true,
    },
    options: {
      type: [FlowOptionSchema],
      required: true,
    },
  },
  { _id: false }
);

// Schema para el flujo
const FlowSchema = new Schema<IFlow>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    initialState: {
      type: String,
      required: true,
    },
    states: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (states: Record<string, IFlowState>) {
          // Validar que exista el initialState en los states
          return Object.keys(states).length > 0;
        },
        message: "El flujo debe tener al menos un estado",
      },
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Índices adicionales para optimizar consultas
FlowSchema.index({ shopId: 1 });
FlowSchema.index({ isActive: 1, isDeleted: 1 });

// Middleware para validar que el initialState exista en los states
FlowSchema.pre("validate", function (next) {
  if (this.states && this.initialState && !this.states[this.initialState]) {
    return next(
      new Error("El estado inicial debe existir en los estados del flujo")
    );
  }
  next();
});

// Método para obtener un estado del flujo
FlowSchema.methods.getState = function (stateName: string): IFlowState | null {
  return this.states[stateName] || null;
};

// Método para obtener el siguiente estado basado en un input
FlowSchema.methods.getNextState = function (
  currentState: string,
  userInput: string
): { nextState: string; event: string } | null {
  const state = this.getState(currentState);

  if (!state) return null;

  // Normalizar input del usuario (minúsculas, sin acentos, etc.)
  const normalizedInput = userInput.toLowerCase().trim();

  // Buscar la opción que coincida con el input del usuario
  for (const option of state.options) {
    for (const input of option.input) {
      if (
        normalizedInput === input.toLowerCase() ||
        normalizedInput.includes(input.toLowerCase())
      ) {
        return {
          nextState: option.next,
          event: option.event,
        };
      }
    }
  }

  // No se encontró una coincidencia
  return null;
};

// Crear y exportar el modelo
const Flow = mongoose.model<IFlow>("Flow", FlowSchema);

export default Flow;
