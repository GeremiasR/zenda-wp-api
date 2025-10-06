import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";

/**
 * Middleware de manejo de errores
 * Captura errores y los formatea de manera consistente
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let boomError: Boom.Boom;

  // Si ya es un error de Boom, usarlo directamente
  if (Boom.isBoom(error)) {
    boomError = error;
  } else {
    // Si es un error de validación de Mongoose
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));

      boomError = Boom.badRequest("Error de validación", {
        validation: validationErrors,
      });
    }
    // Si es un error de duplicado de Mongoose
    else if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      boomError = Boom.conflict(`El ${field} ya existe`);
    }
    // Si es un error de JWT
    else if (error.name === "JsonWebTokenError") {
      boomError = Boom.unauthorized("Token inválido");
    } else if (error.name === "TokenExpiredError") {
      boomError = Boom.unauthorized("Token expirado");
    }
    // Error genérico
    else {
      boomError = Boom.boomify(error, { statusCode: 500 });
    }
  }

  // Log del error (solo en desarrollo o para errores 5xx)
  if (
    process.env.NODE_ENV === "development" ||
    boomError.output.statusCode >= 500
  ) {
    console.error("Error:", {
      message: boomError.message,
      statusCode: boomError.output.statusCode,
      stack: boomError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  }

  // Respuesta estructurada
  const response = {
    success: false,
    message: boomError.message,
    statusCode: boomError.output.statusCode,
    ...(boomError.data && { data: boomError.data }),
    ...(process.env.NODE_ENV === "development" && { stack: boomError.stack }),
  };

  res.status(boomError.output.statusCode).json(response);
};

/**
 * Middleware para manejar rutas no encontradas
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const boomError = Boom.notFound(
    `Ruta ${req.method} ${req.path} no encontrada`
  );

  res.status(boomError.output.statusCode).json({
    success: false,
    message: boomError.message,
    statusCode: boomError.output.statusCode,
  });
};
