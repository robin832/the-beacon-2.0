-- Test: Engagement Scoring System
-- Validates engagement score calculation, health classification, and 3-event rule
-- Run against The Beacon 2.0 Supabase project (troftohnocgxcsvswhbo)

-- ============================================================
-- Test 1: Calculate engagement score for a specific account
-- ============================================================
WITH scores AS (
  SELECT account_id,
    SUM(points) as total_12mo,
    COUNT(*) FILTER (WHERE engagement_type = 'event_attended'
      AND date_part('year', engagement_date) = date_part('year', now())) as events_ytd,
    COUNT(*) FILTER (WHERE engagement_type = 'coworking_day'
      AND date_part('year', engagement_date) = date_part('year', now())) as coworking_ytd,
    MAX(engagement_date) as last_engagement,
    COUNT(DISTINCT engagement_type) as engagement_diversity
  FROM engagement_logs
  WHERE engagement_date > now() - interval '12 months'
  GROUP BY account_id
)
SELECT
  a.name,
  s.total_12mo,
  s.events_ytd,
  s.coworking_ytd,
  s.last_engagement,
  CURRENT_DATE - s.last_engagement as days_since,
  CASE
    WHEN a.member_since > now() - interval '90 days' THEN 'New'
    WHEN s.total_12mo >= 80 THEN 'Healthy'
    WHEN s.total_12mo >= 40 THEN 'At Risk'
    ELSE 'Critical'
  END as health_status,
  CASE
    WHEN s.events_ytd >= 3 THEN 'Met'
    WHEN s.events_ytd >= 2 AND date_part('month', now()) <= 8 THEN 'On Track'
    ELSE 'At Risk'
  END as three_event_status,
  GREATEST(0, 3 - s.events_ytd) as events_needed
FROM scores s
JOIN accounts a ON s.account_id = a.id
ORDER BY s.total_12mo DESC;

-- ============================================================
-- Test 2: Members with engagement concerns approaching renewal
-- ============================================================
SELECT
  a.name,
  a.renewal_date,
  a.membership_tier,
  a.annual_value,
  es.health_status,
  es.total_points_12mo,
  es.events_ytd,
  es.days_since_engagement,
  es.trend,
  es.three_event_status
FROM accounts a
JOIN engagement_scores es ON a.id = es.account_id
WHERE a.renewal_date BETWEEN now() AND now() + interval '90 days'
  AND es.health_status IN ('At Risk', 'Critical')
  AND a.archived_at IS NULL
ORDER BY a.renewal_date;

-- ============================================================
-- Test 3: Engagement breakdown by type for an account
-- ============================================================
SELECT
  engagement_type,
  COUNT(*) as occurrences,
  SUM(points) as total_points,
  MIN(engagement_date) as first,
  MAX(engagement_date) as last
FROM engagement_logs
WHERE account_id = (SELECT id FROM accounts WHERE name = 'Test Account' LIMIT 1)
  AND engagement_date > now() - interval '12 months'
GROUP BY engagement_type
ORDER BY total_points DESC;

-- ============================================================
-- Test 4: Monthly engagement trend for an account
-- ============================================================
SELECT
  date_trunc('month', engagement_date) as month,
  SUM(points) as monthly_points,
  COUNT(*) as events_count,
  STRING_AGG(DISTINCT engagement_type, ', ') as types
FROM engagement_logs
WHERE account_id = (SELECT id FROM accounts WHERE name = 'Test Account' LIMIT 1)
  AND engagement_date > now() - interval '12 months'
GROUP BY date_trunc('month', engagement_date)
ORDER BY month;

-- ============================================================
-- Test 5: Engagement leaderboard (top 10 most engaged accounts)
-- ============================================================
SELECT
  a.name,
  a.account_type,
  a.membership_tier,
  es.total_points_12mo,
  es.health_status,
  es.events_ytd,
  es.last_engagement,
  es.trend
FROM engagement_scores es
JOIN accounts a ON es.account_id = a.id
WHERE a.archived_at IS NULL
ORDER BY es.total_points_12mo DESC
LIMIT 10;

-- ============================================================
-- Test 6: Accounts with zero engagement in last 60 days
-- ============================================================
SELECT
  a.name,
  a.account_type,
  a.renewal_date,
  es.last_engagement,
  es.days_since_engagement,
  es.health_status
FROM accounts a
LEFT JOIN engagement_scores es ON a.id = es.account_id
WHERE a.account_type IN ('Tech Member', 'Industry Partner')
  AND a.archived_at IS NULL
  AND (es.last_engagement IS NULL OR es.last_engagement < CURRENT_DATE - 60)
ORDER BY a.renewal_date NULLS LAST;
