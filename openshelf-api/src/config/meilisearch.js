import { Meilisearch } from 'meilisearch';

const client = new Meilisearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
});

const INDEX_NAME = 'resources';
const PRIMARY_KEY = 'id';
const TASK_WAIT_OPTIONS = { timeout: 20000, interval: 100 };

const getIndex = () => client.index(INDEX_NAME);

// Wait for a Meilisearch task to complete and check for success
const waitForTaskSuccess = async (task, context) => {
  const resolvedTask = await client.tasks.waitForTask(task, TASK_WAIT_OPTIONS);

  if (resolvedTask.status !== 'succeeded') {
    const message = resolvedTask.error?.message || 'Unknown task failure';
    throw new Error(`${context} failed: ${message}`);
  }

  return resolvedTask;
};

const ensureIndexExists = async () => {
  try {
    const indexInfo = await client.getRawIndex(INDEX_NAME);

    if (!indexInfo.primaryKey) {
      console.warn(
        `Meilisearch index "${INDEX_NAME}" has no primary key yet. It will be set to "${PRIMARY_KEY}" on first document addition.`
      );
    }
  } catch (err) {
    if (err?.cause?.code === 'index_not_found') {
      const createTask = await client.createIndex(INDEX_NAME, { primaryKey: PRIMARY_KEY });
      await waitForTaskSuccess(createTask, `Create index "${INDEX_NAME}"`);
      return;
    }

    throw err;
  }
};

const configureIndex = async () => {
  try {
    await ensureIndexExists();
    const index = getIndex();

    // Fields that can be reachable
    await waitForTaskSuccess(
      await index.updateSearchableAttributes(['title', 'description', 'publisher', 'tags']),
      'Update searchable attributes'
    );

    // Fields that can be used to filter results
    await waitForTaskSuccess(
      await index.updateFilterableAttributes(['type', 'language', 'categorySlug', 'isPublished']),
      'Update filterable attributes'
    );

    // Fields used for sorting
    await waitForTaskSuccess(
      await index.updateSortableAttributes(['createdAt', 'viewCount', 'downloadCount']),
      'Update sortable attributes'
    );

    // Ranking rules — relevance first, then popularity
    await waitForTaskSuccess(
      await index.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'viewCount:desc',
      ]),
      'Update ranking rules'
    );

    console.log('Meilisearch index configured');
  } catch (err) {
    console.warn('Error configuring Meilisearch index:', err.message);
  }
};

export { client, getIndex, configureIndex, INDEX_NAME, PRIMARY_KEY };
