import mongoose from "mongoose";

/**
 * Utilidades para trabajar con la base de datos MongoDB
 */

/**
 * Convierte un ObjectId de MongoDB a string
 */
export const objectIdToString = (id: mongoose.Types.ObjectId | string): string => {
  return id.toString();
};

/**
 * Convierte un string a ObjectId de MongoDB
 */
export const stringToObjectId = (id: string): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId(id);
};

/**
 * Valida si un string es un ObjectId válido
 */
export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Crea un nuevo ObjectId
 */
export const createObjectId = (): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId();
};

/**
 * Convierte un documento de Mongoose a objeto plano
 */
export const toPlainObject = (doc: mongoose.Document): any => {
  return doc.toObject();
};

/**
 * Convierte múltiples documentos a objetos planos
 */
export const toPlainObjects = (docs: mongoose.Document[]): any[] => {
  return docs.map(doc => doc.toObject());
};

/**
 * Maneja errores de validación de Mongoose
 */
export const handleValidationError = (error: any): string => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    return errors.join(', ');
  }
  return error.message || 'Error de validación';
};

/**
 * Maneja errores de duplicado de Mongoose
 */
export const handleDuplicateError = (error: any): string => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return `El ${field} ya existe`;
  }
  return error.message || 'Error de duplicado';
};

/**
 * Maneja errores de base de datos de forma general
 */
export const handleDatabaseError = (error: any): string => {
  if (error.name === 'ValidationError') {
    return handleValidationError(error);
  }
  if (error.code === 11000) {
    return handleDuplicateError(error);
  }
  return error.message || 'Error de base de datos';
};
