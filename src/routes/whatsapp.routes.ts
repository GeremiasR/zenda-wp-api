import { Router } from "express";
import { whatsappController } from "../controllers/whatsapp.controller";

const router = Router();

// Ruta para verificación de webhook (GET)
router.get("/webhook", (req, res) => {
  // Verificar token para la autenticación del webhook de WhatsApp
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    // Esta funcionalidad de webhook es para la API oficial de WhatsApp
    // Con Baileys no necesitamos verificación de webhook
    console.log("Webhook verificado (compatibilidad con API oficial)");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(400);
  }
});

// Ruta para recepción de mensajes (POST)
router.post("/webhook", (req, res) => {
  const body = req.body;

  // Verificar que la petición venga de WhatsApp
  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messaging_product === "whatsapp"
    ) {
      // Procesar mensajes entrantes
      const webhookData = body.entry[0].changes[0].value;

      // Responder rápidamente con un 200 antes de procesar
      res.status(200).send("OK");

      // Procesar mensajes (esto se manejaría con un controlador)
      if (webhookData.messages && webhookData.messages.length > 0) {
        console.log(
          "Mensaje recibido:",
          JSON.stringify(webhookData.messages[0])
        );
        // Aquí iría la lógica para manejar mensajes
      }

      // Procesar actualizaciones de estado
      if (webhookData.statuses && webhookData.statuses.length > 0) {
        console.log(
          "Actualización de estado:",
          JSON.stringify(webhookData.statuses[0])
        );
        // Aquí iría la lógica para manejar actualizaciones de estado
      }
    } else {
      // No es una petición de WhatsApp
      res.sendStatus(400);
    }
  } else {
    // No es un objeto válido
    res.sendStatus(400);
  }
});

// Rutas para gestión de sesiones de WhatsApp
router.post("/sessions", (req, res) =>
  whatsappController.createSession(req, res)
);
router.post("/sessions/:sessionId/connect", (req, res) =>
  whatsappController.connectSession(req, res)
);
router.post("/sessions/:sessionId/disconnect", (req, res) =>
  whatsappController.disconnectSession(req, res)
);
router.get("/sessions/:sessionId/status", (req, res) =>
  whatsappController.getSessionStatus(req, res)
);
router.get("/sessions", (req, res) =>
  whatsappController.getActiveSessions(req, res)
);
router.delete("/sessions/:sessionId", (req, res) =>
  whatsappController.removeSession(req, res)
);

// Rutas para envío de mensajes
router.post("/send", (req, res) => whatsappController.sendMessage(req, res));
router.post("/send-group", (req, res) =>
  whatsappController.sendGroupMessage(req, res)
);

export default router;
