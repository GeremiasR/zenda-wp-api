import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import { User, Shop } from "../../models";
import { IUser } from "../../models";
import { roleService } from "../../services/role.service";

class AdminUserController {
  async listUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const isActive = req.query.isActive as string;
      const role = req.query.role as string; // Cambiar de roleCode a role
      const shopId = req.query.shopId as string;
      const search = req.query.search as string;

      // Construir filtros
      const filters: any = {};

      if (isActive !== undefined) {
        filters.isActive = isActive === "true";
      }

      if (role) {
        // Filtrar usuarios que tengan este rol en su array de roles
        filters.roles = role;
      }

      if (shopId) {
        filters.shopId = shopId;
      }

      if (search) {
        filters.$or = [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Calcular skip
      const skip = (page - 1) * limit;

      // Obtener usuarios con paginación
      const [users, total] = await Promise.all([
        User.find(filters)
          .populate("shopId", "name internalName")
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(filters),
      ]);

      const pages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        message: "Usuarios obtenidos exitosamente",
        data: {
          users,
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

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        username,
        email,
        password,
        shopId,
        roles, // Cambiar de roleCode a roles (array)
        isActive = true,
      } = req.body;

      // Validar datos de entrada
      if (!username || !email || !password || !shopId || !roles) {
        throw Boom.badRequest("Todos los campos son requeridos");
      }

      // Validar que roles sea un array
      if (!Array.isArray(roles) || roles.length === 0) {
        throw Boom.badRequest("Roles debe ser un array con al menos un rol");
      }

      // Verificar que todos los roles existen
      for (const roleCode of roles) {
        const role = await roleService.getRoleByCode(roleCode);
        if (!role || !role.isActive) {
          throw Boom.badRequest(
            `El rol '${roleCode}' no existe o está inactivo`
          );
        }
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw Boom.badRequest("Formato de email inválido");
      }

      // Verificar si ya existe un usuario con ese email o username
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        throw Boom.conflict("Ya existe un usuario con ese email o username");
      }

      // Verificar que la tienda existe
      const shop = await Shop.findById(shopId);
      if (!shop) {
        throw Boom.badRequest("Tienda no encontrada");
      }

      // Crear nuevo usuario
      const user = new User({
        username,
        email,
        password,
        shopId,
        roles, // Usar array de roles
        isActive,
      });

      await user.save();

      // Obtener usuario sin contraseña
      const userResponse = await User.findById(user._id)
        .populate("shopId", "name internalName")
        .select("-password")
        .lean();

      res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente",
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id)
        .populate("shopId", "name internalName")
        .select("-password");

      if (!user) {
        throw Boom.notFound("Usuario no encontrado");
      }

      res.status(200).json({
        success: true,
        message: "Usuario obtenido exitosamente",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { username, email, shopId, roles, isActive } = req.body; // Cambiar de roleCode a roles

      const user = await User.findById(id);
      if (!user) {
        throw Boom.notFound("Usuario no encontrado");
      }

      // Verificar si el email ya existe en otro usuario
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          email,
          _id: { $ne: id },
        });
        if (existingUser) {
          throw Boom.conflict("Ya existe un usuario con ese email");
        }
      }

      // Verificar si el username ya existe en otro usuario
      if (username && username !== user.username) {
        const existingUser = await User.findOne({
          username,
          _id: { $ne: id },
        });
        if (existingUser) {
          throw Boom.conflict("Ya existe un usuario con ese username");
        }
      }

      // Verificar que la tienda existe
      if (shopId && shopId !== user.shopId.toString()) {
        const shop = await Shop.findById(shopId);
        if (!shop) {
          throw Boom.badRequest("Tienda no encontrada");
        }
      }

      // Validar roles si se proporcionan
      if (roles !== undefined) {
        if (!Array.isArray(roles) || roles.length === 0) {
          throw Boom.badRequest("Roles debe ser un array con al menos un rol");
        }

        // Verificar que todos los roles existen
        for (const roleCode of roles) {
          const role = await roleService.getRoleByCode(roleCode);
          if (!role || !role.isActive) {
            throw Boom.badRequest(
              `El rol '${roleCode}' no existe o está inactivo`
            );
          }
        }
      }

      // Actualizar campos
      if (username !== undefined) user.username = username;
      if (email !== undefined) user.email = email;
      if (shopId !== undefined) user.shopId = shopId;
      if (roles !== undefined) user.roles = roles; // Usar array de roles
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();

      // Obtener usuario actualizado sin contraseña
      const updatedUser = await User.findById(user._id)
        .populate("shopId", "name internalName")
        .select("-password")
        .lean();

      res.status(200).json({
        success: true,
        message: "Usuario actualizado exitosamente",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleUserStatus(
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

      const user = await User.findById(id);
      if (!user) {
        throw Boom.notFound("Usuario no encontrado");
      }

      user.isActive = isActive;
      await user.save();

      const statusText = isActive ? "activado" : "desactivado";

      // Obtener usuario actualizado sin contraseña
      const updatedUser = await User.findById(user._id)
        .populate("shopId", "name internalName")
        .select("-password")
        .lean();

      res.status(200).json({
        success: true,
        message: `Usuario ${statusText} exitosamente`,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista los roles disponibles para asignar a usuarios
   * GET /api/admin/users/available-roles
   */
  async getAvailableRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const roles = await roleService.listRoles(false); // Solo roles activos

      // Formatear para el frontend
      const rolesFormatted = roles.map((role) => ({
        code: role.code,
        label: role.label,
      }));

      res.status(200).json({
        success: true,
        message: "Roles disponibles obtenidos exitosamente",
        data: rolesFormatted,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminUserController();
