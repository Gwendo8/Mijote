import { Router } from 'express';
import * as controller from '../controllers/foods.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { offLimiter } from '../middlewares/rateLimits.js';
import { validate } from '../middlewares/validate.js';
import { idParams, pageQuery } from '../schemas/common.schema.js';
import {
  barcodeParams,
  createFoodBody,
  offSearchQuery,
  searchQuery,
  updateFoodBody,
} from '../schemas/foods.schema.js';

const router = Router();
router.use(requireAuth);

// Les routes à adresse fixe (mine, barcode, off/search) passent avant `/:id`
router.get('/', validate({ query: searchQuery }), controller.search);
router.get('/mine', validate({ query: pageQuery }), controller.listMine);
router.get(
  '/barcode/:code',
  offLimiter,
  validate({ params: barcodeParams }),
  controller.getByBarcode,
);
router.get('/off/search', offLimiter, validate({ query: offSearchQuery }), controller.searchOff);
router.get('/:id', validate({ params: idParams }), controller.get);
router.post('/', validate({ body: createFoodBody }), controller.create);
router.patch('/:id', validate({ params: idParams, body: updateFoodBody }), controller.update);
router.delete('/:id', validate({ params: idParams }), controller.remove);

export default router;
