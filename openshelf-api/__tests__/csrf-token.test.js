jest.mock('meilisearch', () => ({
  Meilisearch: jest.fn().mockImplementation(() => ({
    index: jest.fn(() => ({
      updateSearchableAttributes: jest.fn().mockResolvedValue({ uid: 1 }),
      updateFilterableAttributes: jest.fn().mockResolvedValue({ uid: 1 }),
      updateSortableAttributes: jest.fn().mockResolvedValue({ uid: 1 }),
      updateRankingRules: jest.fn().mockResolvedValue({ uid: 1 }),
    })),
    tasks: { waitForTask: jest.fn().mockResolvedValue({ status: 'succeeded' }) },
    getRawIndex: jest.fn().mockResolvedValue({ primaryKey: 'id' }),
    createIndex: jest.fn().mockResolvedValue({ uid: 1 }),
  })),
}))

jest.mock('../src/routes/auth.routes', () => require('express').Router())
jest.mock('../src/routes/resource.routes', () => require('express').Router())
jest.mock('../src/routes/user.routes', () => require('express').Router())
jest.mock('../src/routes/readingList.routes', () => require('express').Router())
jest.mock('../src/routes/club.routes', () => require('express').Router())
jest.mock('../src/routes/tag.routes', () => require('express').Router())
jest.mock('../src/routes/admin.routes', () => require('express').Router())
jest.mock('../src/routes/progress.routes', () => require('express').Router())
jest.mock('../src/routes/comment.routes', () => require('express').Router())
jest.mock('../src/routes/metrics.routes', () => require('express').Router())
jest.mock('../src/routes/report.routes', () => require('express').Router())
jest.mock('../src/routes/category.routes', () => require('express').Router())
jest.mock('../src/jobs/snapshotMetrics.job', () => ({
  start: jest.fn(),
}))

process.env.COOKIE_SECRET = 'test-cookie-secret'

const request = require('supertest')
const app = require('../src/app')

describe('GET /api/csrf-token', () => {
  it('returns a csrf token', async () => {
    const res = await request(app).get('/api/csrf-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('csrfToken')
    expect(typeof res.body.csrfToken).toBe('string')
    expect(res.body.csrfToken.length).toBeGreaterThan(0)
  })
})