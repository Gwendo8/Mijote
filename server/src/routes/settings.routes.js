import { Router } from 'express';
import { getPublic } from '../controllers/settings.controller.js';

const router = Router();

router.get('/public', getPublic);

export default router;
