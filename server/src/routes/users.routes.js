import { Router } from 'express';
import * as controller from '../controllers/users.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { searchUsersQuery } from '../schemas/users.schema.js';

const router = Router();

router.use(requireAuth);
router.get('/search', validate({ query: searchUsersQuery }), controller.search);

export default router;
