import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import { Flow, Shop } from "../../models";
import { IFlow } from "../../models";

class AdminFlowController {
  async listFlows(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const isActive = req.query.isActive as string;
      const shopId = req.query.shopId as string;
      const search = req.query.search as string;

      // Construir filtros
      const filters: any = {
        isDeleted: false, // Solo flujos no eliminados
      };

      if (isActive !== undefined) {
        filters.isActive = isActive === "true";
      }

      if (shopId) {
        filters.shopId = shopId;
      }

      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ];
      }

      // Calcular skip
      const skip = (page - 1) * limit;

      // Obtener flujos con paginación
      const [flows, total] = await Promise.all([
        Flow.find(filters)
          .populate("shopId", "name internalName")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Flow.countDocuments(filters),
      ]);

      const pages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        message: "Flujos obtenidos exitosamente",
        data: {
          flows,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createFlow(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        name,
        description,
        phoneNumber,
        shopId,
        initialState,
        states,
        isActive = true,
      } = req.body;

      // Validar datos de entrada
      if (!name || !phoneNumber || !shopId || !initialState || !states) {
        throw Boom.badRequest(
          "Nombre, phoneNumber, shopId, initialState y states son requeridos"
        );
      }

      // Validar formato de teléfono
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw Boom.badRequest("Formato de número de teléfono inválido");
      }

      // Verificar que la tienda existe
      const shop = await Shop.findById(shopId);
      if (!shop) {
        throw Boom.badRequest("Tienda no encontrada");
      }

      // Verificar que el initialState existe en los states
      if (!states[initialState]) {
        throw Boom.badRequest(
          "El estado inicial debe existir en los estados del flujo"
        );
      }

      // Crear nuevo flujo
      const flow = new Flow({
        name,
        description,
        phoneNumber,
        shopId,
        initialState,
        states,
        isActive,
      });

      await flow.save();

      // Obtener flujo con tienda poblada
      const flowWithShop = await Flow.findById(flow._id)
        .populate("shopId", "name internalName")
        .lean();

      res.status(201).json({
        success: true,
        message: "Flujo creado exitosamente",
        data: flowWithShop,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFlowById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const flow = await Flow.findOne({ _id: id, isDeleted: false }).populate(
        "shopId",
        "name internalName"
      );

      if (!flow) {
        throw Boom.notFound("Flujo no encontrado");
      }

      res.status(200).json({
        success: true,
        message: "Flujo obtenido exitosamente",
        data: flow,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFlow(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        phoneNumber,
        shopId,
        initialState,
        states,
        isActive,
      } = req.body;

      const flow = await Flow.findOne({ _id: id, isDeleted: false });
      if (!flow) {
        throw Boom.notFound("Flujo no encontrado");
      }

      // Validar formato de teléfono si se proporciona
      if (phoneNumber) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
          throw Boom.badRequest("Formato de número de teléfono inválido");
        }
      }

      // Verificar que la tienda existe si se proporciona
      if (shopId && shopId !== flow.shopId.toString()) {
        const shop = await Shop.findById(shopId);
        if (!shop) {
          throw Boom.badRequest("Tienda no encontrada");
        }
      }

      // Verificar que el initialState existe en los states si se proporcionan
      if (initialState && states && !states[initialState]) {
        throw Boom.badRequest(
          "El estado inicial debe existir en los estados del flujo"
        );
      }

      // Actualizar campos
      if (name !== undefined) flow.name = name;
      if (description !== undefined) flow.description = description;
      // phoneNumber ya no existe en el modelo
      if (shopId !== undefined) flow.shopId = shopId;
      if (initialState !== undefined) flow.initialState = initialState;
      if (states !== undefined) flow.states = states;
      if (isActive !== undefined) flow.isActive = isActive;

      await flow.save();

      // Obtener flujo actualizado con tienda poblada
      const updatedFlow = await Flow.findById(flow._id)
        .populate("shopId", "name internalName")
        .lean();

      res.status(200).json({
        success: true,
        message: "Flujo actualizado exitosamente",
        data: updatedFlow,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleFlowStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        throw Boom.badRequest("isActive debe ser un valor booleano");
      }

      const flow = await Flow.findOne({ _id: id, isDeleted: false });
      if (!flow) {
        throw Boom.notFound("Flujo no encontrado");
      }

      flow.isActive = isActive;
      await flow.save();

      const statusText = isActive ? "activado" : "desactivado";

      // Obtener flujo actualizado con tienda poblada
      const updatedFlow = await Flow.findById(flow._id)
        .populate("shopId", "name internalName")
        .lean();

      res.status(200).json({
        success: true,
        message: `Flujo ${statusText} exitosamente`,
        data: updatedFlow,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFlow(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const flow = await Flow.findOne({ _id: id, isDeleted: false });
      if (!flow) {
        throw Boom.notFound("Flujo no encontrado");
      }

      // Soft delete - marcar como eliminado
      flow.isDeleted = true;
      await flow.save();

      res.status(200).json({
        success: true,
        message: "Flujo eliminado exitosamente",
      });
    } catch (error) {
      next(error);
    }
  }

  async hardDeleteFlow(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const flow = await Flow.findOne({ _id: id, isDeleted: false });
      if (!flow) {
        throw Boom.notFound("Flujo no encontrado");
      }

      // Hard delete - eliminar permanentemente
      await Flow.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Flujo eliminado permanentemente",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminFlowController();
