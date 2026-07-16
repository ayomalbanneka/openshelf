import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/club.controller.js';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', controller.list);
router.get('/:slug', controller.getOne);

// Membership
router.get('/:slug/membership', authenticate, controller.getMembership);
router.post('/:slug/join', authenticate, controller.join);
router.delete('/:slug/leave', authenticate, controller.leave);

// Discussions
router.get('/:slug/discussions', controller.getDiscussions);
router.get('/:slug/discussions/:discussionId', controller.getOneDiscussion);
router.post(
  '/:slug/discussions',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('body').trim().notEmpty().withMessage('Body is required'),
  ],
  validate,
  controller.createDiscussion
);

// Comments
router.get('/:slug/discussions/:discussionId/comments', controller.getComments);
router.post('/:slug/discussions/:discussionId/comments', authenticate, controller.createComment);

// Create club
router.post(
  '/',
  authenticate,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  controller.create
);

export default router;
