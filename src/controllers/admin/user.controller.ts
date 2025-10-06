import { Request, Response, NextFunction } from "express";
import Boom from "@hapi/boom";
import { User, Shop } from "../../models";
import { IUser } from "../../models";

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
      const roleCode = req.query.roleCode as string;
      const shopId = req.query.shopId as string;
      const search = req.query.search as string;

      // Construir filtros
      const filters: any = {};

      if (isActive !== undefined) {
        filters.isActive = isActive === "true";
      }

      if (roleCode) {
        filters.roleCode = roleCode;
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
        roleCode,
        isActive = true,
      } = req.body;

      // Validar datos de entrada
      if (!username || !email || !password || !shopId || !roleCode) {
        throw Boom.badRequest("Todos los campos son requeridos");
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
        roleCode,
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
      const { username, email, shopId, roleCode, isActive } = req.body;

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

      // Actualizar campos
      if (username !== undefined) user.username = username;
      if (email !== undefined) user.email = email;
      if (shopId !== undefined) user.shopId = shopId;
      if (roleCode !== undefined) user.roleCode = roleCode;
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
}

export default new AdminUserController();
