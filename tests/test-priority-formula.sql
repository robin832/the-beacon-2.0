-- Test: Pull-Based Task Priority Formula
-- Validates priority scoring, deadline boost, and work grade classification
-- Run against The Beacon 2.0 Supabase project (troftohnocgxcsvswhbo)

-- ============================================================
-- Test 1: Insert a test task and verify score calculation
-- ============================================================
INSERT INTO tasks (
  title, zone, task_type, due_date,
  score_impact, score_urgency, score_leverage, score_energy,
  score_goals, score_risk, score_motivation, score_frequency, score_time,
  assignee, date_added
) VALUES (
  'Test: Renewal prep for Bekaert', 'to_prioritize', 'Renewal Prep',
  CURRENT_DATE + 7,
  5, 4, 4, 3, 5, 3, 4, 2, 3,
  'Robin', CURRENT_DATE
) RETURNING id, title;

-- ============================================================
-- Test 2: Calculate priority score (should match formula)
-- Expected: (5×2.0) + (4×1.8) + (4×1.5) + (3×1.5) + (5×1.2) + (3×1.0) + (4×0.8) + (2×0.7) - (3×1.0) + 20 (deadline boost)
-- = 10 + 7.2 + 6 + 4.5 + 6 + 3 + 3.2 + 1.4 - 3 + 20 = 58.3
-- ============================================================
SELECT
  title,
  score_impact, score_urgency, score_leverage, score_energy,
  score_goals, score_risk, score_motivation, score_frequency, score_time,
  -- Base score
  (score_impact * 2.0) + (score_urgency * 1.8) + (score_leverage * 1.5)
  + (score_energy * 1.5) + (score_goals * 1.2) + (score_risk * 1.0)
  + (score_motivation * 0.8) + (score_frequency * 0.7) - (score_time * 1.0)
  as base_score,
  -- Deadline boost
  CASE WHEN due_date IS NOT NULL AND due_date - CURRENT_DATE < 7 THEN 20 ELSE 0 END
  as deadline_boost,
  -- Final score
  (score_impact * 2.0) + (score_urgency * 1.8) + (score_leverage * 1.5)
  + (score_energy * 1.5) + (score_goals * 1.2) + (score_risk * 1.0)
  + (score_motivation * 0.8) + (score_frequency * 0.7) - (score_time * 1.0)
  + CASE WHEN due_date IS NOT NULL AND due_date - CURRENT_DATE < 7 THEN 20 ELSE 0 END
  as expected_priority_score,
  priority_score as stored_priority_score
FROM tasks
WHERE title = 'Test: Renewal prep for Bekaert';

-- ============================================================
-- Test 3: Work grade auto-classification
-- Deep Work if: energy >= 3 AND 2+ of (impact >= 4, leverage >= 4, goals >= 4) AND time <= 2
-- ============================================================
SELECT
  title,
  score_energy, score_impact, score_leverage, score_goals, score_time,
  CASE
    WHEN score_energy >= 3
      AND ((CASE WHEN score_impact >= 4 THEN 1 ELSE 0 END)
         + (CASE WHEN score_leverage >= 4 THEN 1 ELSE 0 END)
         + (CASE WHEN score_goals >= 4 THEN 1 ELSE 0 END)) >= 2
      AND score_time <= 2
    THEN 'Deep Work'
    ELSE 'Shallow Work'
  END as expected_work_grade,
  work_grade as stored_work_grade
FROM tasks
WHERE title = 'Test: Renewal prep for Bekaert';
-- Expected: Shallow Work (time = 3, which is > 2)

-- ============================================================
-- Test 4: Pull-based queue view (Robin's ready-to-pull sorted by priority)
-- ============================================================
SELECT
  title, zone, priority_score, work_grade,
  due_date, assignee,
  CASE WHEN due_date IS NOT NULL AND due_date - CURRENT_DATE < 7 THEN 'DEADLINE SOON' ELSE '' END as alert
FROM tasks
WHERE assignee = 'Robin'
  AND zone IN ('ready_to_pull', 'to_prioritize')
  AND completed_at IS NULL
ORDER BY priority_score DESC NULLS LAST;

-- ============================================================
-- Test 5: Active tasks count check (max 3)
-- ============================================================
SELECT
  assignee,
  COUNT(*) as active_count,
  CASE WHEN COUNT(*) >= 3 THEN 'FULL - cannot pull more' ELSE 'Slots available: ' || (3 - COUNT(*)) END as status
FROM tasks
WHERE zone = 'active'
  AND completed_at IS NULL
GROUP BY assignee;

-- ============================================================
-- Test 6: Sub-task hierarchy
-- ============================================================
SELECT
  p.title as parent_task,
  p.priority_score as parent_score,
  c.title as sub_task,
  c.estimated_minutes,
  c.scheduled_start,
  c.zone as sub_zone,
  d.title as depends_on
FROM tasks p
JOIN tasks c ON c.parent_task_id = p.id
LEFT JOIN tasks d ON c.depends_on_task_id = d.id
ORDER BY p.title, c.sort_order;

-- ============================================================
-- Cleanup: Remove test task
-- ============================================================
DELETE FROM tasks WHERE title = 'Test: Renewal prep for Bekaert';
