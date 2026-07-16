import { jest } from '@jest/globals';
import { Router } from 'express';

jest.mock('meilisearch', () => ({
  Meilisearch: jest.fn().mockImplementation(() => ({
    index: jest.fn(() => ({
      updateSearchableAttributes: jest.fn().mockResolvedValue({ uid: 1 }),
      updateFilterableAttributes: jest.fn().mockResolvedValue({ uid: 1 }),
      updateSortableAttributes:   jest.fn().mockResolvedValue({ uid: 1 }),
      updateRankingRules:         jest.fn().mockResolvedValue({ uid: 1 }),
    })),
    tasks:        { waitForTask: jest.fn().mockResolvedValue({ status: 'succeeded' }) },
    getRawIndex:  jest.fn().mockResolvedValue({ primaryKey: 'id' }),
    createIndex:  jest.fn().mockResolvedValue({ uid: 1 }),
  })),
}));

jest.mock('../src/routes/auth.routes.js',         () => ({ default: Router() }));
jest.mock('../src/routes/resource.routes.js',     () => ({ default: Router() }));
jest.mock('../src/routes/user.routes.js',         () => ({ default: Router() }));
jest.mock('../src/routes/readingList.routes.js',  () => ({ default: Router() }));
jest.mock('../src/routes/club.routes.js',         () => ({ default: Router() }));
jest.mock('../src/routes/tag.routes.js',          () => ({ default: Router() }));
jest.mock('../src/routes/admin.routes.js',        () => ({ default: Router() }));
jest.mock('../src/routes/progress.routes.js',     () => ({ default: Router() }));
jest.mock('../src/routes/comment.routes.js',      () => ({ default: Router() }));
jest.mock('../src/routes/metrics.routes.js',      () => ({ default: Router() }));
jest.mock('../src/routes/report.routes.js',       () => ({ default: Router() }));
jest.mock('../src/routes/category.routes.js',     () => ({ default: Router() }));
jest.mock('../src/jobs/snapshotMetrics.job.js',   () => ({ default: { start: jest.fn() } }));

process.env.COOKIE_SECRET = 'test-cookie-secret';

import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/csrf-token', () => {
  it('returns a csrf token', async () => {
    const res = await request(app).get('/api/csrf-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('csrfToken');
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.body.csrfToken.length).toBeGreaterThan(0);
  });
});
