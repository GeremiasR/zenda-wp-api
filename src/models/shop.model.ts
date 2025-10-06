import mongoose, { Document, Schema } from "mongoose";

// Interfaz para el documento de tienda
export interface IShop extends Document {
  name: string;
  internalName: string;
  isActive: boolean;
}

// Esquema de la tienda
const ShopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    internalName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
ShopSchema.index({ name: 1 });
ShopSchema.index({ internalName: 1 }, { unique: true });
ShopSchema.index({ isActive: 1 });

// Crear y exportar el modelo
const Shop = mongoose.model<IShop>("Shop", ShopSchema);

export default Shop;
