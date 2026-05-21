const router = require('express').Router();
const controller = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload')
const { validateFileBytes } = require('../utils/validateFileBytes')

// Public
router.get('/:id', controller.getProfile)
router.get('/:id/followers', controller.getFollowers)
router.get('/:id/following', controller.getFollowing)
router.get('/:id/uploads', controller.getUploads)

// Authenticated
router.patch('/me', authenticate, controller.updateProfile)
router.patch('/me/password', authenticate, controller.changePassword)
router.get('/:id/is-following', authenticate, controller.isFollowing)
router.post('/:id/follow', authenticate, controller.follow)
router.delete('/:id/follow', authenticate, controller.unfollow)

router.post(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' })
      }

      // Only allow images
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'Only image files are allowed' })
      }

      await validateFileBytes(req.file.buffer, 'avatar')

      const { uploadFile } = require('../services/storage.service')
      const avatarUrl = await uploadFile(req.file, 'avatars')

      const user = await require('../config/prisma').user.update({
        where: { id: req.user.id },
        data: { avatarUrl },
        select: { id: true, avatarUrl: true },
      })

      res.json(user)
    } catch (err) { next(err) }
  }
)

module.exports = router