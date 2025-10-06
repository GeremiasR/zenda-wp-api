import { Role } from "../models";

// Roles por defecto del sistema
const defaultRoles = [
  {
    code: "ADMIN",
    label: "Administrador",
    isActive: true,
  },
  {
    code: "SHOPADMIN",
    label: "Administrador de Tienda",
    isActive: true,
  },
  {
    code: "SHOPUSER",
    label: "Usuario de Tienda",
    isActive: true,
  },
  {
    code: "CUSTOMER",
    label: "Cliente",
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
