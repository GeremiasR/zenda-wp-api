import { Request, Response } from "express";
import mongoose from "mongoose";
import { flowService } from "../services/flow.service";
import { Shop, Flow } from "../models";

export class FlowController {
  /**
   * Inicializa un flujo de ejemplo para una tienda
   */
  public async initializeExampleFlow(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { shopId } = req.params;

      // Validar shopId
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        res.status(400).json({
          success: false,
          message: "ID de tienda inválido",
        });
        return;
      }

      // Verificar que la tienda exista
      const shopExists = await Shop.findById(shopId);

      if (!shopExists) {
        // Si la tienda no existe, la creamos para el ejemplo
        const newShop = new Shop({
          name: "Tienda de Ejemplo",
          internalName: "tienda-ejemplo",
        });
        await newShop.save();

        const shopId = newShop._id ? newShop._id.toString() : "";

        // Crear el flujo de ejemplo
        const flow = await flowService.createExampleFlow(shopId);

        res.status(201).json({
          success: true,
          message: "Tienda y flujo de ejemplo creados exitosamente",
          data: {
            shop: newShop,
            flow: flow,
          },
        });
      } else {
        // Si la tienda existe, crear el flujo de ejemplo
        const flow = await flowService.createExampleFlow(shopId);

        res.status(200).json({
          success: true,
          message: "Flujo de ejemplo creado exitosamente",
          data: {
            flow: flow,
          },
        });
      }
    } catch (error: any) {
      console.error("Error al inicializar el flujo de ejemplo:", error);
      res.status(500).json({
        success: false,
        message: "Error al inicializar el flujo de ejemplo",
        error: error.message,
      });
    }
  }

  /**
   * Obtiene todos los flujos disponibles
   */
  public async getAllFlows(req: Request, res: Response): Promise<void> {
    try {
      const flows = await Flow.find({ isDeleted: false })
        .select("-__v")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: flows.length,
        data: flows,
      });
    } catch (error: any) {
      console.error("Error al obtener los flujos:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los flujos",
        error: error.message,
      });
    }
  }

  /**
   * Obtener todas las sesiones de mensaje activas
   */
  public async getAllMessageSessions(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { MessageSession } = require("../models");

      const sessions = await MessageSession.find()
        .populate("flowId", "name")
        .populate("shopId", "name")
        .select("-__v")
        .sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error: any) {
      console.error("Error al obtener las sesiones de mensaje:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las sesiones de mensaje",
        error: error.message,
      });
    }
  }
}

export const flowController = new FlowController();
export default flowController;
