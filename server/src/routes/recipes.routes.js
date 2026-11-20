import { Router } from 'express';
import * as controller from '../controllers/recipes.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { uploadPhoto } from '../middlewares/photoUpload.js';
import { importLimiter, photoLimiter } from '../middlewares/rateLimits.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../schemas/common.schema.js';
import {
  createRecipeBody,
  importBody,
  listRecipesQuery,
  updateRecipeBody,
} from '../schemas/recipes.schema.js';

const router = Router();
router.use(requireAuth);

// `/import` passe avant `/:id`
router.post('/import', importLimiter, validate({ body: importBody }), controller.importFromUrl);
router.get('/', validate({ query: listRecipesQuery }), controller.list);
router.post('/', validate({ body: createRecipeBody }), controller.create);
router.get('/:id', validate({ params: idParams }), controller.get);
router.put('/:id', validate({ params: idParams, body: updateRecipeBody }), controller.update);
router.delete('/:id', validate({ params: idParams }), controller.remove);
router.post('/:id/copy', validate({ params: idParams }), controller.copy);

// Photos : compteur de requêtes à part (une liste en charge une par recette)
router.get('/:id/photo', photoLimiter, validate({ params: idParams }), controller.getPhoto);
router.put('/:id/photo', validate({ params: idParams }), uploadPhoto, controller.setPhoto);
router.delete('/:id/photo', validate({ params: idParams }), controller.removePhoto);

export default router;
