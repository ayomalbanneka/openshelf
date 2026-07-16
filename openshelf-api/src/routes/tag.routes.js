import { Router } from 'express';
import * as controller from '../controllers/tag.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', controller.list);
router.post('/', authenticate, controller.create);

export default router;
