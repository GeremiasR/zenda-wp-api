/**
 * Ejemplo de implementación en el Frontend (React/Next.js)
 * Este archivo muestra cómo integrar la API multitenant desde el Back Office
 */

// Tipos TypeScript para el frontend
interface ShopUser {
  id: string;
  shopId: string;
  isAdmin: boolean;
  email: string;
}

interface WhatsAppStatus {
  isActive: boolean;
  isConnected: boolean;
  qr?: string;
  phoneNumber?: string;
  lastConnection?: string;
}

interface ActivateResponse {
  success: boolean;
  message: string;
  data: {
    shopId: string;
    flowId: string;
    sessionId: string;
    qr?: string;
  };
}

// Clase para manejar la API de WhatsApp Multitenant
export class WhatsAppMultitenantAPI {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error en la petición");
    }

    return response.json();
  }

  /**
   * Activar WhatsApp para un shop con un flujo específico
   */
  async activateWhatsApp(shopId: string, flowId: string): Promise<ActivateResponse> {
    return this.request("/api/whatsapp-shop/activate", {
      method: "POST",
      body: JSON.stringify({ shopId, flowId }),
    });
  }

  /**
   * Obtener estado de WhatsApp de un shop
   */
  async getWhatsAppStatus(
    shopId: string
  ): Promise<{ success: boolean; data: WhatsAppStatus }> {
    return this.request(`/api/whatsapp-shop/${shopId}/status`);
  }

  /**
   * Obtener QR de un shop
   */
  async getQR(
    shopId: string
  ): Promise<{
    success: boolean;
    data: { qr?: string; isConnected: boolean };
  }> {
    return this.request(`/api/whatsapp-shop/${shopId}/qr`);
  }

  /**
   * Desactivar WhatsApp de un shop
   */
  async deactivateWhatsApp(
    shopId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/whatsapp-shop/${shopId}/deactivate`, {
      method: "POST",
    });
  }

  /**
   * Enviar mensaje desde un shop
   */
  async sendMessage(
    shopId: string,
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/api/whatsapp-shop/send", {
      method: "POST",
      body: JSON.stringify({
        shopId,
        jid: `${phoneNumber}@s.whatsapp.net`,
        message,
      }),
    });
  }

  /**
   * Enviar mensaje a grupo desde un shop
   */
  async sendGroupMessage(
    shopId: string,
    groupId: string,
    message: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/api/whatsapp-shop/send-group", {
      method: "POST",
      body: JSON.stringify({
        shopId,
        groupJid: `${groupId}@g.us`,
        message,
      }),
    });
  }
}

// Hook de React para manejar WhatsApp
export function useWhatsAppMultitenant(shopId: string, token: string) {
  const [status, setStatus] = React.useState<WhatsAppStatus>({
    isActive: false,
    isConnected: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const api = React.useMemo(() => {
    return new WhatsAppMultitenantAPI(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      token
    );
  }, [token]);

  // Función para activar WhatsApp
  const activate = React.useCallback(async (flowId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.activateWhatsApp(shopId, flowId);
      if (response.success) {
        setStatus((prev) => ({
          ...prev,
          isActive: true,
          qr: response.data.qr,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [api, shopId]);

  // Función para desactivar WhatsApp
  const deactivate = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await api.deactivateWhatsApp(shopId);
      setStatus({
        isActive: false,
        isConnected: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [api, shopId]);

  // Función para enviar mensaje
  const sendMessage = React.useCallback(
    async (phoneNumber: string, message: string) => {
      try {
        await api.sendMessage(shopId, phoneNumber, message);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al enviar mensaje"
        );
      }
    },
    [api, shopId]
  );

  // Función para enviar mensaje a grupo
  const sendGroupMessage = React.useCallback(
    async (groupId: string, message: string) => {
      try {
        await api.sendGroupMessage(shopId, groupId, message);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al enviar mensaje al grupo"
        );
      }
    },
    [api, shopId]
  );

  // Polling para verificar estado
  React.useEffect(() => {
    if (!status.isActive) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.getWhatsAppStatus(shopId);
        if (response.success) {
          setStatus(response.data);
        }
      } catch (err) {
        console.error("Error al verificar estado:", err);
      }
    }, 3000); // Cada 3 segundos

    return () => clearInterval(interval);
  }, [api, shopId, status.isActive]);

  return {
    status,
    loading,
    error,
    activate,
    deactivate,
    sendMessage,
    sendGroupMessage,
  };
}

// Componente React de ejemplo
export function WhatsAppActivationPanel({
  shopId,
  user,
  flowId,
}: {
  shopId: string;
  user: ShopUser;
  flowId: string;
}) {
  const { status, loading, error, activate, deactivate } =
    useWhatsAppMultitenant(shopId, user.token);

  return (
    <div className="whatsapp-panel">
      <h3>Configuración de WhatsApp</h3>

      {error && <div className="error">Error: {error}</div>}

      {!status.isActive ? (
        <div>
          <p>WhatsApp no está activado para este shop.</p>
          <button onClick={() => activate(flowId)} disabled={loading} className="btn-primary">
            {loading ? "Activando..." : "Activar WhatsApp"}
          </button>
        </div>
      ) : !status.isConnected ? (
        <div>
          <p>Escanea el código QR con tu WhatsApp:</p>
          {status.qr && (
            <div className="qr-container">
              <QRCode value={status.qr} size={256} />
            </div>
          )}
          <p>Esperando conexión...</p>
          <button
            onClick={deactivate}
            disabled={loading}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div>
          <p>✅ WhatsApp conectado</p>
          <p>Número: {status.phoneNumber}</p>
          <p>Última conexión: {status.lastConnection}</p>
          <button
            onClick={deactivate}
            disabled={loading}
            className="btn-danger"
          >
            Desactivar WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}

// Componente para enviar mensajes
export function MessageSender({
  shopId,
  user,
}: {
  shopId: string;
  user: ShopUser;
}) {
  const { status, sendMessage, sendGroupMessage } = useWhatsAppMultitenant(
    shopId,
    user.token
  );
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [groupId, setGroupId] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      if (phoneNumber) {
        await sendMessage(phoneNumber, message);
      } else if (groupId) {
        await sendGroupMessage(groupId, message);
      }
      setMessage("");
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setSending(false);
    }
  };

  if (!status.isConnected) {
    return (
      <div className="message-sender">
        <p>WhatsApp no está conectado. Actívalo primero.</p>
      </div>
    );
  }

  return (
    <div className="message-sender">
      <h4>Enviar Mensaje</h4>
      <form onSubmit={handleSendMessage}>
        <div>
          <label>
            Número de teléfono:
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="5491123456789"
            />
          </label>
        </div>
        <div>
          <label>
            O ID de grupo:
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="120363123456789012"
            />
          </label>
        </div>
        <div>
          <label>
            Mensaje:
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={3}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={sending || (!phoneNumber && !groupId) || !message.trim()}
          className="btn-primary"
        >
          {sending ? "Enviando..." : "Enviar Mensaje"}
        </button>
      </form>
    </div>
  );
}

// Ejemplo de uso completo
export function ShopDashboard({ user }: { user: ShopUser }) {
  return (
    <div className="shop-dashboard">
      <h2>Panel de Control - Shop {user.shopId}</h2>

      <WhatsAppActivationPanel shopId={user.shopId} user={user} flowId="64f8a1b2c3d4e5f6a7b8c9d0" />

      <MessageSender shopId={user.shopId} user={user} />
    </div>
  );
}

// Ejemplo de configuración de la aplicación
export const appConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  pollingInterval: 3000, // 3 segundos
  qrSize: 256,
};

// Ejemplo de estilos CSS
export const styles = `
.whatsapp-panel {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.qr-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.btn-primary {
  background-color: #25D366;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.message-sender {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.message-sender form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-sender input,
.message-sender textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.shop-dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
`;
