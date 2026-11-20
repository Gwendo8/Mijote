import { Router } from 'express';
import * as controller from '../controllers/tags.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, controller.list);

export default router;
