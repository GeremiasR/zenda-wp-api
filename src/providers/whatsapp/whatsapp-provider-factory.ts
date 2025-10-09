import {
  IWhatsAppProvider,
  IWhatsAppProviderConfig,
  WhatsAppProviderType,
} from "./interfaces/whatsapp-provider.interface";
import { BaileysProvider } from "./providers/baileys";
import { CloudAPIProvider } from "./providers/cloud-api";
import { TwilioProvider } from "./providers/twilio";

export class WhatsAppProviderFactory {
  private static providers: Map<string, IWhatsAppProvider> = new Map();

  /**
   * Crea una instancia del proveedor especificado
   */
  public static createProvider(
    config: IWhatsAppProviderConfig
  ): IWhatsAppProvider {
    const key = `${config.sessionId}_${config.provider}`;

    // Si ya existe una instancia para esta sesión, la retornamos
    if (this.providers.has(key)) {
      return this.providers.get(key)!;
    }

    let provider: IWhatsAppProvider;

    switch (config.provider) {
      case WhatsAppProviderType.BAILEYS:
        provider = new BaileysProvider(config);
        break;
      case WhatsAppProviderType.CLOUD_API:
        provider = new CloudAPIProvider(config);
        break;
      case WhatsAppProviderType.TWILIO:
        provider = new TwilioProvider(config);
        break;
      default:
        throw new Error(
          `Proveedor de WhatsApp no soportado: ${config.provider}`
        );
    }

    // Guardar la instancia para reutilización
    this.providers.set(key, provider);
    return provider;
  }

  /**
   * Obtiene un proveedor existente por sessionId y provider
   */
  public static getProvider(
    sessionId: string,
    provider: string
  ): IWhatsAppProvider | undefined {
    const key = `${sessionId}_${provider}`;
    return this.providers.get(key);
  }

  /**
   * Obtiene todos los proveedores activos
   */
  public static getAllProviders(): IWhatsAppProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Obtiene proveedores por tipo
   */
  public static getProvidersByType(
    providerType: WhatsAppProviderType
  ): IWhatsAppProvider[] {
    return Array.from(this.providers.values()).filter(
      (provider) => provider.providerId === providerType
    );
  }

  /**
   * Elimina un proveedor específico
   */
  public static removeProvider(sessionId: string, provider: string): boolean {
    const key = `${sessionId}_${provider}`;
    return this.providers.delete(key);
  }

  /**
   * Elimina todos los proveedores
   */
  public static clearAllProviders(): void {
    this.providers.clear();
  }

  /**
   * Obtiene la lista de proveedores soportados
   */
  public static getSupportedProviders(): string[] {
    return Object.values(WhatsAppProviderType);
  }
}
