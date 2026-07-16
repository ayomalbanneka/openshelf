import { Router } from 'express';
import * as controller from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// User-facing — submit a report
router.post('/resources/:slug/report', authenticate, controller.createReport);

export default router;
