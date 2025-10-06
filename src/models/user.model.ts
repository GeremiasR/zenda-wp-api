import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

// Interfaz para el documento de usuario
export interface IUser extends Document {
  username: string;
  email: string;
  shopId: mongoose.Types.ObjectId;
  password: string;
  roleCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Esquema del usuario
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Por favor ingrese un email válido"],
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    roleCode: {
      type: String,
      required: true,
      enum: ["ADMIN", "SHOPADMIN", "SHOPUSER", "CUSTOMER"],
      default: "CUSTOMER",
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
UserSchema.index({ email: 1 });
UserSchema.index({ shopId: 1 });

// Middleware pre-save para hacer hash del password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Crear y exportar el modelo
const User = mongoose.model<IUser>("User", UserSchema);

export default User;
