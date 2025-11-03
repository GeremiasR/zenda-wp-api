import { Router } from "express";
import adminShopController from "../../controllers/admin/shop.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de tiendas con autorización basada en permisos
router.get("/", authorize("shop", "view"), adminShopController.listShops);
router.post("/", authorize("shop", "create"), adminShopController.createShop);
router.get("/:id", authorize("shop", "view"), adminShopController.getShopById);
router.put("/:id", authorize("shop", "update"), adminShopController.updateShop);
router.patch("/:id/toggle-status", authorize("shop", "update"), adminShopController.toggleShopStatus);
router.delete("/:id", authorize("shop", "delete"), adminShopController.deleteShop);

export default router;
