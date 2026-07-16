import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/comment.controller.js';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get comments for a resource (public)
router.get('/resources/:slug/comments', controller.getResourceComments);

// Post a comment (authenticated + verified)
router.post(
  '/resources/:slug/comments',
  authenticate,
  body('body').trim().notEmpty().withMessage('Comment body is required'),
  validate,
  controller.createComment
);

// Edit a comment
router.patch(
  '/comments/:id',
  authenticate,
  body('body').trim().notEmpty().withMessage('Comment body is required'),
  validate,
  controller.updateComment
);

// Delete a comment
router.delete('/comments/:id', authenticate, controller.deleteComment);

export default router;
