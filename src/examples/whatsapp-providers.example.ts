import { whatsappManagerService } from "../services/whatsapp-manager.service";
import { WhatsAppProviderType } from "../providers/whatsapp";

/**
 * Ejemplo de cómo usar el nuevo sistema de proveedores de WhatsApp
 */
export class WhatsAppProvidersExample {
  /**
   * Ejemplo: Crear una sesión con Baileys (desarrollo)
   */
  public static async createBaileysSession() {
    try {
      const sessionId = "ejemplo-baileys";
      const phoneNumber = "1234567890";
      const provider = WhatsAppProviderType.BAILEYS;
      const shopId = "tienda-ejemplo";

      console.log("Creando sesión con Baileys...");

      const providerInstance = await whatsappManagerService.initializeSession(
        sessionId,
        phoneNumber,
        provider,
        undefined, // Baileys no requiere credenciales
        shopId
      );

      console.log("Sesión creada exitosamente");

      // Conectar la sesión
      await whatsappManagerService.connectSession(sessionId);
      console.log("Sesión conectada");

      // Enviar un mensaje de prueba
      await whatsappManagerService.sendMessage(
        sessionId,
        "1234567890@s.whatsapp.net",
        "Hola desde Baileys!"
      );
      console.log("Mensaje enviado");

      return sessionId;
    } catch (error) {
      console.error("Error al crear sesión con Baileys:", error);
      throw error;
    }
  }

  /**
   * Ejemplo: Crear una sesión con WhatsApp Cloud API (producción)
   */
  public static async createCloudAPISession() {
    try {
      const sessionId = "ejemplo-cloud-api";
      const phoneNumber = "1234567890";
      const provider = WhatsAppProviderType.CLOUD_API;
      const shopId = "tienda-ejemplo";

      const credentials = {
        accessToken: "EAAxxxxxxxxxxxx", // Token de acceso de Meta
        phoneNumberId: "123456789012345", // ID del número de teléfono
        webhookVerifyToken: "mi_token_secreto", // Token de verificación del webhook
      };

      console.log("Creando sesión con WhatsApp Cloud API...");

      const providerInstance = await whatsappManagerService.initializeSession(
        sessionId,
        phoneNumber,
        provider,
        credentials,
        shopId
      );

      console.log("Sesión creada exitosamente");

      // Conectar la sesión
      await whatsappManagerService.connectSession(sessionId);
      console.log("Sesión conectada");

      // Enviar un mensaje de prueba
      await whatsappManagerService.sendMessage(
        sessionId,
        "1234567890",
        "Hola desde WhatsApp Cloud API!"
      );
      console.log("Mensaje enviado");

      return sessionId;
    } catch (error) {
      console.error("Error al crear sesión con Cloud API:", error);
      throw error;
    }
  }

  /**
   * Ejemplo: Crear una sesión con Twilio (producción)
   */
  public static async createTwilioSession() {
    try {
      const sessionId = "ejemplo-twilio";
      const phoneNumber = "1234567890";
      const provider = WhatsAppProviderType.TWILIO;
      const shopId = "tienda-ejemplo";

      const credentials = {
        accountSid: "ACxxxxxxxxxxxx", // SID de la cuenta de Twilio
        authToken: "xxxxxxxxxxxx", // Token de autenticación
        fromNumber: "whatsapp:+1234567890", // Número de teléfono de Twilio
      };

      console.log("Creando sesión con Twilio...");

      const providerInstance = await whatsappManagerService.initializeSession(
        sessionId,
        phoneNumber,
        provider,
        credentials,
        shopId
      );

      console.log("Sesión creada exitosamente");

      // Conectar la sesión
      await whatsappManagerService.connectSession(sessionId);
      console.log("Sesión conectada");

      // Enviar un mensaje de prueba
      await whatsappManagerService.sendMessage(
        sessionId,
        "whatsapp:+1234567890",
        "Hola desde Twilio!"
      );
      console.log("Mensaje enviado");

      return sessionId;
    } catch (error) {
      console.error("Error al crear sesión con Twilio:", error);
      throw error;
    }
  }

