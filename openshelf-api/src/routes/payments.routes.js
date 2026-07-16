import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkout, portal, sync } from '../controllers/payments.controller.js';

const router = express.Router();

router.post('/checkout', authenticate, checkout);
router.post('/portal', authenticate, portal);
router.post('/sync', authenticate, sync);

export default router;
