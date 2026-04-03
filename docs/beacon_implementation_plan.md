# The Beacon 2.0 — Implementation Plan
## Phased Migration & Automation Setup
### April 2026

---

## Guiding Principles

1. **Low-hanging fruit first** — every phase delivers visible, usable value before the next one starts
2. **Test before you build on top** — each migration gets validated with real data before dependent tables are created
3. **One thing at a time** — no parallel workstreams for a 4-person team. Sequential focus.
4. **Monday stays your UI** — don't change how the team works during database setup. Data flows in the background.
5. **Reversible decisions** — every migration can be rolled back. No big-bang cutovers.

---

## Phase 0: Foundation Setup (Week 1)
### Goal: Database ready, extensions installed, basic infrastructure proven

| Step | What | How | Validation |
|------|------|-----|------------|
| 0.1 | Enable pgvector extension | `CREATE EXTENSION vector;` | `SELECT vector '[1,2,3]';` returns without error |
| 0.2 | Enable pg_cron extension | `CREATE EXTENSION pg_cron;` | Needed for scheduled database functions later |
| 0.3 | Create `innovation` schema | `CREATE SCHEMA innovation;` | `\dn` shows both public and innovation |
| 0.4 | Create `updated_at` trigger function | Reusable function for all tables | Test with a dummy table |
| 0.5 | Create `status_changes` table | The audit log — needed from day 1 | INSERT a test row, verify structure |
| 0.6 | Create `ai_logs` table | AI call logging — needed from day 1 | INSERT a test row |
| 0.7 | Create `ai_tool_definitions` table | Dynamic AI tool registry (ADR-009) | INSERT a test tool definition |
| 0.8 | Test Supabase PostgREST access | Call the REST API from browser/Postman | Verify you can read/write via HTTP |
| 0.9 | Test n8n → Supabase connection | Create a simple n8n workflow that INSERTs into ai_logs | Verify the row appears in Supabase |
| 0.10 | Create GitHub repo `beacon-operations` | Initialize with folder structure | Repo exists, README is the System Context doc |
| 0.11 | Add System Context doc as README.md | The architecture reference for all AI/dev work | Claude Code can read the repo and understand the system |
| 0.12 | Add all architecture docs to repo | Schema, roadmap, implementation plan, ADRs | `docs/` folder populated |
| 0.13 | Install Supabase CLI locally | `npm install -g supabase` in VS Code terminal | `supabase --version` works |
| 0.14 | Link Supabase CLI to project | `supabase link --project-ref troftohnocgxcsvswhbo` | Can run `supabase functions deploy` |

**Duration:** 2-3 days
**Who:** Robin + Vincent
**Risk:** Low — we're just setting up infrastructure

**Migration 001 SQL:**
```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Innovation schema
CREATE SCHEMA IF NOT EXISTS innovation;

-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- status_changes (audit log)
CREATE TABLE status_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text NOT NULL,
  changed_by text,
  metadata jsonb,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_changes_entity ON status_changes (entity_type, entity_id);
CREATE INDEX idx_status_changes_lookup ON status_changes (entity_type, field_name, new_value);
CREATE INDEX idx_status_changes_time ON status_changes (changed_at);

-- ai_logs
CREATE TABLE ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL,
  model text,
  prompt_hash text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  input_summary text,
  output_summary text,
  entity_type text,
  entity_id uuid,
  quality_rating integer,
  feedback text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_logs_feature ON ai_logs (feature);
CREATE INDEX idx_ai_logs_time ON ai_logs (created_at);
CREATE INDEX idx_ai_logs_entity ON ai_logs (entity_type, entity_id);

-- ai_tool_definitions (ADR-009)
CREATE TABLE ai_tool_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL UNIQUE,
  description text NOT NULL,
  parameters_schema jsonb NOT NULL DEFAULT '{}',
  implementation_type text NOT NULL,
  implementation_config jsonb NOT NULL DEFAULT '{}',
  enabled boolean DEFAULT true,
  version integer DEFAULT 1,
  requires_auth boolean DEFAULT false,
  allowed_roles jsonb DEFAULT '["admin"]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tool_defs_enabled ON ai_tool_definitions (enabled);
CREATE INDEX idx_tool_defs_type ON ai_tool_definitions (implementation_type);
```

---

## Phase 1: Core CRM Tables (Weeks 2-3)
### Goal: Accounts, contacts, deals, and activities in the database

| Step | What | Depends on | Validation |
|------|------|------------|------------|
| 1.1 | Create `accounts` table | Phase 0 | INSERT 5 test accounts with full JSONB fields |
| 1.2 | Create `contacts` table | 1.1 (FK to accounts) | INSERT 10 test contacts, verify FK works |
| 1.3 | Create `deals` table | 1.1, 1.2 (FKs) | INSERT 3 test deals linked to accounts |
| 1.4 | Create `activities` table | 1.1, 1.2, 1.3 | INSERT 5 test activities |
| 1.5 | Add status_changes triggers | 1.1-1.4 | Update a deal stage, verify audit row created |
| 1.6 | Test JSONB queries | 1.1, 1.2 | Run matchmaking-style queries against test data |
| 1.7 | Load real data (batch 1) | 1.1-1.6 passing | Import 20 accounts from current Monday/Excel |
| 1.8 | Validate real data | 1.7 | Spot-check 5 accounts for correctness |

