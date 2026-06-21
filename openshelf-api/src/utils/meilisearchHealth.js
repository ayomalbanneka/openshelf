const { client, getIndex } = require('../config/meilisearch')

const getMeilisearchHealth = async () => {
  const start = Date.now()
  try {
    const health = await client.health()
    const latencyMs = Date.now() - start

    const indexStats = await getIndex().getStats().catch(() => null)

    return {
      status: health.status === 'available' ? 'healthy' : 'degraded',
      latencyMs,
      documentCount: indexStats?.numberOfDocuments ?? null,
      isIndexing: indexStats?.isIndexing ?? false,
    }
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      error: err.message,
    }
  }
}

module.exports = { getMeilisearchHealth }