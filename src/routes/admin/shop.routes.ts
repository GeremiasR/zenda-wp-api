import { Router } from "express";
import adminShopController from "../../controllers/admin/shop.controller";
import {
  authenticateToken,
  requireAdmin,
} from "../../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken);
router.use(requireAdmin);

// Rutas de tiendas
router.get("/", adminShopController.listShops);
router.post("/", adminShopController.createShop);
router.get("/:id", adminShopController.getShopById);
router.put("/:id", adminShopController.updateShop);
router.patch("/:id/toggle-status", adminShopController.toggleShopStatus);
router.delete("/:id", adminShopController.deleteShop);

export default router;
