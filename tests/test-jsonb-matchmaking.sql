-- Test: JSONB Matchmaking Queries
-- Validates that GIN indexes and containment queries work correctly
-- Run against The Beacon 2.0 Supabase project (troftohnocgxcsvswhbo)

-- ============================================================
-- Test 1: Technology containment query
-- ============================================================
SELECT name, technologies
FROM accounts
WHERE technologies @> '["AI/ML"]'
AND archived_at IS NULL;

-- ============================================================
-- Test 2: Multi-field matchmaking (tech + industry)
-- ============================================================
SELECT name, technologies, industry_verticals
FROM accounts
WHERE technologies @> '["AI/ML"]'
AND industry_verticals @> '["Maritime & Port"]'
AND archived_at IS NULL;

-- ============================================================
-- Test 3: Find accounts with overlapping technologies
-- For a given account, find other accounts sharing any technology
-- ============================================================
SELECT b.id, b.name, b.technologies,
  (SELECT count(*)
   FROM jsonb_array_elements_text(a.technologies) t1
   JOIN jsonb_array_elements_text(b.technologies) t2 ON t1.value = t2.value
  ) as overlap_count
FROM accounts a, accounts b
WHERE a.name = 'Test Account'  -- Replace with real account name
  AND b.id != a.id
  AND b.archived_at IS NULL
  AND b.technologies ?| ARRAY(SELECT jsonb_array_elements_text(a.technologies))
ORDER BY overlap_count DESC;

-- ============================================================
-- Test 4: Pain points → Offering capabilities match
-- Find accounts whose offerings address another's pain points
-- ============================================================
SELECT
  a.name as needs_help,
  a.pain_points,
  b.name as can_help,
  b.offering_capabilities
FROM accounts a, accounts b
WHERE a.id != b.id
  AND a.archived_at IS NULL
  AND b.archived_at IS NULL
  AND b.offering_capabilities ?| ARRAY(SELECT jsonb_array_elements_text(a.pain_points))
LIMIT 20;

-- ============================================================
-- Test 5: Contact matchmaking (looking_for ↔ skills)
-- ============================================================
SELECT
  c1.full_name as seeker,
  c1.looking_for,
  c2.full_name as provider,
  c2.skills
FROM contacts c1, contacts c2
WHERE c1.id != c2.id
  AND c1.archived_at IS NULL
  AND c2.archived_at IS NULL
  AND c2.skills ?| ARRAY(SELECT jsonb_array_elements_text(c1.looking_for))
LIMIT 20;

-- ============================================================
-- Test 6: Event topic matching to contact interests
-- ============================================================
SELECT c.full_name, c.email, a.name as company, c.event_topic_interests
FROM contacts c
JOIN accounts a ON c.account_id = a.id
WHERE c.event_notifications = true
  AND c.archived_at IS NULL
  AND c.event_topic_interests ?| '["autonomous shipping", "digital twin"]'
ORDER BY c.full_name;

-- ============================================================
-- Test 7: Verify GIN indexes are being used
-- ============================================================
EXPLAIN ANALYZE
SELECT name, technologies
FROM accounts
WHERE technologies @> '["IoT"]'
AND archived_at IS NULL;
