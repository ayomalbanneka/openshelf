-- Add a generated tsvector column for full-text search
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(publisher, '')), 'D')
  ) STORED;

-- Create a GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS resources_search_vector_idx
  ON resources USING GIN (search_vector);