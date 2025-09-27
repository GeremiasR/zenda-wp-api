import { Router } from "express";
import whatsappRoutes from "./whatsapp.routes";

const router = Router();

// Ruta de salud/estado
router.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "API funcionando correctamente" });
});

// Rutas principales
router.use("/whatsapp", whatsappRoutes);

export default router;
