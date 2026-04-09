const router = require('express').Router();
const controller = require('../controllers/category.controller');

router.get('/', controller.list);

module.exports = router;