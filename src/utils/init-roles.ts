import { Role, IRoleModule } from "../models";

// Roles por defecto del sistema con estructura de módulos y acciones
const defaultRoles = [
  {
    code: "ADMIN",
    label: "Administrador",
    modules: [
      // Administrador tiene acceso completo a todos los módulos
      { name: "user", actions: ["view", "create", "update", "delete", "manage"] },
      { name: "role", actions: ["view", "create", "update", "delete", "manage"] },
      { name: "shop", actions: ["view", "create", "update", "delete", "manage"] },
      { name: "flow", actions: ["view", "create", "update", "delete", "manage"] },
      { name: "orders", actions: ["view", "create", "update", "delete", "manage"] },
      { name: "transactions", actions: ["view", "create", "update", "delete", "manage"] },
      { name: "whatsapp", actions: ["view", "create", "update", "delete", "manage"] },
    ] as IRoleModule[],
    isActive: true,
  },
  {
    code: "SHOPADMIN",
    label: "Administrador de Tienda",
    modules: [
      { name: "user", actions: ["view", "create", "update"] },
      { name: "shop", actions: ["view", "update"] },
      { name: "flow", actions: ["view", "create", "update", "delete"] },
      { name: "orders", actions: ["view", "create", "update", "delete", "manage"] },
      { name: "transactions", actions: ["view", "create", "update", "manage"] },
      { name: "whatsapp", actions: ["view", "create", "update", "manage"] },
    ] as IRoleModule[],
    isActive: true,
  },
  {
    code: "SHOPUSER",
    label: "Usuario de Tienda",
    modules: [
      { name: "orders", actions: ["view", "create", "update"] },
      { name: "transactions", actions: ["view", "create"] },
      { name: "whatsapp", actions: ["view"] },
    ] as IRoleModule[],
    isActive: true,
  },
  {
    code: "CUSTOMER",
    label: "Cliente",
    modules: [
      { name: "orders", actions: ["view"] },
      { name: "transactions", actions: ["view"] },
    ] as IRoleModule[],
    isActive: true,
  },
];

/**
 * Inicializa los roles por defecto en la base de datos
 */
export async function initializeRoles(): Promise<void> {
  try {
    console.log("🔧 Inicializando roles por defecto...");

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ code: roleData.code });

      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ Rol creado: ${roleData.code} - ${roleData.label}`);
      } else {
        console.log(`ℹ️  Rol ya existe: ${roleData.code} - ${roleData.label}`);
      }
    }

    console.log("🎉 Inicialización de roles completada");
  } catch (error) {
    console.error("❌ Error al inicializar roles:", error);
    throw error;
  }
}

/**
 * Verifica si los roles están correctamente configurados
 */
export async function verifyRoles(): Promise<boolean> {
  try {
    const roles = await Role.find({ isActive: true });
    const roleCodes = roles.map((role) => role.code);

    const requiredRoles = ["ADMIN", "SHOPADMIN", "SHOPUSER", "CUSTOMER"];
    const missingRoles = requiredRoles.filter(
      (role) => !roleCodes.includes(role)
    );

    if (missingRoles.length > 0) {
      console.warn(`⚠️  Roles faltantes: ${missingRoles.join(", ")}`);
      return false;
    }

    console.log("✅ Todos los roles están configurados correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error al verificar roles:", error);
    return false;
  }
}
