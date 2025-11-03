import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import { roleService } from "../../services/role.service";
import { authorize } from "../../middlewares/authorize.middleware";

class AdminRoleController {
  /**
   * Lista todos los roles
   * GET /api/admin/roles
   */
  async listRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === "true";

      const roles = await roleService.listRoles(includeInactive);

      res.status(200).json({
        success: true,
        message: "Roles obtenidos exitosamente",
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crea un nuevo rol
   * POST /api/admin/roles
   */
  async createRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code, label, modules = [], isActive = true } = req.body;

      // Validar datos de entrada
      if (!code || !label) {
        throw Boom.badRequest("Code y label son requeridos");
      }

      const role = await roleService.createRole({
        code,
        label,
        modules,
        isActive,
      });

      res.status(201).json({
        success: true,
        message: "Rol creado exitosamente",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene un rol por ID
   * GET /api/admin/roles/:id
   */
  async getRoleById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const role = await roleService.getRoleById(id);

      res.status(200).json({
        success: true,
        message: "Rol obtenido exitosamente",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualiza un rol
   * PUT /api/admin/roles/:id
   */
  async updateRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { label, modules, isActive } = req.body;

      const role = await roleService.updateRole(id, {
        label,
        modules,
        isActive,
      });

      res.status(200).json({
        success: true,
        message: "Rol actualizado exitosamente",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Elimina un rol (soft delete)
   * DELETE /api/admin/roles/:id
   */
  async deleteRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      await roleService.deleteRole(id);

      res.status(200).json({
        success: true,
        message: "Rol eliminado exitosamente",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminRoleController();

