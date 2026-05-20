const router = require('express').Router()
const controller = require('../controllers/readingList.controller')
const { authenticate, optionalAuthenticate } = require('../middleware/auth')

// My lists — must come before /:id to avoid conflict
router.get('/mine', authenticate, controller.getMyLists)

// Public lists by user
router.get('/user/:userId', controller.getUserLists)

// Single list
router.get('/:id', optionalAuthenticate, controller.getOne)

// CRUD
router.post('/', authenticate, controller.create)
router.patch('/:id', authenticate, controller.update)
router.delete('/:id', authenticate, controller.remove)

// Items
router.post('/:id/items', authenticate, controller.addItem)
router.delete('/:id/items/:itemId', authenticate, controller.removeItem)

// Quick-save toggle — adds/removes from user's default Saved list
router.post('/quick-save', authenticate, controller.quickSave)

module.exports = router