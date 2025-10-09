/**
 * Script de prueba para la funcionalidad multitenant de WhatsApp
 * Ejecutar con: node test-multitenant.js
 */

const API_BASE_URL = "http://localhost:3000";

// Simular token JWT (en producción vendría del login)
const TEST_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0X3VzZXIiLCJzaG9wSWQiOiJzaG9wXzEyMyIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE3MDU0NzIwMDAsImV4cCI6MTcwNjA3NjgwMH0.test_signature";

async function testAPI() {
  console.log("🧪 Iniciando pruebas de API multitenant...\n");

  try {
    // 1. Probar activación de WhatsApp
    console.log("1️⃣ Probando activación de WhatsApp...");
    const activateResponse = await fetch(
      `${API_BASE_URL}/api/whatsapp-shop/activate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shopId: "shop_123" }),
      }
    );

    const activateData = await activateResponse.json();
    console.log("✅ Respuesta de activación:", activateData);

    if (activateData.success && activateData.data.qr) {
      console.log(
        "📱 QR generado:",
        activateData.data.qr.substring(0, 20) + "..."
      );
    }

    // 2. Probar obtención de estado
    console.log("\n2️⃣ Probando obtención de estado...");
    const statusResponse = await fetch(
      `${API_BASE_URL}/api/whatsapp-shop/shop_123/status`,
      {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    const statusData = await statusResponse.json();
    console.log("✅ Estado obtenido:", statusData);

    // 3. Probar obtención de QR
    console.log("\n3️⃣ Probando obtención de QR...");
    const qrResponse = await fetch(
      `${API_BASE_URL}/api/whatsapp-shop/shop_123/qr`,
      {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    const qrData = await qrResponse.json();
    console.log("✅ QR obtenido:", qrData);

    // 4. Simular envío de mensaje (solo si está conectado)
    if (statusData.data.isConnected) {
      console.log("\n4️⃣ Probando envío de mensaje...");
      const sendResponse = await fetch(
        `${API_BASE_URL}/api/whatsapp-shop/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shopId: "shop_123",
            jid: "5491123456789@s.whatsapp.net",
            message: "Mensaje de prueba desde la API multitenant",
          }),
        }
      );

      const sendData = await sendResponse.json();
      console.log("✅ Mensaje enviado:", sendData);
    } else {
      console.log("\n4️⃣ Saltando envío de mensaje (WhatsApp no conectado)");
    }

    // 5. Probar desactivación
    console.log("\n5️⃣ Probando desactivación...");
    const deactivateResponse = await fetch(
      `${API_BASE_URL}/api/whatsapp-shop/shop_123/deactivate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
      }
    );

    const deactivateData = await deactivateResponse.json();
    console.log("✅ Desactivación:", deactivateData);

    console.log("\n🎉 Todas las pruebas completadas exitosamente!");
  } catch (error) {
    console.error("❌ Error durante las pruebas:", error.message);
  }
}

// Función para probar con diferentes shops
async function testMultipleShops() {
  console.log("\n🔄 Probando múltiples shops...\n");

  const shops = ["shop_123", "shop_456", "shop_789"];

  for (const shopId of shops) {
    try {
      console.log(`📱 Probando shop: ${shopId}`);

      const response = await fetch(
        `${API_BASE_URL}/api/whatsapp-shop/activate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ shopId }),
        }
      );

      const data = await response.json();
      console.log(`✅ ${shopId}:`, data.success ? "Activado" : "Error");
    } catch (error) {
      console.error(`❌ ${shopId}:`, error.message);
    }
  }
}

// Función para verificar el estado del servidor
async function checkServerHealth() {
  try {
    console.log("🏥 Verificando estado del servidor...");
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    console.log("✅ Servidor:", data);
  } catch (error) {
    console.error("❌ Servidor no disponible:", error.message);
    process.exit(1);
  }
}

// Función principal
async function main() {
  console.log("🚀 Iniciando pruebas de sistema multitenant de WhatsApp\n");

  // Verificar que el servidor esté funcionando
  await checkServerHealth();

  // Ejecutar pruebas principales
  await testAPI();

  // Probar múltiples shops
  await testMultipleShops();

  console.log("\n✨ Pruebas completadas!");
  console.log("\n📋 Para usar desde el frontend:");
  console.log("1. Instala las dependencias: npm install");
  console.log("2. Configura las variables de entorno en .env");
  console.log("3. Inicia Redis: redis-server");
  console.log("4. Inicia el servidor: npm run dev");
  console.log(
    "5. Usa la API desde tu frontend con los ejemplos proporcionados"
  );
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAPI,
  testMultipleShops,
  checkServerHealth,
};
