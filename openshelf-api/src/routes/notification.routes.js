import { Router } from 'express';
import * as controller from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, controller.getMyNotifications);
router.patch('/read-all', authenticate, controller.markAllRead);
router.patch('/:id/read', authenticate, controller.markRead);
router.delete('/:id', authenticate, controller.deleteNotification);

export default router;
