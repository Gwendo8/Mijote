import { Router } from 'express';
import * as adminUsers from '../controllers/admin-users.controller.js';
import * as foods from '../controllers/foods.controller.js';
import * as invitations from '../controllers/invitations.controller.js';
import * as settings from '../controllers/settings.controller.js';
import * as tags from '../controllers/tags.controller.js';
import { requireAdmin } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createTagBody,
  inviteBody,
  listUsersQuery,
  setRoleBody,
  settingsBody,
  updateTagBody,
} from '../schemas/admin.schema.js';
import { idParams, pageQuery } from '../schemas/common.schema.js';
import { correctionBody } from '../schemas/foods.schema.js';

// Tout ce qui est sous /api/admin est réservé aux administrateurs (401 sans session, 403 sinon)
const router = Router();
router.use(requireAdmin);

// Comptes
router.get('/users', validate({ query: listUsersQuery }), adminUsers.list);
router.patch('/users/:id', validate({ params: idParams, body: setRoleBody }), adminUsers.setRole);
router.delete('/users/:id', validate({ params: idParams }), adminUsers.remove);
router.post('/users/:id/reset-link', validate({ params: idParams }), adminUsers.sendResetLink);

// Invitations
router.get('/invitations', invitations.list);
router.post('/invitations', validate({ body: inviteBody }), invitations.invite);
router.delete('/invitations/:id', validate({ params: idParams }), invitations.cancel);

// Réglages
router.get('/settings', settings.get);
router.patch('/settings', validate({ body: settingsBody }), settings.update);

// Étiquettes
router.post('/tags', validate({ body: createTagBody }), tags.create);
router.patch('/tags/:id', validate({ params: idParams, body: updateTagBody }), tags.update);
router.delete('/tags/:id', validate({ params: idParams }), tags.remove);

// Corrections d'aliments communs (Ciqual et Open Food Facts)
router.get('/foods/corrections', validate({ query: pageQuery }), foods.listCorrections);
router.put(
  '/foods/:id/correction',
  validate({ params: idParams, body: correctionBody }),
  foods.correct,
);
router.delete('/foods/:id/correction', validate({ params: idParams }), foods.removeCorrection);

export default router;
