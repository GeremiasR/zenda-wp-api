import { Boom } from "@hapi/boom";
import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  WASocket,
  WAMessage,
  AuthenticationState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { initAuthCreds } from "@whiskeysockets/baileys/lib/Utils/auth-utils";
import pino from "pino";
import {
  IWhatsAppProvider,
  IWhatsAppMessage,
  IConnectionStatus,
  IWhatsAppProviderConfig,
} from "../../interfaces/whatsapp-provider.interface";
import WhatsAppSession from "../../../../models/whatsapp-session.model";
import { useMongoSignalKeyStore } from "./mongo-signal-key-store";

export class BaileysMultitenantProvider implements IWhatsAppProvider {
  public readonly providerName = "Baileys Multitenant";
  public readonly providerId = "baileys_multitenant";

  private sock: WASocket | null = null;
  private connected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private credentialsErrorAttempts: number = 0; // Contador específico para errores 405
  private maxCredentialsErrorAttempts: number = 3; // Máximo de intentos para errores 405
  private config: IWhatsAppProviderConfig;
  private shopId: string;

  // Callbacks para eventos
  private messageCallback?: (message: IWhatsAppMessage) => Promise<void>;
  private connectionCallback?: (status: IConnectionStatus) => void;
  private qrCallback?: (qr: string) => void;

  constructor(config: IWhatsAppProviderConfig, shopId: string) {
    this.config = config;
    this.shopId = shopId;
  }

  private forceNewSession: boolean = false;
  private phoneNumber?: string; // Número de teléfono una vez autenticado

