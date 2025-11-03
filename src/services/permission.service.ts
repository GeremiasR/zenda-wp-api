import { Role, IRole } from "../models";

/**
 * Interfaz para permisos consolidados
 */
export interface ConsolidatedPermissions {
  modules: string[]; // Lista de módulos únicos
  permissions: Record<string, string[]>; // Módulo → Acciones permitidas
}

/**
 * Servicio para gestionar permisos y cálculos de permisos
 */
export class PermissionService {
  /**
   * Combina permisos de múltiples roles en un objeto consolidado
   * @param roles Array de roles con sus módulos y acciones
   * @returns Permisos consolidados
   */
  combineRolePermissions(roles: IRole[]): ConsolidatedPermissions {
    const permissions: Record<string, Set<string>> = {};
    const modules = new Set<string>();

    // Combinar permisos de todos los roles
    for (const role of roles) {
      if (!role.isActive || !role.modules || role.modules.length === 0) {
        continue;
      }

      for (const module of role.modules) {
        const moduleName = module.name;
        modules.add(moduleName);

        // Inicializar Set si no existe
        if (!permissions[moduleName]) {
          permissions[moduleName] = new Set<string>();
        }

        // Agregar todas las acciones del módulo
        for (const action of module.actions) {
          permissions[moduleName].add(action);
        }
      }
    }

    // Convertir Sets a Arrays para el resultado final
    const consolidatedPermissions: Record<string, string[]> = {};
    for (const moduleName of Object.keys(permissions)) {
      consolidatedPermissions[moduleName] = Array.from(permissions[moduleName]);
    }

    return {
      modules: Array.from(modules),
      permissions: consolidatedPermissions,
    };
  }

  /**
   * Calcula permisos consolidados de un usuario basándose en sus roles
   * @param roleCodes Array de códigos de roles del usuario
   * @returns Permisos consolidados o null si no hay roles
   */
  async calculateUserPermissions(roleCodes: string[]): Promise<ConsolidatedPermissions | null> {
    if (!roleCodes || roleCodes.length === 0) {
      return null;
    }

    // Obtener todos los roles del usuario
    const roles = await Role.find({
      code: { $in: roleCodes },
      isActive: true,
    });

    if (roles.length === 0) {
      return null;
    }

    return this.combineRolePermissions(roles);
  }

  /**
   * Verifica si un usuario tiene un permiso específico
   * @param permissions Permisos consolidados del usuario
   * @param module Módulo a verificar
   * @param action Acción a verificar
   * @returns true si tiene el permiso
   */
  hasPermission(
    permissions: ConsolidatedPermissions | null,
    module: string,
    action: string
  ): boolean {
    if (!permissions || !permissions.permissions[module]) {
      return false;
    }

    const allowedActions = permissions.permissions[module];

    // Verificar si tiene la acción específica o "manage" (acceso total)
    return allowedActions.includes(action) || allowedActions.includes("manage");
  }

  /**
   * Verifica si un usuario tiene acceso a un módulo (cualquier acción)
   * @param permissions Permisos consolidados del usuario
   * @param module Módulo a verificar
   * @returns true si tiene acceso al módulo
   */
  hasModuleAccess(permissions: ConsolidatedPermissions | null, module: string): boolean {
    if (!permissions) {
      return false;
    }

    return permissions.modules.includes(module);
  }
}

// Instancia singleton del servicio
export const permissionService = new PermissionService();

