import { Router } from "express";
import shopRoutes from "./shop.routes";
import userRoutes from "./user.routes";
import flowRoutes from "./flow.routes";
import roleRoutes from "./role.routes";

const router = Router();

// Rutas de administración
router.use("/shops", shopRoutes);
router.use("/users", userRoutes);
router.use("/flows", flowRoutes);
router.use("/roles", roleRoutes);

export default router;
