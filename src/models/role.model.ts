import mongoose, { Document, Schema } from "mongoose";

/**
 * Interfaz para un módulo dentro de un rol
 */
export interface IRoleModule {
  name: string; // Nombre del módulo (ej: "user", "shop", "orders")
  actions: string[]; // Acciones permitidas (ej: ["view", "create", "update", "delete"])
}

/**
 * Interfaz para el documento de rol
 */
export interface IRole extends Document {
  code: string;
  label: string;
  modules: IRoleModule[]; // Módulos y acciones permitidas
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema para módulo dentro del rol
const RoleModuleSchema = new Schema<IRoleModule>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    actions: {
      type: [String],
      required: true,
      default: [],
    },
  },
  { _id: false }
);

// Esquema del rol
const RoleSchema = new Schema<IRole>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    modules: {
      type: [RoleModuleSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Índices adicionales para optimizar consultas
RoleSchema.index({ code: 1 }, { unique: true });

// Crear y exportar el modelo
const Role = mongoose.model<IRole>("Role", RoleSchema);

export default Role;
