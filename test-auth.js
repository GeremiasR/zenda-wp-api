/**
 * Script de prueba para la API de autenticación
 * Ejecutar con: node test-auth.js
 */

const BASE_URL = "http://localhost:3000/api/auth";

async function testAuthAPI() {
  console.log("🧪 Iniciando pruebas de la API de autenticación...\n");

  try {
    // 1. Health Check
    console.log("1. Probando Health Check...");
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log("✅ Health Check:", healthData.message);

    // 2. Login
    console.log("\n2. Probando Login...");
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@zenda.com",
        password: "admin123",
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falló: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log("✅ Login exitoso");
    console.log(
      "   Access Token:",
      loginData.data.access_token.substring(0, 50) + "..."
    );
    console.log(
      "   Refresh Token:",
      loginData.data.refresh_token.substring(0, 20) + "..."
    );

    const { access_token, refresh_token } = loginData.data;

    // 3. Obtener Perfil
    console.log("\n3. Probando obtener perfil...");
    const profileResponse = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileResponse.ok) {
      throw new Error(`Obtener perfil falló: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    console.log(
      "✅ Perfil obtenido:",
      profileData.data.username,
      `(${profileData.data.roleCode})`
    );

    // 4. Verificar Token
    console.log("\n4. Probando verificación de token...");
    const verifyResponse = await fetch(`${BASE_URL}/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!verifyResponse.ok) {
      throw new Error(`Verificación de token falló: ${verifyResponse.status}`);
    }

    const verifyData = await verifyResponse.json();
    console.log("✅ Token válido:", verifyData.data.valid);

    // 5. Refresh Token
    console.log("\n5. Probando refresh token...");
    const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    if (!refreshResponse.ok) {
      throw new Error(`Refresh token falló: ${refreshResponse.status}`);
    }

    const refreshData = await refreshResponse.json();
    console.log("✅ Token renovado exitosamente");
    console.log(
      "   Nuevo Access Token:",
      refreshData.data.access_token.substring(0, 50) + "..."
    );

    // 6. Logout
    console.log("\n6. Probando logout...");
    const logoutResponse = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshData.data.refresh_token }),
    });

    if (!logoutResponse.ok) {
      throw new Error(`Logout falló: ${logoutResponse.status}`);
    }

    const logoutData = await logoutResponse.json();
    console.log("✅ Logout exitoso");

    console.log("\n🎉 Todas las pruebas pasaron exitosamente!");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error.message);

    if (error.message.includes("fetch")) {
      console.log(
        "\n💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000"
      );
      console.log("   Ejecuta: npm run dev");
    }
  }
}

// Ejecutar las pruebas
testAuthAPI();
