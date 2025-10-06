import mongoose, { Document, Schema } from "mongoose";

// Interfaz para el documento de rol
export interface IRole extends Document {
  code: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema del rol
const RoleSchema = new Schema<IRole>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ["ADMIN", "SHOPADMIN", "SHOPUSER", "CUSTOMER"],
    },
    label: {
      type: String,
      required: true,
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
