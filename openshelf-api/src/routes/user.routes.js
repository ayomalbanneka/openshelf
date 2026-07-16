import { Router } from 'express';
import * as controller from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { validateFileBytes } from '../utils/validateFileBytes.js';
import { uploadFile } from '../services/storage.service.js';
import prisma from '../config/prisma.js';

const router = Router();

// Contributor stats — authenticated, own stats only
router.get('/me/stats', authenticate, controller.getMyStats);

// Public
router.get('/:id', controller.getProfile);
router.get('/:id/followers', controller.getFollowers);
router.get('/:id/following', controller.getFollowing);
router.get('/:id/uploads', controller.getUploads);

// Authenticated
router.patch('/me', authenticate, controller.updateProfile);
// src/routes/user.routes.js — add this route after PATCH /me/password
router.patch('/me/notification-prefs', authenticate, controller.updateNotificationPrefs);
router.patch('/me/password', authenticate, controller.changePassword);
router.get('/:id/is-following', authenticate, controller.isFollowing);
router.post('/:id/follow', authenticate, controller.follow);
router.delete('/:id/follow', authenticate, controller.unfollow);

router.post('/me/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Only allow images
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    await validateFileBytes(req.file.buffer, 'avatar');

    const avatarUrl = await uploadFile(req.file, 'avatars');

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
