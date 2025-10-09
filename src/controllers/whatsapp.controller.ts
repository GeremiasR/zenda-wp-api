import { Request, Response } from "express";
import { whatsappManagerService } from "../services/whatsapp-manager.service";
import { WhatsAppProviderType } from "../providers/whatsapp";

export class WhatsAppController {
  /**
   * Crear e inicializar una nueva sesión de WhatsApp
   */
  public async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, phoneNumber, provider, credentials, shopId } =
        req.body;

      if (!sessionId || !phoneNumber || !provider) {
        res.status(400).json({
          success: false,
          message: "Se requieren los campos sessionId, phoneNumber y provider",
        });
        return;
      }

      // Validar que el proveedor sea válido
      if (!Object.values(WhatsAppProviderType).includes(provider)) {
        res.status(400).json({
          success: false,
          message: `Proveedor no válido. Proveedores disponibles: ${Object.values(
            WhatsAppProviderType
          ).join(", ")}`,
        });
        return;
      }

      const providerInstance = await whatsappManagerService.initializeSession(
        sessionId,
        phoneNumber,
        provider,
        credentials,
        shopId
      );

      res.status(200).json({
        success: true,
        message: "Sesión de WhatsApp creada exitosamente",
        data: {
          sessionId,
          phoneNumber,
          provider,
          shopId,
        },
      });
    } catch (error) {
      console.error("Error al crear sesión de WhatsApp:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear sesión de WhatsApp",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Conectar una sesión de WhatsApp
   */
  public async connectSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: "Se requiere el sessionId",
        });
        return;
      }

      await whatsappManagerService.connectSession(sessionId);

      res.status(200).json({
        success: true,
        message: "Sesión conectada exitosamente",
        data: { sessionId },
      });
    } catch (error) {
      console.error("Error al conectar sesión:", error);
      res.status(500).json({
        success: false,
        message: "Error al conectar sesión",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Desconectar una sesión de WhatsApp
   */
  public async disconnectSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: "Se requiere el sessionId",
        });
        return;
      }

      await whatsappManagerService.disconnectSession(sessionId);

      res.status(200).json({
        success: true,
        message: "Sesión desconectada exitosamente",
        data: { sessionId },
      });
    } catch (error) {
      console.error("Error al desconectar sesión:", error);
      res.status(500).json({
        success: false,
        message: "Error al desconectar sesión",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener estado de una sesión específica
   */
  public async getSessionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: "Se requiere el sessionId",
        });
        return;
      }

      const status = await whatsappManagerService.getSessionStatus(sessionId);

      res.status(200).json({
        success: true,
        message: "Estado de sesión obtenido",
        data: status,
      });
    } catch (error) {
      console.error("Error al obtener estado de sesión:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estado de sesión",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener todas las sesiones activas
   */
  public async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await whatsappManagerService.getActiveSessions();

      res.status(200).json({
        success: true,
        message: "Sesiones activas obtenidas",
        data: sessions,
      });
    } catch (error) {
      console.error("Error al obtener sesiones activas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener sesiones activas",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Enviar mensaje a través de una sesión específica
   */
  public async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, jid, message } = req.body;

      if (!sessionId || !jid || !message) {
        res.status(400).json({
          success: false,
          message: "Se requieren los campos sessionId, jid y message",
        });
        return;
      }

      await whatsappManagerService.sendMessage(sessionId, jid, message);

      res.status(200).json({
        success: true,
        message: "Mensaje enviado exitosamente",
        data: { sessionId, jid, message },
      });
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      res.status(500).json({
        success: false,
        message: "Error al enviar mensaje",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Enviar mensaje a un grupo a través de una sesión específica
   */
  public async sendGroupMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, groupJid, message } = req.body;

      if (!sessionId || !groupJid || !message) {
        res.status(400).json({
          success: false,
          message: "Se requieren los campos sessionId, groupJid y message",
        });
        return;
      }

      await whatsappManagerService.sendGroupMessage(
        sessionId,
        groupJid,
        message
      );

      res.status(200).json({
        success: true,
        message: "Mensaje enviado al grupo exitosamente",
        data: { sessionId, groupJid, message },
      });
    } catch (error) {
      console.error("Error al enviar mensaje al grupo:", error);
      res.status(500).json({
        success: false,
        message: "Error al enviar mensaje al grupo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Eliminar una sesión
   */
  public async removeSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: "Se requiere el sessionId",
        });
        return;
      }

      await whatsappManagerService.removeSession(sessionId);

      res.status(200).json({
        success: true,
        message: "Sesión eliminada exitosamente",
        data: { sessionId },
      });
    } catch (error) {
      console.error("Error al eliminar sesión:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar sesión",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}

export const whatsappController = new WhatsAppController();