  public async connect(): Promise<void> {
    if (this.isConnecting || this.connected) {
      return;
    }

    this.isConnecting = true;

    try {
      // Si se fuerza una nueva sesión, limpiar documento en MongoDB
      if (this.forceNewSession) {
        console.log(
          `🧹 Forzando nueva sesión para shop ${this.shopId}. Limpiando documento en MongoDB...`
        );
        await WhatsAppSession.findOneAndUpdate(
          { shopId: this.shopId, provider: "baileys" },
          { $unset: { data: "", number: "" } },
          { upsert: false }
        ).catch(() => {});
        this.forceNewSession = false;
        this.phoneNumber = undefined;
      }

      // Obtener sesión desde MongoDB
      const session = await WhatsAppSession.findOne({
        $or: [
          { shopId: this.shopId },
          ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
        ],
        provider: "baileys",
      });

      console.log(`🔍 Intentando conectar Baileys para shop ${this.shopId}`);
      console.log(`📋 Sesión encontrada en MongoDB:`, !!session);
      console.log(`📋 authState encontrado:`, !!session?.data);

      // Obtener authState desde MongoDB si existe
      let authState: AuthenticationState;
      let existingCreds = null;

      if (session?.data) {
        // Hay sesión con authState guardado = restaurar sesión existente
        const restoredAuthState = session.getAuthState();
        if (restoredAuthState && restoredAuthState.creds) {
          existingCreds = restoredAuthState.creds;
          this.phoneNumber = session.number || existingCreds.me?.id;

          console.log(
            `♻️ Restaurando sesión existente para shop ${this.shopId}...`
          );
          console.log(`📱 Número encontrado: ${this.phoneNumber || "N/A"}`);
        }
      }

      // Crear SignalKeyStore personalizado que guarda en MongoDB
      const keys = useMongoSignalKeyStore(this.shopId, this.phoneNumber);

      if (!existingCreds) {
        // No hay credenciales guardadas = sesión nueva
        console.log(
          `🆕 Sesión nueva para shop ${this.shopId}. Creando credenciales nuevas...`
        );
        const newCreds = initAuthCreds();
        authState = { creds: newCreds, keys };

        console.log(
          `✅ Credenciales nuevas inicializadas. Baileys generará un QR para escanear.`
        );
        console.log(
          `ℹ️ Las credenciales se guardarán automáticamente cuando Baileys las actualice (después de escanear QR).`
        );
      } else {
        // Hay credenciales guardadas = restaurar sesión existente
        authState = { creds: existingCreds, keys };

        // Restaurar auxKeys si existen en el authState guardado
        const restoredAuthState = session!.getAuthState();
        if (restoredAuthState && (restoredAuthState as any).auxKeys) {
          (authState as any).auxKeys = (restoredAuthState as any).auxKeys;
        }
      }

      // Obtener la versión más reciente de Baileys (importante para que funcione correctamente)
      const { version } = await fetchLatestBaileysVersion();
      console.log(
        `📦 Versión de Baileys para shop ${this.shopId}: ${version.join(".")}`
      );

      this.sock = makeWASocket({
        auth: authState,
        version, // Usar la versión más reciente de Baileys
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Zenda WhatsApp Bot", "Chrome", "1.0.0"],
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false, // No marcar como online automáticamente
        syncFullHistory: false, // No sincronizar historial completo
        shouldSyncHistoryMessage: () => false, // No sincronizar mensajes del historial
      });

      this.setupEventHandlers();
    } catch (error) {
      this.isConnecting = false;
      console.error(
        `Error al conectar con WhatsApp Baileys para shop ${this.shopId}:`,
        error
      );
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.sock) return;

    // Manejar actualización de credenciales
    // El evento creds.update emite Partial<AuthenticationCreds>
    // Esto incluye actualizaciones como { me: {...} }, { registered: true }, etc.
    // IMPORTANTE: Necesitamos mergear con las credenciales existentes y guardar el authState completo
    this.sock.ev.on("creds.update", async (update) => {
      try {
        // Obtener sesión desde MongoDB
        const session = await WhatsAppSession.findOne({
          $or: [
            { shopId: this.shopId },
            ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
          ],
          provider: "baileys",
        });

        if (!session) {
          console.warn(
            `⚠️ No se encontró sesión en MongoDB para shop ${this.shopId} al actualizar credenciales`
          );
          return;
        }

        // Obtener authState existente
        let existingAuthState = session.getAuthState();

        if (!existingAuthState || !existingAuthState.creds) {
          // Si no hay authState, crear uno nuevo con creds iniciales
          const newCreds = initAuthCreds();
          // Crear authState inicial con auxKeys vacío
          existingAuthState = {
            creds: newCreds,
            keys: {} as any, // No guardar el SignalKeyStore, solo auxKeys
          };
          // Inicializar auxKeys vacío
          (existingAuthState as any).auxKeys = {};
        }

        // Preservar auxKeys existentes (las keys criptográficas)
        const existingAuxKeys = (existingAuthState as any).auxKeys || {};

        // Mergear las actualizaciones con las credenciales existentes
        const mergedCreds = { ...existingAuthState.creds, ...update };

        // Actualizar phoneNumber si creds.me.id existe
        if (mergedCreds.me?.id) {
          this.phoneNumber = mergedCreds.me.id;
        }

        // Crear nuevo authState con creds actualizadas y auxKeys preservados
        const updatedAuthState: any = {
          creds: mergedCreds,
          auxKeys: existingAuxKeys, // Preservar las keys existentes
        };

        // Guardar el authState completo en MongoDB
        await session.saveAuthState(updatedAuthState);

        console.log(`💾 Credenciales actualizadas para shop ${this.shopId}`);

        // Actualizar number en el documento si existe creds.me.id
        if (mergedCreds.me?.id) {
          await WhatsAppSession.findOneAndUpdate(
            { _id: session._id },
            { number: mergedCreds.me.id },
            { upsert: false }
          ).catch(() => {});
        }
      } catch (error) {
        console.error(
          `Error al guardar credenciales para shop ${this.shopId}:`,
          error
        );
      }
    });

    // Manejar actualizaciones de conexión
    this.sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(
        `📡 Evento connection.update para shop ${
          this.shopId
        }: connection=${connection}, qr=${!!qr}`
      );

      // PRIMERO: Manejar QR generado (esto es lo más importante y debe manejarse ANTES que el error)
      // El QR puede venir incluso cuando connection === "close" con error 405
      if (qr) {
        console.log(
          `📱 QR generado para shop ${this.shopId}. Mostrando QR para escanear...`
        );

        // QR no se guarda en MongoDB (duración de 1 minuto, solo en memoria/callbacks)

        // Cuando se genera QR, todavía no hay credenciales guardadas
        // Pero esto es normal en una sesión nueva
        this.isConnecting = true;
        this.connected = false;

        // Callback para QR
        if (this.qrCallback) {
          this.qrCallback(qr);
        }

        // Callback de conexión indicando que está esperando QR
        if (this.connectionCallback) {
          this.connectionCallback({
            isConnected: false,
            isConnecting: true,
            qrCode: qr,
          });
        }

        // Si hay QR, NO procesar el error 405 que pueda venir después
        // El QR es la solución, el error 405 es solo parte del proceso
        console.log(
          `✅ QR generado para shop ${this.shopId}. Esperando a que el usuario escanee...`
        );
        return; // Salir temprano cuando hay QR
      }

      // SEGUNDO: Manejar estado "connecting" - cuando Baileys está intentando conectar
      if (connection === "connecting") {
        console.log(`🔄 Conectando Baileys para shop ${this.shopId}...`);
        this.isConnecting = true;

        if (this.connectionCallback) {
          this.connectionCallback({
            isConnected: false,
            isConnecting: true,
          });
        }
        return;
      }

      // Manejar conexión cerrada
      if (connection === "close") {
        const error = lastDisconnect?.error as Boom;
        const statusCode = error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || "";
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        // Error 405: Method Not Allowed - Credenciales inválidas o sesión expirada
        const isCredentialsInvalid = statusCode === 405;

        // Detectar errores de stream que requieren restart
        const isStreamError =
          errorMessage.includes("Stream Errored") ||
          errorMessage.includes("restart required");

        this.connected = false;
        this.isConnecting = false;

        if (this.connectionCallback) {
          this.connectionCallback({
            isConnected: false,
            isConnecting: false,
            lastError: errorMessage,
          });
        }

        // Si hay error de stream, limpiar authState en MongoDB
        if (isStreamError) {
          console.warn(
            `⚠️ Stream error detectado para shop ${this.shopId}: ${errorMessage}`
          );

          // Limpiar authState corrupto en MongoDB
          try {
            await WhatsAppSession.findOneAndUpdate(
              {
                $or: [
                  { shopId: this.shopId },
                  ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
                ],
                provider: "baileys",
              },
              { $unset: { data: "" } },
              { upsert: false }
            );

            console.log(
              `✅ authState limpiado en MongoDB para shop ${this.shopId}`
            );

            // NO reconectar automáticamente si hay keys corruptas
            console.log(
              `⚠️ No se reconectará automáticamente debido a keys corruptas.`
            );
            console.log(
              `💡 Por favor, desactiva y reactiva la sesión de WhatsApp para este shop.`
            );

            this.connected = false;
            this.isConnecting = false;
            if (this.sock) {
              try {
                this.sock.end(undefined);
              } catch (e) {
                // Ignorar errores al cerrar
              }
              this.sock = null;
            }

            return; // NO reconectar
          } catch (checkError) {
            console.error(
              `Error al limpiar authState para shop ${this.shopId}:`,
              checkError
            );
            // Si hay error al limpiar, no reconectar automáticamente
            return;
          }
        }

        // Si las credenciales son inválidas (405), manejar según si es primera conexión o reconexión
        if (isCredentialsInvalid) {
          // Verificar si hay sesión con authState guardado en MongoDB
          const session = await WhatsAppSession.findOne({
            $or: [
              { shopId: this.shopId },
              ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
            ],
            provider: "baileys",
          });

          const hasStoredCredentials = !!session?.data;

          // Si NO hay credenciales guardadas, es una sesión nueva y el error 405 es NORMAL
          // Pero espera... si no hay credenciales guardadas aquí, significa que algo falló
          // Las credenciales iniciales deberían haberse guardado en el método connect()
          if (!hasStoredCredentials) {
            console.log(
              `⚠️ Sesión nueva para shop ${this.shopId}. Error 405 es normal sin credenciales.`
            );
            console.log(
              `🔄 Las credenciales iniciales deberían haberse guardado. Reconectando para generar QR...`
            );

            // Cerrar el socket actual
            if (this.sock) {
              try {
                this.sock.end(undefined);
              } catch (e) {
                // Ignorar errores al cerrar
              }
              this.sock = null;
            }

            // Mantener isConnecting en true para indicar que está esperando QR
            this.isConnecting = true;
            this.connected = false;

            if (this.connectionCallback) {
              this.connectionCallback({
                isConnected: false,
                isConnecting: true, // Aún está intentando conectar (esperando QR)
                lastError: undefined,
              });
            }

            // Reconectar después de un pequeño delay
            // Esta vez las credenciales iniciales deberían estar guardadas y Baileys generará el QR
            console.log(
              `⏳ Esperando 3 segundos antes de reconectar para generar QR...`
            );
            setTimeout(async () => {
              try {
                // Resetear isConnecting para permitir reconexión
                this.isConnecting = false;
                console.log(
                  `🔄 Reconectando para shop ${this.shopId} para generar QR...`
                );
                await this.connect();
              } catch (error) {
                console.error(
                  `❌ Error al reconectar para shop ${this.shopId}:`,
                  error
                );
                this.isConnecting = false;
                if (this.connectionCallback) {
                  this.connectionCallback({
                    isConnected: false,
                    isConnecting: false,
                    lastError:
                      error instanceof Error ? error.message : String(error),
                  });
                }
              }
            }, 3000); // Esperar 3 segundos antes de reconectar (más tiempo para que Baileys procese)

            return;
          }

          // Si SÍ hay credenciales guardadas y hay error 405, son credenciales inválidas
          console.log(
            `⚠️ Credenciales guardadas son inválidas para shop ${this.shopId} (error 405).`
          );

          this.credentialsErrorAttempts++;

          console.log(
            `⚠️ Credenciales inválidas para shop ${this.shopId} (error 405). Intento ${this.credentialsErrorAttempts}/${this.maxCredentialsErrorAttempts}`
          );

          // Si ya se intentó demasiadas veces, detener el bucle
          if (
            this.credentialsErrorAttempts >= this.maxCredentialsErrorAttempts
          ) {
            console.log(
              `❌ Se agotaron los intentos para shop ${this.shopId} (error 405). Deteniendo reconexiones automáticas.`
            );
            console.log(
              `💡 Por favor, desactiva y reactiva manualmente la sesión de WhatsApp para este shop.`
            );

            // Cerrar el socket
            if (this.sock) {
              try {
                this.sock.end(undefined);
              } catch (e) {
                // Ignorar errores al cerrar
              }
              this.sock = null;
            }

            // Limpiar authState en MongoDB
            await WhatsAppSession.findOneAndUpdate(
              {
                $or: [
                  { shopId: this.shopId },
                  ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
                ],
                provider: "baileys",
              },
              { $unset: { data: "", number: "" }, isConnected: false },
              { upsert: false }
            ).catch(console.error);

            this.connected = false;
            this.isConnecting = false;

            return; // No intentar reconectar más
          }

          // Cerrar el socket actual primero
          if (this.sock) {
            try {
              this.sock.end(undefined);
            } catch (e) {
              // Ignorar errores al cerrar
            }
            this.sock = null;
          }

          // Limpiar authState inválido de MongoDB completamente
          try {
            await WhatsAppSession.findOneAndUpdate(
              {
                $or: [
                  { shopId: this.shopId },
                  ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
                ],
                provider: "baileys",
              },
              { $unset: { data: "", number: "" }, isConnected: false },
              { upsert: false }
            );
            console.log(`✅ Sesión limpiada para shop ${this.shopId}`);
          } catch (error) {
            console.error(
              `❌ Error al limpiar sesión para shop ${this.shopId}:`,
              error
            );
          }

          // Marcar que necesitamos una nueva sesión
          this.forceNewSession = true;

          // Reiniciar contador de intentos normales
          this.reconnectAttempts = 0;

          // Resetear estado de conexión
          this.connected = false;
          this.isConnecting = false;

          // Calcular tiempo de espera exponencial: 10s, 20s, 30s
          const waitTime = 10000 * this.credentialsErrorAttempts;

          console.log(
            `🔄 Esperando ${
              waitTime / 1000
            }s antes de intentar nuevamente para shop ${this.shopId}...`
          );
          console.log(
            `💡 Si el problema persiste, desactiva y reactiva manualmente la sesión.`
          );

          // Esperar tiempo exponencial antes de reconectar para evitar bucle infinito
          setTimeout(async () => {
            // Verificar que el authState fue eliminado
            const session = await WhatsAppSession.findOne({
              $or: [
                { shopId: this.shopId },
                ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
              ],
              provider: "baileys",
            });

            if (session?.data) {
              console.log(`⚠️ El authState aún existe. Forzando limpieza...`);
              await WhatsAppSession.findOneAndUpdate(
                { _id: session._id },
                { $unset: { data: "", number: "" }, isConnected: false },
                { upsert: false }
              ).catch(() => {});
            }

            // Ahora intentar conectar con credenciales completamente nuevas
            this.isConnecting = false; // Permitir nueva conexión
            this.connect();
          }, waitTime); // Esperar tiempo exponencial

          return;
        }

        // Para otros errores, reconectar solo si no fue logout
        // Verificar si el error es por keys corruptas (error relacionado con SignalKeyStore)
        const isKeyStoreError =
          lastDisconnect?.error?.message?.includes("public") ||
          lastDisconnect?.error?.message?.includes("undefined") ||
          lastDisconnect?.error?.message?.includes("Cannot read");

        if (isKeyStoreError) {
          console.error(
            `❌ Error de SignalKeyStore detectado para shop ${this.shopId}:`,
            lastDisconnect?.error?.message
          );
          console.log(
            `🧹 Limpiando authState corrupto para shop ${this.shopId}...`
          );

          // Limpiar authState corrupto en MongoDB
          try {
            await WhatsAppSession.findOneAndUpdate(
              {
                $or: [
                  { shopId: this.shopId },
                  ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
                ],
                provider: "baileys",
              },
              { $unset: { data: "" } },
              { upsert: false }
            );
            console.log(
              `✅ authState corrupto eliminado para shop ${this.shopId}`
            );
          } catch (error) {
            console.error(
              `Error al limpiar authState corrupto para shop ${this.shopId}:`,
              error
            );
          }

          // NO reconectar automáticamente si hay keys corruptas
          // El usuario debe reactivar la sesión manualmente
          console.log(
            `⚠️ No se reconectará automáticamente debido a keys corruptas.`
          );
          console.log(
            `💡 Por favor, desactiva y reactiva la sesión de WhatsApp para este shop.`
          );

          this.connected = false;
          this.isConnecting = false;
          if (this.sock) {
            try {
              this.sock.end(undefined);
            } catch (e) {
              // Ignorar errores al cerrar
            }
            this.sock = null;
          }

          return; // NO reconectar
        }

        // Lógica de reconexión simplificada (similar al test que funcionó)
        const shouldReconnect = !isLoggedOut;

        if (
          shouldReconnect &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          console.log(
            `🔄 Reconectando Baileys para shop ${this.shopId} (intento ${
              this.reconnectAttempts + 1
            }/${this.maxReconnectAttempts})...`
          );
          this.reconnectAttempts++;

          // Cerrar el socket actual primero (como en el test)
          if (this.sock) {
            try {
              this.sock.end(undefined);
            } catch (e) {
              // Ignorar errores al cerrar
            }
            this.sock = null;
          }

          // Reconectar después de un delay (como en el test)
          setTimeout(async () => {
            try {
              this.isConnecting = false; // Permitir reconexión
              await this.connect();
            } catch (error) {
              console.error(
                `❌ Error al reconectar para shop ${this.shopId}:`,
                error
              );
              this.isConnecting = false;
              if (this.connectionCallback) {
                this.connectionCallback({
                  isConnected: false,
                  isConnecting: false,
                  lastError:
                    error instanceof Error ? error.message : String(error),
                });
              }
            }
          }, 5000); // 5 segundos de delay (como en el test)
        } else if (isLoggedOut) {
          console.log(
            `⚠️ Usuario se deslogueó de la sesión para shop ${this.shopId}. Escanea el QR nuevamente.`
          );
          this.reconnectAttempts = 0; // Resetear contador cuando hay logout
        } else {
          console.log(
            `❌ Se agotaron los intentos de reconexión (${this.maxReconnectAttempts}) para shop ${this.shopId}. Conexión cerrada permanentemente.`
          );

          // Si se agotaron los intentos, limpiar authState en MongoDB
          console.log(
            `🧹 Limpiando sesión para shop ${this.shopId} después de ${this.maxReconnectAttempts} intentos fallidos`
          );
          await WhatsAppSession.findOneAndUpdate(
            {
              $or: [
                { shopId: this.shopId },
                ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
              ],
              provider: "baileys",
            },
            { $unset: { data: "", number: "" }, isConnected: false },
            { upsert: false }
          ).catch(console.error);
        }
      } else if (connection === "open") {
        console.log(
          `✅ Conectado exitosamente a WhatsApp con Baileys para shop ${this.shopId}`
        );
        this.connected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.credentialsErrorAttempts = 0; // Resetear contador de errores 405 cuando se conecta exitosamente

        if (this.connectionCallback) {
          this.connectionCallback({
            isConnected: true,
            isConnecting: false,
          });
        }

        // Las keys se guardan automáticamente por el SignalKeyStore personalizado
        // No necesitamos guardarlas manualmente aquí

        // Guardar estado de sesión activa en MongoDB
        const phoneNumber = this.sock?.user?.id || "";
        const normalizedPhoneNumber = this.normalizePhoneNumber(phoneNumber);

        this.phoneNumber = normalizedPhoneNumber;

        console.log(
          `📱 Número de teléfono detectado para shop ${this.shopId}: ${normalizedPhoneNumber}`
        );

        // Actualizar sesión en MongoDB con estado conectado
        await WhatsAppSession.findOneAndUpdate(
          {
            $or: [
              { shopId: this.shopId },
              ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
            ],
            provider: "baileys",
          },
          {
            isConnected: true,
            number: normalizedPhoneNumber,
            phoneNumber: normalizedPhoneNumber,
            lastSeen: new Date(),
          },
          { upsert: true }
        ).catch(console.error);
      }
    });

    // Manejar mensajes entrantes
    this.sock.ev.on("messages.upsert", async (m) => {
      const msg = m.messages[0];
      if (!msg.key.fromMe && m.type === "notify" && this.messageCallback) {
        const normalizedMessage = this.normalizeMessage(msg);
        await this.messageCallback(normalizedMessage);
      }
    });

    // NOTA: El handler de connection.update ya está manejado arriba
    // Este handler duplicado fue removido para evitar conflictos
  }

  private normalizeMessage(msg: WAMessage): IWhatsAppMessage {
    const messageText =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    const fromNumber = this.normalizePhoneNumber(
      msg.key.remoteJid || undefined
    );
    const toNumber = this.normalizePhoneNumber(this.sock?.user?.id || "");
    const isGroup = msg.key.remoteJid?.includes("@g.us") || false;

    return {
      id: msg.key.id || "",
      from: fromNumber,
      to: toNumber,
      text: messageText,
      timestamp: new Date(
        msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now()
      ),
      isGroup,
      groupId: isGroup ? msg.key.remoteJid || undefined : undefined,
      rawMessage: msg,
    };
  }

  private normalizePhoneNumber(jid?: string): string {
    if (!jid) return "";
    let normalized = jid.split("@")[0];
    normalized = normalized.split(":")[0];
    normalized = normalized.split(".")[0];
    return normalized;
  }

  public async disconnect(): Promise<void> {
    if (this.sock) {
      try {
        await this.sock.logout();
        this.sock = null;
        this.connected = false;
        this.isConnecting = false;

        // Limpiar authState de MongoDB (mantener documento, solo limpiar data)
        await WhatsAppSession.findOneAndUpdate(
          {
            $or: [
              { shopId: this.shopId },
              ...(this.phoneNumber ? [{ number: this.phoneNumber }] : []),
            ],
            provider: "baileys",
          },
          { $unset: { data: "" }, isConnected: false },
          { upsert: false }
        ).catch(() => {});

        console.log(
          `Desconectado de WhatsApp Baileys para shop ${this.shopId}`
        );
      } catch (error) {
        console.error(
          `Error al desconectar de WhatsApp Baileys para shop ${this.shopId}:`,
          error
        );
        throw error;
      }
    }
  }

  public isConnected(): boolean {
    return this.connected && this.sock !== null;
  }

  public async getConnectionStatus(): Promise<{
    isConnected: boolean;
    jid?: string;
    provider: string;
  }> {
    if (!this.sock || !this.connected) {
      return {
        isConnected: false,
        provider: this.providerName,
      };
    }

    return {
      isConnected: true,
      jid: this.sock.user?.id,
      provider: this.providerName,
    };
  }

  public async sendMessage(jid: string, message: string): Promise<void> {
    if (!this.sock || !this.connected) {
      throw new Error(
        `WhatsApp Baileys no está conectado para shop ${this.shopId}`
      );
    }

    try {
      await this.sock.sendMessage(jid, { text: message });
      console.log(
        `Mensaje enviado via Baileys a ${jid} desde shop ${this.shopId}: ${message}`
      );
    } catch (error) {
      console.error(
        `Error al enviar mensaje via Baileys para shop ${this.shopId}:`,
        error
      );
      throw error;
    }
  }

  public async sendMessageToGroup(
    groupJid: string,
    message: string
  ): Promise<void> {
    if (!this.sock || !this.connected) {
      throw new Error(
        `WhatsApp Baileys no está conectado para shop ${this.shopId}`
      );
    }

    try {
      await this.sock.sendMessage(groupJid, { text: message });
      console.log(
        `Mensaje enviado via Baileys al grupo ${groupJid} desde shop ${this.shopId}: ${message}`
      );
    } catch (error) {
      console.error(
        `Error al enviar mensaje al grupo via Baileys para shop ${this.shopId}:`,
        error
      );
      throw error;
    }
  }

  public onMessage(
    callback: (message: IWhatsAppMessage) => Promise<void>
  ): void {
    this.messageCallback = callback;
  }

  public onConnectionUpdate(
    callback: (status: IConnectionStatus) => void
  ): void {
    this.connectionCallback = callback;
  }

  public onQRCode(callback: (qr: string) => void): void {
    this.qrCallback = callback;
  }

  // QR codes no se almacenan (duración de 1 minuto, solo en memoria/callbacks)
  // Este método queda obsoleto, pero se mantiene para compatibilidad
  public async getQRCode(): Promise<string | null> {
    // QR no se guarda, solo se emite via callbacks
    return null;
  }
}
