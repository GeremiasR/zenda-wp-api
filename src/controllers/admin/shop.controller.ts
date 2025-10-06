import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import { Shop } from "../../models";
import { IShop } from "../../models";

class AdminShopController {
  async listShops(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const isActive = req.query.isActive as string;
      const search = req.query.search as string;

      // Construir filtros
      const filters: any = {};

      if (isActive !== undefined) {
        filters.isActive = isActive === "true";
      }

      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: "i" } },
          { internalName: { $regex: search, $options: "i" } },
        ];
      }

      // Calcular skip
      const skip = (page - 1) * limit;

      // Obtener tiendas con paginación
      const [shops, total] = await Promise.all([
        Shop.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Shop.countDocuments(filters),
      ]);

      const pages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        message: "Tiendas obtenidas exitosamente",
        data: {
          shops,
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

  async createShop(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, internalName, isActive = true } = req.body;

      // Validar datos de entrada
      if (!name || !internalName) {
        throw Boom.badRequest("Nombre e internalName son requeridos");
      }

      // Verificar si ya existe una tienda con ese internalName
      const existingShop = await Shop.findOne({ internalName });
      if (existingShop) {
        throw Boom.conflict("Ya existe una tienda con ese internalName");
      }

      // Crear nueva tienda
      const shop = new Shop({
        name,
        internalName,
        isActive,
      });

      await shop.save();

      res.status(201).json({
        success: true,
        message: "Tienda creada exitosamente",
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  }

  async getShopById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const shop = await Shop.findById(id);
      if (!shop) {
        throw Boom.notFound("Tienda no encontrada");
      }

      res.status(200).json({
        success: true,
        message: "Tienda obtenida exitosamente",
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateShop(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name, internalName, isActive } = req.body;

      const shop = await Shop.findById(id);
      if (!shop) {
        throw Boom.notFound("Tienda no encontrada");
      }

      // Verificar si el internalName ya existe en otra tienda
      if (internalName && internalName !== shop.internalName) {
        const existingShop = await Shop.findOne({
          internalName,
          _id: { $ne: id },
        });
        if (existingShop) {
          throw Boom.conflict("Ya existe una tienda con ese internalName");
        }
      }

      // Actualizar campos
      if (name !== undefined) shop.name = name;
      if (internalName !== undefined) shop.internalName = internalName;
      if (isActive !== undefined) shop.isActive = isActive;

      await shop.save();

      res.status(200).json({
        success: true,
        message: "Tienda actualizada exitosamente",
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleShopStatus(
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

      const shop = await Shop.findById(id);
      if (!shop) {
        throw Boom.notFound("Tienda no encontrada");
      }

      shop.isActive = isActive;
      await shop.save();

      const statusText = isActive ? "activada" : "desactivada";

      res.status(200).json({
        success: true,
        message: `Tienda ${statusText} exitosamente`,
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteShop(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const shop = await Shop.findById(id);
      if (!shop) {
        throw Boom.notFound("Tienda no encontrada");
      }

      await Shop.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Tienda eliminada exitosamente",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminShopController();
