const router = require('express').Router();
const controller = require('../controllers/user.controller');
const {authenticate} = require('../middleware/auth');

// Public
router.get('/:id',           controller.getProfile)
router.get('/:id/followers', controller.getFollowers)
router.get('/:id/following', controller.getFollowing)
router.get('/:id/uploads',   controller.getUploads)

// Authenticated
router.patch('/me',              authenticate, controller.updateProfile)
router.get('/:id/is-following',  authenticate, controller.isFollowing)
router.post('/:id/follow',       authenticate, controller.follow)
router.delete('/:id/follow',     authenticate, controller.unfollow)

module.exports = router