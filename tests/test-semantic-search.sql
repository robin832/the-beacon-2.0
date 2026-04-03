-- Test: Semantic Search & Vector Operations
-- Validates pgvector extension, embedding storage, and similarity queries
-- Run against The Beacon 2.0 Supabase project (troftohnocgxcsvswhbo)
-- Note: These tests require embeddings to be populated first (Phase 8)

-- ============================================================
-- Test 1: Verify pgvector extension is active
-- ============================================================
SELECT * FROM pg_extension WHERE extname = 'vector';

-- ============================================================
-- Test 2: Verify embedding column exists and check coverage
-- ============================================================
SELECT 'accounts' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as has_embedding,
  ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0), 1) as coverage_pct
FROM accounts
UNION ALL
SELECT 'contacts', COUNT(*), COUNT(*) FILTER (WHERE embedding IS NOT NULL),
  ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0), 1)
FROM contacts
UNION ALL
SELECT 'events', COUNT(*), COUNT(*) FILTER (WHERE embedding IS NOT NULL),
  ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0), 1)
FROM events
UNION ALL
SELECT 'community_news', COUNT(*), COUNT(*) FILTER (WHERE embedding IS NOT NULL),
  ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0), 1)
FROM community_news
UNION ALL
SELECT 'trends_intel', COUNT(*), COUNT(*) FILTER (WHERE embedding IS NOT NULL),
  ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0), 1)
FROM trends_intel
UNION ALL
SELECT 'knowledge_base', COUNT(*), COUNT(*) FILTER (WHERE embedding IS NOT NULL),
  ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0), 1)
FROM knowledge_base
UNION ALL
SELECT 'innovation.analyses', COUNT(*), COUNT(*) FILTER (WHERE embedding IS NOT NULL),
  ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0), 1)
FROM innovation.analyses;

-- ============================================================
-- Test 3: Verify search_text generated columns populate correctly
-- ============================================================
SELECT name, LEFT(search_text, 200) as search_text_preview
FROM accounts
WHERE search_text IS NOT NULL
LIMIT 5;

-- ============================================================
-- Test 4: Cosine similarity search (requires populated embeddings)
-- Replace '<query_embedding>' with an actual 1536-dim vector
-- In practice, the Edge Function generates this from a text query
-- ============================================================
-- Example: Find accounts similar to a query about "autonomous shipping IoT"
-- SELECT name, technologies, industry_verticals,
--   1 - (embedding <=> '<query_embedding>') as similarity
-- FROM accounts
-- WHERE embedding IS NOT NULL
--   AND archived_at IS NULL
-- ORDER BY embedding <=> '<query_embedding>'
-- LIMIT 5;

-- ============================================================
-- Test 5: Cross-table semantic search (accounts + events)
-- This is what the semantic-search Edge Function does
-- ============================================================
-- WITH query AS (
--   SELECT '<query_embedding>'::vector(1536) as embedding
-- )
-- SELECT 'account' as type, name, 1 - (a.embedding <=> q.embedding) as similarity
-- FROM accounts a, query q
-- WHERE a.embedding IS NOT NULL AND a.archived_at IS NULL
-- UNION ALL
-- SELECT 'event', name, 1 - (e.embedding <=> q.embedding)
-- FROM events e, query q
-- WHERE e.embedding IS NOT NULL
-- ORDER BY similarity DESC
-- LIMIT 10;

-- ============================================================
-- Test 6: Find similar accounts to a given account (by embedding)
-- ============================================================
-- SELECT b.name, b.technologies, b.industry_verticals,
--   1 - (a.embedding <=> b.embedding) as similarity
-- FROM accounts a, accounts b
-- WHERE a.name = 'Target Company'
--   AND b.id != a.id
--   AND a.embedding IS NOT NULL
--   AND b.embedding IS NOT NULL
--   AND b.archived_at IS NULL
-- ORDER BY a.embedding <=> b.embedding
-- LIMIT 5;

-- ============================================================
-- Test 7: Verify vector dimensions are correct (1536)
-- ============================================================
SELECT name, vector_dims(embedding) as dims
FROM accounts
WHERE embedding IS NOT NULL
LIMIT 1;

-- ============================================================
-- Test 8: Performance check (should use index when HNSW is added)
-- ============================================================
-- EXPLAIN ANALYZE
-- SELECT name
-- FROM accounts
-- WHERE embedding IS NOT NULL
-- ORDER BY embedding <=> (SELECT embedding FROM accounts WHERE name = 'Target Company' LIMIT 1)
-- LIMIT 5;
