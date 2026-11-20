import { Router } from 'express';
import * as controller from '../controllers/planning.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../schemas/common.schema.js';
import {
  createEntryBody,
  createShareBody,
  createSlotBody,
  updateEntryBody,
  updateSlotBody,
  weekQuery,
} from '../schemas/planning.schema.js';

const router = Router();
router.use(requireAuth);

router.get('/', validate({ query: weekQuery }), controller.week);

router.post('/entries', validate({ body: createEntryBody }), controller.addEntry);
router.patch(
  '/entries/:id',
  validate({ params: idParams, body: updateEntryBody }),
  controller.updateEntry,
);
router.delete('/entries/:id', validate({ params: idParams }), controller.removeEntry);

router.get('/slots', controller.listSlots);
router.post('/slots', validate({ body: createSlotBody }), controller.createSlot);
router.patch(
  '/slots/:id',
  validate({ params: idParams, body: updateSlotBody }),
  controller.updateSlot,
);
router.delete('/slots/:id', validate({ params: idParams }), controller.removeSlot);

router.get('/shares', controller.listShares);
router.post('/shares', validate({ body: createShareBody }), controller.createShare);
router.delete('/shares/:id', validate({ params: idParams }), controller.removeShare);
router.get('/shared-with-me', controller.sharedWithMe);

export default router;
