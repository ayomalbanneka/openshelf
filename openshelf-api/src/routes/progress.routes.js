import { Router } from 'express';
import * as controller from '../controllers/progress.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/mine', controller.getMyProgress);
router.get('/completed', controller.getCompleted);
router.get('/:resourceId', controller.getProgress);
router.put('/:resourceId', controller.updateProgress);

export default router;