  /**
   * Ejemplo: Gestionar múltiples sesiones para diferentes tiendas
   */
  public static async manageMultipleSessions() {
    try {
      console.log("Gestionando múltiples sesiones...");

      // Crear sesiones para diferentes tiendas
      const sessions = [
        {
          sessionId: "tienda-1-baileys",
          phoneNumber: "1111111111",
          provider: WhatsAppProviderType.BAILEYS,
          shopId: "tienda-1",
        },
        {
          sessionId: "tienda-2-cloud-api",
          phoneNumber: "2222222222",
          provider: WhatsAppProviderType.CLOUD_API,
          shopId: "tienda-2",
          credentials: {
            accessToken: "EAAxxxxxxxxxxxx",
            phoneNumberId: "123456789012345",
            webhookVerifyToken: "mi_token_secreto",
          },
        },
        {
          sessionId: "tienda-3-twilio",
          phoneNumber: "3333333333",
          provider: WhatsAppProviderType.TWILIO,
          shopId: "tienda-3",
          credentials: {
            accountSid: "ACxxxxxxxxxxxx",
            authToken: "xxxxxxxxxxxx",
            fromNumber: "whatsapp:+3333333333",
          },
        },
      ];

      // Inicializar todas las sesiones
      for (const sessionConfig of sessions) {
        await whatsappManagerService.initializeSession(
          sessionConfig.sessionId,
          sessionConfig.phoneNumber,
          sessionConfig.provider,
          sessionConfig.credentials,
          sessionConfig.shopId
        );
        console.log(`Sesión ${sessionConfig.sessionId} inicializada`);
      }

      // Obtener todas las sesiones activas
      const activeSessions = await whatsappManagerService.getActiveSessions();
      console.log("Sesiones activas:", activeSessions.length);

      // Obtener sesiones por tienda
      const tienda1Sessions = await whatsappManagerService.getSessionsByShop(
        "tienda-1"
      );
      console.log("Sesiones de tienda-1:", tienda1Sessions.length);

      // Obtener sesiones por proveedor
      const baileysSessions =
        await whatsappManagerService.getSessionsByProvider("baileys");
      console.log("Sesiones de Baileys:", baileysSessions.length);

      return sessions.map((s) => s.sessionId);
    } catch (error) {
      console.error("Error al gestionar múltiples sesiones:", error);
      throw error;
    }
  }

  /**
   * Ejemplo: Limpiar sesiones
   */
  public static async cleanupSessions(sessionIds: string[]) {
    try {
      console.log("Limpiando sesiones...");

      for (const sessionId of sessionIds) {
        await whatsappManagerService.removeSession(sessionId);
        console.log(`Sesión ${sessionId} eliminada`);
      }

      console.log("Limpieza completada");
    } catch (error) {
      console.error("Error al limpiar sesiones:", error);
      throw error;
    }
  }
}

// Ejemplo de uso
if (require.main === module) {
  async function runExample() {
    try {
      console.log("=== Ejemplo de Proveedores de WhatsApp ===\n");

      // Ejemplo 1: Sesión con Baileys
      console.log("1. Creando sesión con Baileys...");
      const baileysSession =
        await WhatsAppProvidersExample.createBaileysSession();
      console.log("✅ Sesión Baileys creada:", baileysSession);

      // Ejemplo 2: Múltiples sesiones
      console.log("\n2. Gestionando múltiples sesiones...");
      const multipleSessions =
        await WhatsAppProvidersExample.manageMultipleSessions();
      console.log("✅ Múltiples sesiones creadas:", multipleSessions);

      // Ejemplo 3: Limpiar sesiones
      console.log("\n3. Limpiando sesiones...");
      await WhatsAppProvidersExample.cleanupSessions([
        baileysSession,
        ...multipleSessions,
      ]);
      console.log("✅ Sesiones limpiadas");

      console.log("\n=== Ejemplo completado exitosamente ===");
    } catch (error) {
      console.error("Error en el ejemplo:", error);
    }
  }

  runExample();
}
