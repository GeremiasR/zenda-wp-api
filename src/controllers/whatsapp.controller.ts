import { Request, Response } from "express";
import { whatsappService } from "../services/whatsapp.service";

export class WhatsAppController {
  /**
   * Conectar a WhatsApp
   */
  public async connect(req: Request, res: Response): Promise<void> {
    try {
      if (whatsappService.isReady()) {
        res.status(200).json({
          success: true,
          message: "WhatsApp ya está conectado",
          data: await whatsappService.getConnectionStatus(),
        });
        return;
      }

      await whatsappService.connect();

      res.status(200).json({
        success: true,
        message:
          "Iniciando conexión con WhatsApp. Escanea el código QR que aparece en la consola.",
        data: await whatsappService.getConnectionStatus(),
      });
    } catch (error) {
      console.error("Error al conectar WhatsApp:", error);
      res.status(500).json({
        success: false,
        message: "Error al conectar con WhatsApp",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Desconectar de WhatsApp
   */
  public async disconnect(req: Request, res: Response): Promise<void> {
    try {
      await whatsappService.disconnect();

      res.status(200).json({
        success: true,
        message: "Desconectado de WhatsApp exitosamente",
      });
    } catch (error) {
      console.error("Error al desconectar WhatsApp:", error);
      res.status(500).json({
        success: false,
        message: "Error al desconectar de WhatsApp",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener estado de la conexión
   */
  public async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await whatsappService.getConnectionStatus();

      res.status(200).json({
        success: true,
        message: "Estado de conexión obtenido",
        data: status,
      });
    } catch (error) {
      console.error("Error al obtener estado:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estado de conexión",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Enviar mensaje a un número específico
   */
  public async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { jid, message } = req.body;

      if (!jid || !message) {
        res.status(400).json({
          success: false,
          message: "Se requieren los campos jid y message",
        });
        return;
      }

      if (!whatsappService.isReady()) {
        res.status(400).json({
          success: false,
          message: "WhatsApp no está conectado",
        });
        return;
      }

      await whatsappService.sendMessage(jid, message);

      res.status(200).json({
        success: true,
        message: "Mensaje enviado exitosamente",
        data: { jid, message },
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
   * Enviar mensaje a un grupo
   */
  public async sendGroupMessage(req: Request, res: Response): Promise<void> {
    try {
      const { groupJid, message } = req.body;

      if (!groupJid || !message) {
        res.status(400).json({
          success: false,
          message: "Se requieren los campos groupJid y message",
        });
        return;
      }

      if (!whatsappService.isReady()) {
        res.status(400).json({
          success: false,
          message: "WhatsApp no está conectado",
        });
        return;
      }

      await whatsappService.sendMessageToGroup(groupJid, message);

      res.status(200).json({
        success: true,
        message: "Mensaje enviado al grupo exitosamente",
        data: { groupJid, message },
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
}

export const whatsappController = new WhatsAppController();