**Duration:** 2 weeks
**Data migration source:** Export from Monday.com boards via API or CSV export.

---

## Phase 2: Operations Tables (Week 4)
### Goal: Events, service deliveries, invoices, offices

Steps 2.1-2.8: Create events, event_attendees, service_deliveries, invoices, offices, tasks, okrs tables. Add status_changes triggers.

**Critical test: Pull-based task system priority score formula.**

---

## Phase 3: Communications & Intelligence (Week 5)
### Goal: Community news, trends, communications, social media

Steps 3.1-3.6: Create communications, social_media_posts, community_news, trends_intel, form_responses tables.

---

## Phase 4: Engagement Engine (Week 6)
### Goal: Engagement tracking, scoring, facility bookings

Steps 4.1-4.7: Create engagement_logs, engagement_scores, facility_bookings, renewal_reports, knowledge_base tables. Test engagement score calculation and 3-event rule.

---

## Phase 5: AI Infrastructure Tables (Week 7)
### Goal: Matchmaking, suggestions, email drafts, meeting intelligence

Steps 5.1-5.9: Create ai_suggestions, matchmaking_history, member_connections, match_suggestions, match_feedback, event_recommendations, email_drafts, meeting_briefings, meeting_summaries tables.

---

## Phase 6: Innovation Schema (Week 8)
### Goal: Innovation Maturity Platform tables

Steps 6.1-6.8: Create innovation.analyses, innovation.maturity_dimensions, innovation.ecosystem_matches, innovation.sessions, innovation.interactions, innovation.leads, innovation.conversations tables. Test cross-schema foreign keys.

---

## Phase 7: Competitive Intelligence & Presence (Week 9)
### Goal: External event monitoring and building presence tracking

Steps 7.1-7.8: Create competitors, external_events, external_event_analyses, competitive_landscape_reports, presence_log, presence_alerts, presence_preferences tables.

---

## Phase 8: Embedding Generation (Week 10)

Steps 8.1-8.7: Create embedding Edge Function, generate embeddings for accounts, contacts, events, and other tables. Test semantic search. Set up auto-embed trigger.

---

## Phase 9: First n8n Automations (Weeks 11-12)

| Step | Automation | AI cost |
|------|-----------|---------|
| 9.1 | Nexudus check-in → presence_log sync | €0 |
| 9.2 | Nexudus booking → facility_bookings sync | €0 |
| 9.3 | Nexudus event registration → event_attendees | €0 |
| 9.4 | Daily task priority recalculation | €0 |
| 9.5 | Monday pull-based board ↔ Supabase tasks sync | €0 |
| 9.6 | Renewal deal auto-creation (90 days) | €0 |
| 9.7 | Invoice overdue detection | €0 |
| 9.8 | Stale deal detection | €0 |

---

## Phase 10: First AI Capabilities (Weeks 13-14)

| Step | Automation | AI cost |
|------|-----------|---------|
| 10.1 | AI task scoring on new task creation | ~€0.02/task |
| 10.2 | Meeting briefing generation | ~€0.05/briefing |
| 10.3 | Meeting summary processing | ~€0.08/summary |
| 10.4 | Smart activity suggestions (daily) | ~€0.05/day |
| 10.5 | Feedback sentiment analysis | ~€0.005/response |
| 10.6 | Morning digest email/Slack | €0 |

**Quality gate:** Each AI capability gets 5 manual test runs before going to scheduled/automatic. Only capabilities averaging 4+/5 go live.

---

## Phase 11: Advanced AI (Weeks 15-18)

Community matchmaking, external event scanning, competitive analysis, newsletter compilation, social media generation, news monitoring, trend analysis, renewal reports, email writing assistant, predictive churn scoring.

---

## Phase 12: Innovation Platform Integration (Weeks 19-20)

Migrate Edge Functions from old Supabase project, connect to real accounts/events, set up lead auto-creation pipeline, deprecate old project.

---

## Timeline Overview

| Phase | What | Weeks | Cumulative |
|-------|------|-------|------------|
| 0 | Foundation setup | 1 | Week 1 |
| 1 | Core CRM | 2 | Week 3 |
| 2 | Operations | 1 | Week 4 |
| 3 | Communications & intelligence | 1 | Week 5 |
| 4 | Engagement engine | 1 | Week 6 |
| 5 | AI infrastructure tables | 1 | Week 7 |
| 6 | Innovation schema | 1 | Week 8 |
| 7 | Competitive intel & presence | 1 | Week 9 |
| 8 | Embedding generation | 0.5 | Week 10 |
| 9 | First n8n automations | 2 | Week 12 |
| 10 | First AI capabilities | 2 | Week 14 |
| 11 | Advanced AI | 4 | Week 18 |
| 12 | Innovation platform integration | 2 | Week 20 |

**Total: ~20 weeks (5 months) from start to full operational system.**

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data migration errors from Monday | Validate row counts + spot-checks. Keep Monday as fallback for 3 months. |
| n8n workflow breaks | All workflows have error handling. Alert on failure via Slack. |
| AI generates bad outputs | Quality gate: 5 manual test runs rated 4+ before going live. |
| Nexudus integration delays | Supabase works independently. Nexudus sync is additive. |
| Team adoption resistance | Monday remains the daily UI. Supabase is invisible. |

---

*The Beacon 2.0 Implementation Plan v1.0*
*April 2026 | Robin & Claude Architecture Lab*
