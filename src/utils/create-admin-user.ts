import { User, Shop } from "../models";

interface AdminUserData {
  username: string;
  email: string;
  password: string;
  shopName: string;
  shopInternalName: string;
}

/**
 * Crea un usuario administrador inicial
 */
export async function createAdminUser(data: AdminUserData): Promise<void> {
  try {
    console.log("🔧 Creando usuario administrador inicial...");

    // Verificar si ya existe un usuario con ese email
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      console.log(`ℹ️  Usuario con email ${data.email} ya existe`);
      return;
    }

    // Crear o encontrar la tienda
    let shop = await Shop.findOne({ internalName: data.shopInternalName });
    if (!shop) {
      shop = new Shop({
        name: data.shopName,
        internalName: data.shopInternalName,
      });
      await shop.save();
      console.log(`✅ Tienda creada: ${data.shopName}`);
    } else {
      console.log(`ℹ️  Tienda ya existe: ${data.shopName}`);
    }

    // Crear el usuario administrador
    // No necesitamos hashear manualmente, el modelo User lo hace automáticamente
    const adminUser = new User({
      username: data.username,
      email: data.email,
      password: data.password, // El middleware pre-save del modelo lo hasheará
      shopId: shop._id,
      roles: ["ADMIN"],
      isActive: true,
    });

    await adminUser.save();
    console.log(
      `✅ Usuario administrador creado: ${data.username} (${data.email})`
    );
    console.log("🎉 Usuario administrador inicial creado exitosamente");
  } catch (error) {
    console.error("❌ Error al crear usuario administrador:", error);
    throw error;
  }
}

/**
 * Script para crear un usuario administrador desde la línea de comandos
 */
export async function createDefaultAdmin(): Promise<void> {
  const defaultAdminData: AdminUserData = {
    username: "admin",
    email: "admin@zenda.com",
    password: "admin123",
    shopName: "Zenda Principal",
    shopInternalName: "zenda-principal",
  };

  await createAdminUser(defaultAdminData);
}
