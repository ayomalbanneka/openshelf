const express    = require('express')
const { authenticate } = require('../middleware/auth')
const { checkout, portal, sync, webhook,debug } = require('../controllers/payments.controller')

const router = express.Router()

router.post('/checkout', authenticate, checkout);
router.post('/portal',   authenticate, portal);
router.post('/sync',     authenticate, sync);

module.exports = router;