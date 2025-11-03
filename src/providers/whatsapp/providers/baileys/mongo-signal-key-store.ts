import type {
  SignalDataTypeMap,
  SignalKeyStore,
} from "@whiskeysockets/baileys/lib/Types/Auth";
import WhatsAppSession from "../../../../models/whatsapp-session.model";
import { AuthenticationState } from "@whiskeysockets/baileys";

/**
 * SignalKeyStore personalizado que guarda las keys en MongoDB
 * Las keys se almacenan dentro del campo `data` (authState completo) del documento de sesión
 */
export function useMongoSignalKeyStore(
  shopId: string,
  phoneNumber?: string
): SignalKeyStore {
  /**
   * Obtiene el documento de sesión desde MongoDB
   */
  const getSessionDoc = async () => {
    // Si hay phoneNumber, buscar por number (sesión autenticada)
    if (phoneNumber) {
      const session = await WhatsAppSession.findOne({
        $or: [{ number: phoneNumber }, { shopId }],
        provider: "baileys",
      });
      return session;
    }
    // Si no, buscar por shopId (sesión nueva sin autenticar)
    const session = await WhatsAppSession.findOne({
      shopId,
      provider: "baileys",
    });
    return session;
  };

  /**
   * Obtiene el authState desde MongoDB
   */
  const getAuthState = async (): Promise<AuthenticationState | null> => {
    const session = await getSessionDoc();
    if (!session || !session.data) {
      return null;
    }

    try {
      const authState = session.getAuthState();
      return authState;
    } catch (error) {
      console.error(`Error al obtener authState para shop ${shopId}:`, error);
      return null;
    }
  };

  /**
   * Guarda el authState en MongoDB
   */
  const saveAuthState = async (authState: AuthenticationState): Promise<void> => {
    let session = await getSessionDoc();
    
    // Si no hay sesión, crear una nueva
    if (!session) {
      const sessionId = `shop_${shopId}`;
      const phoneNumberField = phoneNumber || `shop_${shopId}_phone`;
      
      session = await WhatsAppSession.findOneAndUpdate(
        { shopId, provider: "baileys" },
        {
          sessionId,
          phoneNumber: phoneNumberField,
          provider: "baileys",
          shopId,
          isConnected: false,
        },
        { upsert: true, new: true }
      );
      
      if (!session) {
        throw new Error(
          `No se pudo crear sesión en MongoDB para shop ${shopId}`
        );
      }
    }

    try {
      await session.saveAuthState(authState);
    } catch (error) {
      console.error(`Error al guardar authState para shop ${shopId}:`, error);
      throw error;
    }
  };

  return {
    async get<T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[]
    ): Promise<{ [id: string]: SignalDataTypeMap[T] }> {
      const data: { [id: string]: SignalDataTypeMap[T] } = {};

      try {
        const authState = await getAuthState();
        if (!authState || !authState.keys) {
          // No hay keys guardadas, devolver objeto vacío
          // Baileys generará las keys necesarias
          return data;
        }

        // Las keys se almacenan dentro de authState.keys
        // Necesitamos extraer las keys del tipo solicitado
        // Nota: Baileys usa una estructura específica para las keys en el SignalKeyStore
        // pero el authState.keys es un objeto que contiene funciones get/set
        // Necesitamos acceder a las keys directamente

        // Por ahora, vamos a implementar una versión que guarda las keys
        // en una estructura plana dentro del authState
        // Esto requiere que modifiquemos cómo guardamos las keys

        // Estrategia: Guardar las keys como parte del authState en una estructura separada
        // que podamos acceder fácilmente
        // authState = { creds: {...}, keys: {...} }
        // Donde keys es un objeto con la estructura: { type: { id: value } }

        // Como Baileys no expone las keys directamente en authState,
        // necesitamos mantener un objeto auxiliar con las keys
        // y guardarlo dentro del authState

        // Para esto, vamos a guardar las keys en authState.auxKeys
        // que es una propiedad personalizada que agregamos

        const auxKeys = (authState as any).auxKeys || {};

        if (!auxKeys[type]) {
          return data;
        }

        const typeKeys = auxKeys[type] || {};

        for (const id of ids) {
          const keyData = typeKeys[id];
          if (!keyData) {
            continue;
          }

          try {
            // Deserializar según el tipo
            if (type === "pre-key") {
              // KeyPair: { public: Uint8Array, private: Uint8Array }
              const keyPair: any = {};

              if (keyData.public && Array.isArray(keyData.public)) {
                keyPair.public = new Uint8Array(keyData.public);
              } else if (keyData.public instanceof Uint8Array) {
                keyPair.public = keyData.public;
              }

              if (keyData.private && Array.isArray(keyData.private)) {
                keyPair.private = new Uint8Array(keyData.private);
              } else if (keyData.private instanceof Uint8Array) {
                keyPair.private = keyData.private;
              }

              if (keyPair.public && keyPair.private) {
                data[id] = keyPair as SignalDataTypeMap[T];
              }
            } else if (
              type === "session" ||
              type === "sender-key" ||
              type === "app-state-sync-key"
            ) {
              // Uint8Array directo
              if (Array.isArray(keyData)) {
                data[id] = new Uint8Array(keyData) as SignalDataTypeMap[T];
              } else if (keyData instanceof Uint8Array) {
                data[id] = keyData as SignalDataTypeMap[T];
              }
            } else {
              // Otros tipos
              if (keyData !== null && keyData !== undefined) {
                data[id] = keyData as SignalDataTypeMap[T];
              }
            }
          } catch (error) {
            console.error(
              `Error al deserializar key ${type}:${id} para shop ${shopId}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(`Error al obtener keys para shop ${shopId}:`, error);
      }

      return data;
    },

    async set(
      data: Partial<Record<keyof SignalDataTypeMap, { [id: string]: any }>>
    ): Promise<void> {
      try {
        let authState = await getAuthState();
        
        // Si no hay authState, crear uno nuevo con creds vacías
        if (!authState) {
          const { initAuthCreds } = await import("@whiskeysockets/baileys/lib/Utils/auth-utils");
          const newCreds = initAuthCreds();
          authState = {
            creds: newCreds,
            keys: {} as any, // No se guarda el SignalKeyStore, solo auxKeys
          };
          // Inicializar auxKeys vacío
          (authState as any).auxKeys = {};
          
          // Guardar el authState inicial en MongoDB (solo creds y auxKeys)
          const serializableAuthState: any = {
            creds: newCreds,
            auxKeys: {},
          };
          await saveAuthState(serializableAuthState as AuthenticationState);
        }

        // Inicializar auxKeys si no existe
        if (!(authState as any).auxKeys) {
          (authState as any).auxKeys = {};
        }

        const auxKeys = (authState as any).auxKeys;

        // Guardar cada tipo de key
        for (const [type, entries] of Object.entries(data)) {
          if (!entries) continue;

          if (!auxKeys[type]) {
            auxKeys[type] = {};
          }

          const typeKeys = auxKeys[type];

          for (const [id, value] of Object.entries(entries)) {
            if (value === null) {
              // Eliminar la key
              delete typeKeys[id];
            } else {
              try {
                // Serializar según el tipo
                if (type === "pre-key" && value && typeof value === "object") {
                  // KeyPair: convertir Uint8Array a array
                  if (!value.public || !value.private) {
                    console.warn(
                      `⚠️ KeyPair incompleto para ${type}:${id}, omitiendo guardado`
                    );
                    continue;
                  }

                  const keyPair: any = {};
                  if (value.public instanceof Uint8Array) {
                    keyPair.public = Array.from(value.public);
                  } else {
                    keyPair.public = value.public;
                  }

                  if (value.private instanceof Uint8Array) {
                    keyPair.private = Array.from(value.private);
                  } else {
                    keyPair.private = value.private;
                  }

                  typeKeys[id] = keyPair;
                } else if (value instanceof Uint8Array) {
                  // Uint8Array directo: convertir a array
                  typeKeys[id] = Array.from(value);
                } else {
                  // Otros tipos: guardar directamente
                  typeKeys[id] = value;
                }
              } catch (error) {
                console.error(`Error al serializar key ${type}:${id}:`, error);
              }
            }
          }
        }

        // Guardar el authState actualizado en MongoDB (sin el SignalKeyStore)
        // Crear un objeto serializable solo con creds y auxKeys
        const serializableAuthState: any = {
          creds: authState.creds,
          auxKeys: (authState as any).auxKeys,
        };
        await saveAuthState(serializableAuthState as AuthenticationState);
      } catch (error) {
        console.error(`Error al guardar keys para shop ${shopId}:`, error);
        throw error;
      }
    },
  };
}
