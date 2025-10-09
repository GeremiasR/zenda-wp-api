import { Request, Response } from "express";
import { whatsappMultitenantManagerService } from "../services/whatsapp-multitenant-manager.service";

export class WhatsAppMultitenantController {
  /**
   * Activar WhatsApp para un shop
   */
  public async activateShopWhatsApp(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { shopId, flowId } = req.body;
      const user = (req as any).user; // Usuario autenticado

      if (!shopId || !flowId) {
        res.status(400).json({
          success: false,
          message: "Se requieren los campos shopId y flowId",
        });
        return;
      }

      // Verificar que el usuario tenga permisos para este shop
      if (user.shopId !== shopId && user.roleCode !== "SHOPADMIN") {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para activar WhatsApp en este shop",
        });
        return;
      }

      const result = await whatsappMultitenantManagerService.startShopSession(
        shopId,
        flowId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          shopId,
          flowId,
          sessionId: result.sessionId,
          qr: result.qr,
        },
      });
    } catch (error) {
      console.error("Error al activar WhatsApp para shop:", error);
      res.status(500).json({
        success: false,
        message: "Error al activar WhatsApp",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtener estado de WhatsApp de un shop
   */
  public async getShopWhatsAppStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { shopId } = req.params;
      const user = (req as any).user;

      if (!shopId) {
        res.status(400).json({
          success: false,
          message: "Se requiere el shopId",
        });
        return;
      }

      // Verificar permisos
      if (user.shopId !== shopId && !user.isAdmin) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para ver el estado de este shop",
        });
        return;
      }

      const status =
        await whatsappMultitenantManagerService.getShopSessionStatus(shopId);

      res.status(200).json({
        success: true,
        message: "Estado obtenido exitosamente",
        data: {
          shopId,
          ...status,
        },
      });
    } catch (error) {
      console.error("Error al obtener estado de WhatsApp:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estado",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Desactivar WhatsApp de un shop
   */
  public async deactivateShopWhatsApp(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { shopId } = req.params;
      const user = (req as any).user;

      if (!shopId) {
        res.status(400).json({
          success: false,
          message: "Se requiere el shopId",
        });
        return;
      }

      // Verificar permisos
      if (user.shopId !== shopId && !user.isAdmin) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para desactivar WhatsApp en este shop",
        });
        return;
      }

      await whatsappMultitenantManagerService.deactivateShopSession(shopId);

      res.status(200).json({
        success: true,
        message: "WhatsApp desactivado exitosamente",
        data: { shopId },
      });
    } catch (error) {
      console.error("Error al desactivar WhatsApp:", error);
      res.status(500).json({
        success: false,
        message: "Error al desactivar WhatsApp",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Enviar mensaje desde un shop
   */
  public async sendMessageFromShop(req: Request, res: Response): Promise<void> {
    try {
      const { shopId, jid, message } = req.body;
      const user = (req as any).user;

      if (!shopId || !jid || !message) {
        res.status(400).json({
          success: false,
          message: "Se requieren los campos shopId, jid y message",
        });
        return;
      }

      // Verificar permisos
      if (user.shopId !== shopId && !user.isAdmin) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para enviar mensajes desde este shop",
        });
        return;
      }

      await whatsappMultitenantManagerService.sendMessageFromShop(
        shopId,
        jid,
        message
      );

      res.status(200).json({
        success: true,
        message: "Mensaje enviado exitosamente",
        data: { shopId, jid, message },
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
   * Enviar mensaje a grupo desde un shop
   */
  public async sendGroupMessageFromShop(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { shopId, groupJid, message } = req.body;
      const user = (req as any).user;

      if (!shopId || !groupJid || !message) {
        res.status(400).json({
          success: false,
          message: "Se requieren los campos shopId, groupJid y message",
        });
        return;
      }

      // Verificar permisos
      if (user.shopId !== shopId && !user.isAdmin) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para enviar mensajes desde este shop",
        });
        return;
      }

      await whatsappMultitenantManagerService.sendGroupMessageFromShop(
        shopId,
        groupJid,
        message
      );

      res.status(200).json({
        success: true,
        message: "Mensaje enviado al grupo exitosamente",
        data: { shopId, groupJid, message },
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
   * Obtener todas las sesiones activas (solo para admins)
   */
  public async getAllActiveSessions(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const user = (req as any).user;

      // Solo admins pueden ver todas las sesiones
      if (!user.isAdmin) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para ver todas las sesiones",
        });
        return;
      }

      const sessions =
        await whatsappMultitenantManagerService.getAllActiveSessions();

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
   * Obtener QR de un shop (para polling)
   */
  public async getShopQR(req: Request, res: Response): Promise<void> {
    try {
      const { shopId } = req.params;
      const user = (req as any).user;

      if (!shopId) {
        res.status(400).json({
          success: false,
          message: "Se requiere el shopId",
        });
        return;
      }

      // Verificar permisos
      if (user.shopId !== shopId && !user.isAdmin) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para ver el QR de este shop",
        });
        return;
      }

      const status =
        await whatsappMultitenantManagerService.getShopSessionStatus(shopId);

      res.status(200).json({
        success: true,
        message: "QR obtenido",
        data: {
          shopId,
          qr: status.qr,
          isConnected: status.isConnected,
        },
      });
    } catch (error) {
      console.error("Error al obtener QR:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener QR",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}

export const whatsappMultitenantController =
  new WhatsAppMultitenantController();
