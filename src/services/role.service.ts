import { Role, IRole, IRoleModule } from "../models";
import Boom from "@hapi/boom";

/**
 * Interfaz para crear un rol
 */
export interface CreateRoleData {
  code: string;
  label: string;
  modules?: IRoleModule[];
  isActive?: boolean;
}

/**
 * Interfaz para actualizar un rol
 */
export interface UpdateRoleData {
  label?: string;
  modules?: IRoleModule[];
  isActive?: boolean;
}

/**
 * Servicio para gestionar roles
 */
export class RoleService {
  /**
   * Crea un nuevo rol
   */
  async createRole(data: CreateRoleData): Promise<IRole> {
    const { code, label, modules = [], isActive = true } = data;

    // Verificar si ya existe un rol con ese código
    const existingRole = await Role.findOne({ code: code.toUpperCase() });
    if (existingRole) {
      throw Boom.conflict(`Ya existe un rol con el código '${code}'`);
    }

    // Validar estructura de módulos
    this.validateModules(modules);

    const role = new Role({
      code: code.toUpperCase(),
      label,
      modules,
      isActive,
    });

    await role.save();
    return role;
  }

  /**
   * Obtiene todos los roles activos
   */
  async listRoles(includeInactive = false): Promise<IRole[]> {
    const filters: any = {};
    if (!includeInactive) {
      filters.isActive = true;
    }

    return Role.find(filters).sort({ code: 1 });
  }

  /**
   * Obtiene un rol por ID
   */
  async getRoleById(id: string): Promise<IRole> {
    const role = await Role.findById(id);
    if (!role) {
      throw Boom.notFound("Rol no encontrado");
    }
    return role;
  }

  /**
   * Obtiene un rol por código
   */
  async getRoleByCode(code: string): Promise<IRole | null> {
    return Role.findOne({ code: code.toUpperCase() });
  }

  /**
   * Actualiza un rol
   */
  async updateRole(id: string, data: UpdateRoleData): Promise<IRole> {
    const role = await Role.findById(id);
    if (!role) {
      throw Boom.notFound("Rol no encontrado");
    }

    // Validar estructura de módulos si se proporcionan
    if (data.modules) {
      this.validateModules(data.modules);
    }

    // Actualizar campos
    if (data.label !== undefined) role.label = data.label;
    if (data.modules !== undefined) role.modules = data.modules;
    if (data.isActive !== undefined) role.isActive = data.isActive;

    await role.save();
    return role;
  }

  /**
   * Elimina un rol (soft delete)
   */
  async deleteRole(id: string): Promise<void> {
    const role = await Role.findById(id);
    if (!role) {
      throw Boom.notFound("Rol no encontrado");
    }

    // Soft delete: marcar como inactivo
    role.isActive = false;
    await role.save();
  }

  /**
   * Valida la estructura de módulos
   */
  private validateModules(modules: IRoleModule[]): void {
    if (!Array.isArray(modules)) {
      throw Boom.badRequest("Los módulos deben ser un array");
    }

    for (const module of modules) {
      if (!module.name || typeof module.name !== "string") {
        throw Boom.badRequest("Cada módulo debe tener un nombre válido");
      }

      if (!Array.isArray(module.actions)) {
        throw Boom.badRequest("Las acciones deben ser un array");
      }

      if (module.actions.length === 0) {
        throw Boom.badRequest(`El módulo '${module.name}' debe tener al menos una acción`);
      }

      // Validar que las acciones sean strings
      for (const action of module.actions) {
        if (typeof action !== "string") {
          throw Boom.badRequest("Las acciones deben ser strings");
        }
      }
    }
  }
}

// Instancia singleton del servicio
export const roleService = new RoleService();

