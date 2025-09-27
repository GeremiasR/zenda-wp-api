import morgan from "morgan";
import { NextFunction, Request, Response } from "express";

// Configuración personalizada de morgan para desarrollo
const developmentFormat =
  ":method :url :status :res[content-length] - :response-time ms";

// Configuración personalizada de morgan para producción (más resumida)
const productionFormat =
  ":remote-addr - :method :url :status :res[content-length] - :response-time ms";

export const logger = (req: Request, res: Response, next: Function) => {
  // Determinar el formato según el entorno
  const format =
    process.env.NODE_ENV === "production"
      ? productionFormat
      : developmentFormat;
  return morgan(format)(req, res, next as NextFunction);
};
