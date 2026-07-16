const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 100;

/**
 * Parses and sanitises pagination query params.
 * Caps limit at MAX_LIMIT to prevent full-table memory loads.
 *
 * Usage: const { skip, take, page, limit } = paginate(req.query)
 */
const paginate = (query = {}) => {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
};

/**
 * Builds a standard meta block for paginated responses.
 */
const paginateMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});

export { paginate, paginateMeta };
