import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import foodsRoutes from './foods.routes.js';
import healthRoutes from './health.routes.js';
import meRoutes from './me.routes.js';
import recipesRoutes from './recipes.routes.js';
import settingsRoutes from './settings.routes.js';
import tagsRoutes from './tags.routes.js';
import usersRoutes from './users.routes.js';

// Point d'entrée de toutes les routes de l'API : un router par domaine.
const router = Router();

router.use('/health', healthRoutes);
router.use('/settings', settingsRoutes);
router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/users', usersRoutes);
router.use('/tags', tagsRoutes);
router.use('/foods', foodsRoutes);
router.use('/recipes', recipesRoutes);
router.use('/admin', adminRoutes);

export default router;
