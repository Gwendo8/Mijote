import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import meRoutes from './me.routes.js';
import settingsRoutes from './settings.routes.js';

// Point d'entrée de toutes les routes de l'API : un router par domaine.
const router = Router();

router.use('/health', healthRoutes);
router.use('/settings', settingsRoutes);
router.use('/auth', authRoutes);
router.use('/me', meRoutes);

export default router;
