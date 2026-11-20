import { Router } from 'express';
import * as controller from '../controllers/me.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimits.js';
import { validate } from '../middlewares/validate.js';
import { changePasswordBody, deleteMeBody, updateMeBody } from '../schemas/me.schema.js';

const router = Router();

router.use(requireAuth);

// Les routes qui demandent le mot de passe sont limitées : on ne peut pas le deviner en boucle
router.patch('/', authLimiter, validate({ body: updateMeBody }), controller.update);
router.put(
  '/password',
  authLimiter,
  validate({ body: changePasswordBody }),
  controller.changePassword,
);
router.delete('/', authLimiter, validate({ body: deleteMeBody }), controller.remove);

export default router;
