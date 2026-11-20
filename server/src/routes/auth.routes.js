import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter, emailLimiter } from '../middlewares/rateLimits.js';
import { validate } from '../middlewares/validate.js';
import {
  forgotPasswordBody,
  loginBody,
  registerBody,
  resetPasswordBody,
  tokenParams,
} from '../schemas/auth.schema.js';

const router = Router();

router.get(
  '/invitations/:token',
  authLimiter,
  validate({ params: tokenParams }),
  controller.getInvitation,
);
router.post('/register', authLimiter, validate({ body: registerBody }), controller.register);
router.post('/login', authLimiter, validate({ body: loginBody }), controller.login);
router.post(
  '/forgot-password',
  emailLimiter,
  validate({ body: forgotPasswordBody }),
  controller.forgotPassword,
);
router.get(
  '/reset-password/:token',
  authLimiter,
  validate({ params: tokenParams }),
  controller.getPasswordReset,
);
router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordBody }),
  controller.resetPassword,
);

router.get('/me', requireAuth, controller.me);
router.post('/logout', requireAuth, controller.logout);
router.post('/logout-all', requireAuth, controller.logoutAll);

export default router;
