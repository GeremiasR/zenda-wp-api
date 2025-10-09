import { Router } from "express";
import whatsappRoutes from "./whatsapp.routes";
import whatsappMultitenantRoutes from "./whatsapp-multitenant.routes";
import flowRoutes from "./flow.routes";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin";

const router = Router();

// Ruta de salud/estado
router.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "API funcionando correctamente" });
});

// Rutas principales
router.use("/auth", authRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/whatsapp-shop", whatsappMultitenantRoutes);
router.use("/flows", flowRoutes);
router.use("/admin", adminRoutes);

export default router;
