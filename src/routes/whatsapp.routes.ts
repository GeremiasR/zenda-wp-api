import { Router } from "express";
import config from "../config";

const router = Router();

// Ruta para verificación de webhook (GET)
router.get("/webhook", (req, res) => {
  // Verificar token para la autenticación del webhook de WhatsApp
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
      console.log("Webhook verificado");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
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

// Ruta para enviar mensajes (placeholder)
router.post("/send", (req, res) => {
  // Aquí iría la lógica para enviar mensajes a través de la API de WhatsApp
  res
    .status(200)
    .json({ message: "Función para enviar mensajes - por implementar" });
});

export default router;
