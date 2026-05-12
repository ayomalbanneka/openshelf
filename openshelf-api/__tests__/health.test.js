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

const request = require('supertest')
const app = require('../src/app')

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
  })
})
