import { getIndex, client, PRIMARY_KEY } from '../config/meilisearch.js';
import { paginate, paginateMeta } from '../utils/pagination.js';

const TASK_WAIT_OPTIONS = { timeout: 20000, interval: 100 };

const waitForTaskSuccess = async (task, context) => {
  const resolvedTask = await client.tasks.waitForTask(task, TASK_WAIT_OPTIONS);

  if (resolvedTask.status !== 'succeeded') {
    const message = resolvedTask.error?.message || 'Unknown task failure';
    throw new Error(`${context} failed: ${message}`);
  }

  return resolvedTask;
};

// Convert a resource object to a Meilisearch document
const toDocument = (resource) => ({
  id: resource.id,
  title: resource.title,
  slug: resource.slug,
  description: resource.description || '',
  type: resource.type,
  language: resource.language,
  author: resource.author || '',
  publisher: resource.publisher || '',
  thumbnailUrl: resource.thumbnailUrl || null,
  pageCount: resource.pageCount || null,
  publicationYear: resource.publicationYear || null,
  isPublished: resource.isPublished,
  viewCount: resource.viewCount || 0,
  downloadCount: resource.downloadCount || 0,
  categoryId: resource.categoryId,
  categoryName: resource.category?.name || '',
  categorySlug: resource.category?.slug || '',
  tags: resource.tags?.map((t) => t.tag.name) || [],
  createdAt: resource.createdAt?.toISOString?.() || resource.createdAt,
});

// Add or update a resource in the Meilisearch index
const updateResourceIndex = async (resource) => {
  try {
    const index = getIndex();
    const task = await index.addDocuments([toDocument(resource)], { primaryKey: PRIMARY_KEY });
    await waitForTaskSuccess(task, 'Update resource index');
  } catch (err) {
    console.warn('Error updating Meilisearch index:', err.message);
  }
};

// Remove a resource from the Meilisearch index
const deleteResourceFromIndex = async (resourceId) => {
  try {
    const index = getIndex();
    const task = await index.deleteDocument(resourceId);
    await waitForTaskSuccess(task, 'Delete resource from index');
  } catch (err) {
    console.warn('Error deleting from Meilisearch index:', err.message);
  }
};

// Search using Meilisearch
const search = async ({ q, type, language, page = 1, limit = 20 }) => {
  const index = getIndex();
  const { page: safePage, limit: safeLimit, skip: offset, take } = paginate({ page, limit });

  const filters = ['isPublished = true'];
  if (type) filters.push(`type = "${type}"`);
  if (language) filters.push(`language = "${language}"`);

  const result = await index.search(q, {
    limit: take,
    offset,
    filter: filters.join(' AND '),
    attributesToHighlight: ['title', 'author', 'description'],
    attributesToRetrieve: [
      'id',
      'title',
      'slug',
      'description',
      'type',
      'language',
      'author',
      'publisher',
      'thumbnailUrl',
      'pageCount',
      'publicationYear',
      'viewCount',
      'categoryName',
      'categorySlug',
      'tags',
      'createdAt',
    ],
    highlightPreTag: '<mark class="search-highlight">',
    highlightPostTag: '</mark>',
  });

  // Merge _formatted highlights into each hit
  const hits = result.hits.map((hit) => ({
    ...hit,
    _formatted: hit._formatted || {},
  }));

  return {
    data: hits,
    meta: {
      ...paginateMeta(result.estimatedTotalHits, safePage, safeLimit),
      processingMs: result.processingTimeMs,
    },
  };
};

// Bulk index all published resources — used for initial sync
const bulkIndex = async (resources) => {
  try {
    if (!resources.length) {
      console.log('No published resources found to index.');
      return;
    }

    const index = getIndex();
    const docs = resources.map(toDocument);

    const task = await index.addDocuments(docs, { primaryKey: PRIMARY_KEY });
    await waitForTaskSuccess(task, 'Bulk index resources');

    console.log(`Bulk indexed ${docs.length} resources to Meilisearch`);
  } catch (err) {
    console.warn('Error bulk indexing to Meilisearch:', err.message);
    throw err;
  }
};

export { updateResourceIndex, deleteResourceFromIndex, search, bulkIndex };
