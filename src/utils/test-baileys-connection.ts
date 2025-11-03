import makeWASocket, {
  useMultiFileAuthState,
  WASocket,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";
import qrcode from "qrcode-terminal";

let testSocket: WASocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

/**
 * Función recursiva para crear y reconectar el cliente de prueba
 */
async function createTestWhatsAppClient(): Promise<void> {
  try {
    console.log("🧪 Iniciando prueba de conexión Baileys con guardado en archivos...");

    const authFolder = path.join(process.cwd(), "auth", "test-session");
    
    // Asegurar que la carpeta existe
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
      console.log(`📁 Carpeta de autenticación creada: ${authFolder}`);
    }

    // Usar useMultiFileAuthState para guardar credenciales en archivos
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    console.log("✅ Estado de autenticación cargado desde archivos");

    // Crear socket de prueba
    testSocket = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: "silent" }),
      browser: ["Zenda WhatsApp Bot Test", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: true,
    });

    // Guardar credenciales cuando se actualicen
    testSocket.ev.on("creds.update", saveCreds);

    // Manejar actualizaciones de conexión con lógica de reconexión automática
    testSocket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📱 QR generado para sesión de prueba:");
        qrcode.generate(qr, { small: true });
        console.log("✅ QR mostrado en terminal. Escanea con WhatsApp.");
      }

      if (connection === "close") {
        const error = lastDisconnect?.error as Boom;
        const statusCode = error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const shouldReconnect = !isLoggedOut;

        if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
          console.log(
            `🔄 Intentando reconectar sesión de prueba (intento ${reconnectAttempts + 1}/${maxReconnectAttempts})...`
          );
          reconnectAttempts++;
          
          // Cerrar el socket actual
          if (testSocket) {
            try {
              testSocket.end(undefined);
            } catch (e) {
              // Ignorar errores al cerrar
            }
            testSocket = null;
          }

          // Reconectar después de un delay
          setTimeout(() => {
            createTestWhatsAppClient().catch((error) => {
              console.error("❌ Error al reconectar sesión de prueba:", error);
            });
          }, 5000);
        } else if (isLoggedOut) {
          console.log(
            "⚠️ Usuario se deslogueó de la sesión de prueba. Escanea el QR nuevamente."
          );
          reconnectAttempts = 0;
        } else {
          console.log(
            `❌ Se agotaron los intentos de reconexión (${maxReconnectAttempts}). Sesión de prueba detenida.`
          );
        }
      } else if (connection === "open") {
        console.log("✅ Conectado exitosamente a WhatsApp (sesión de prueba)");
        console.log(`📱 Número: ${testSocket?.user?.id || "N/A"}`);
        reconnectAttempts = 0; // Resetear contador al conectar exitosamente
      }
    });

    // Esperar un poco para que se genere el QR
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("✅ Prueba de conexión Baileys iniciada");
    console.log("💡 Las credenciales se guardarán en:", authFolder);
  } catch (error) {
    console.error("❌ Error en prueba de conexión Baileys:", error);
  }
}

/**
 * Función principal para iniciar la prueba de conexión Baileys
 * Usa guardado en archivos directamente (como se hace habitualmente)
 */
export async function testBaileysConnection(): Promise<void> {
  await createTestWhatsAppClient();
}

