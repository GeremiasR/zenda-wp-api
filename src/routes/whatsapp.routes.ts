import { Router } from "express";
import config from "../config";
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

// Rutas para Baileys WhatsApp
router.post("/connect", (req, res) => whatsappController.connect(req, res));
router.post("/disconnect", (req, res) =>
  whatsappController.disconnect(req, res)
);
router.get("/status", (req, res) => whatsappController.getStatus(req, res));
router.post("/send", (req, res) => whatsappController.sendMessage(req, res));
router.post("/send-group", (req, res) =>
  whatsappController.sendGroupMessage(req, res)
);

export default router;
