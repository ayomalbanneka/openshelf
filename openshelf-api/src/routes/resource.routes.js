import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/resource.controller.js';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import * as reviewController from '../controllers/review.controller.js';
import * as resourceService from '../services/resource.service.js';
import * as searchService from '../services/search.service.js';

const router = Router();

// Search endpoint
router.get('/search', async (req, res, next) => {
  try {
    const { q, type, language, page, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        data: [],
        meta: { total: 0, page: 1, limit: 10, pages: 0 },
      });
    }

    let result;

    try {
      // Try Meilisearch first — fast, typo-tolerant
      result = await searchService.search({
        q,
        type,
        language,
        page: page || 1,
        limit: limit || 20,
      });
    } catch (meiliErr) {
      // Fall back to PostgreSQL if Meilisearch is down
      console.warn('Meilisearch unavailable, falling back to PostgreSQL:', meiliErr.message);
      result = await resourceService.list({
        search: q,
        type,
        language,
        page: page || 1,
        limit: limit || 20,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Public Endpoints
router.get('/', controller.list);
router.get('/:slug', controller.getOne);

// Authenticated
router.post(
  '/',
  authenticate,
  upload.any(), // Handle file upload from the 'file' field
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type')
      .isIn(['BOOK', 'COURSE', 'EXAM_PAPER', 'DOCUMENT', 'AUDIO'])
      .withMessage('Invalid resource type'),
    body('categoryId').trim().notEmpty().withMessage('Category is required'),
  ],
  validate,
  controller.create
);

router.patch('/:slug', authenticate, controller.update);

// Admin / Moderator only
// Reviews
router.get('/:slug/reviews', reviewController.getReviews);
router.post('/:slug/reviews', authenticate, reviewController.createReview);

// Bookmarks
router.post('/:slug/bookmark', authenticate, reviewController.addBookmark);
router.delete('/:slug/bookmark', authenticate, reviewController.removeBookmark);
router.get('/:slug/bookmark', authenticate, reviewController.getBookmarkStatus);

router.delete('/:slug', authenticate, controller.remove);

export default router;
