# The Beacon 2.0 — Supabase Database Schema
## Entity Relationship Diagram & Migration Reference
### Version 1.3 | April 2026

---

## Architecture Overview

This schema translates The Beacon's 21-board CRM architecture into a relational PostgreSQL database hosted on Supabase (`troftohnocgxcsvswhbo`, region: eu-west-1). It is designed for:

- **Matchmaking & filtering** via JSONB arrays with GIN indexes
- **Nexudus as the community/booking/event platform** (replacing Zapfloor + Eventbrite)
- **n8n as the integration orchestrator** between Supabase, Nexudus, Mailchimp, Salto KS
- **Supabase as the engagement data layer** for high-volume event tracking and analytics
- **Innovation Maturity Platform** integrated via `innovation` schema

### Design Principles

1. **Accounts are the central entity** — all revenue, engagement, and relationship data aggregates at the company level
2. **JSONB arrays for multi-select fields** — enables fast `@>` containment queries for matchmaking without junction table complexity
3. **Nexudus-ready** — `nexudus_id` fields on core entities for bidirectional sync
4. **Text-based owner fields** — with a 4-person team, `owner text` is simpler than a foreign key to a team table
5. **Soft deletes via `archived_at`** — no hard deletes on core entities
6. **Timestamps on everything** — `created_at` and `updated_at` on all tables
7. **Status history tracking** — `status_changes` audit table captures every transition
8. **Single database, two schemas** — `public` schema for CRM operations, `innovation` schema for the Innovation Maturity Platform

---

## Table Specifications

### 1. accounts

Central repository for all company relationships. ~200 member companies.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `name` | `text` | Company name |
| `vat_number` | `text` | VAT registration number |
| `website` | `text` | Company website URL |
| `description` | `text` | Free-text company description |
| `account_type` | `text` | `Tech Member` / `Industry Partner` / `Building Client` / `Ecosystem Partner` / `Prospect` / `Churned` |
| `membership_tier` | `text` | `Starter` / `Accelerator` / `Champion` / `Explore` / `Engage` / `Strategic` |
| `account_owner` | `text` | Team member responsible |
| `relationship_status` | `text` | Current relationship health indicator |
| `contract_start` | `date` | Contract start date |
| `renewal_date` | `date` | Next renewal date |
| `annual_value` | `numeric` | Annual contract value |
| `nexudus_id` | `bigint` | Nexudus coworker/organization ID for bidirectional sync |
| `archived_at` | `timestamptz` | Soft delete timestamp (null = active) |
| `created_at` | `timestamptz` | Row creation timestamp |
| `updated_at` | `timestamptz` | Last modification timestamp |

**JSONB matchmaking fields** (all with GIN indexes):

| Column | Example Values |
|--------|---------------|
| `technologies` | `["AI/ML", "IoT", "Blockchain"]` |
| `industry_verticals` | `["HealthTech", "FinTech", "CleanTech"]` |
| `community_goals` | `["Networking", "Talent", "Funding"]` |
| `international_ambitions` | `["EU Expansion", "US Market"]` |
| `pain_points` | `["Hiring", "Market Access", "Regulation"]` |
| `use_cases` | `["Predictive Maintenance", "Fraud Detection"]` |
| `offering_capabilities` | `["Cloud Infrastructure", "Data Analytics"]` |
| `collaboration_interests` | `["Joint R&D", "Pilot Projects"]` |
| `sdg_focus` | `["SDG 9", "SDG 11", "SDG 13"]` |
| `target_markets` | `["Belgium", "Netherlands", "DACH"]` |

**AI columns:**

| Column | Type | Notes |
|--------|------|-------|
| `embedding` | `vector(1536)` | OpenAI embedding for semantic search |
| `search_text` | `text` | Generated column combining key fields for full-text search |

---

### 2. contacts

All individuals The Beacon interacts with. ~600 contacts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_id` | `uuid` | FK → `accounts.id` |
| `full_name` | `text` | Display name |
| `first_name` | `text` | First name |
| `last_name` | `text` | Last name |
| `email` | `text` | Unique where not archived |
| `phone` | `text` | Phone number |
| `linkedin` | `text` | LinkedIn profile URL |
| `job_title` | `text` | Current job title |
| `function` | `text` | Business function (e.g., CTO, Marketing) |
| `decision_maker` | `boolean` | Whether this contact is a decision maker |
| `contact_group` | `text` | Grouping/segment |
| `source` | `text` | How this contact was acquired |
| `nexudus_id` | `bigint` | Nexudus coworker ID |
| `newsletter_optin` | `boolean` | Opted in to newsletter |
| `event_notifications` | `boolean` | Opted in to event notifications |
| `gdpr_consent_date` | `date` | Date GDPR consent was given |
| `archived_at` | `timestamptz` | Soft delete timestamp |

**JSONB matchmaking fields:**

| Column | Example Values |
|--------|---------------|
| `tech_interests` | `["AI/ML", "Cloud Native"]` |
| `industry_focus` | `["HealthTech", "FinTech"]` |
| `skills` | `["Python", "Product Management"]` |
| `looking_for` | `["Co-founder", "Investors"]` |
| `offering` | `["Mentorship", "Technical Expertise"]` |
| `event_topic_interests` | `["AI Ethics", "Fundraising"]` |

**AI columns:**

| Column | Type | Notes |
|--------|------|-------|
| `embedding` | `vector(1536)` | OpenAI embedding for semantic search |
| `search_text` | `text` | Generated column for full-text search |

---

### 3. deals

Unified sales pipeline across all 4 revenue streams.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Deal name |
| `deal_type` | `text` | `Tech Membership` / `Industry Partnership` / `A La Carte` / `Building\|Facility` / `Renewal` |
| `stage` | `text` | `New Lead` → `Discovery` → `Meeting Scheduled` → `Meeting Completed` → `Proposal Sent` → `Negotiation` → `Contract Sent` → `Won` / `Lost` / `On Hold` |
| `deal_value` | `numeric` | Total deal value |
| `probability` | `integer` | Win probability percentage |
| `weighted_value` | `numeric` | `deal_value * probability / 100` |
| `expected_close` | `date` | Expected close date |
| `actual_close` | `date` | Actual close date |
| `stage_entered_at` | `timestamptz` | When the current stage was entered |
| `loss_reason` | `text` | Reason for lost deals |
| `deal_owner` | `text` | Team member responsible |
| `account_id` | `uuid` | FK → `accounts.id` |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `specific_product` | `text` | Product/service being sold |
| `pain_points_addressed` | `jsonb` | JSONB array of pain points this deal addresses |

**AI columns:**

| Column | Type | Notes |
|--------|------|-------|
| `predicted_close_date` | `date` | AI-predicted close date |
| `win_probability_ai` | `numeric` | AI-calculated win probability |

---

### 4. activities

Log of all interactions with accounts and contacts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `title` | `text` | Activity title |
| `activity_type` | `text` | Type of activity (meeting, call, email, etc.) |
| `activity_date` | `timestamptz` | When the activity occurred |
| `duration_minutes` | `integer` | Duration in minutes |
| `description` | `text` | Activity description/notes |
| `outcome` | `text` | Outcome of the activity |
| `follow_up_required` | `boolean` | Whether follow-up is needed |
| `follow_up_date` | `date` | When follow-up should happen |
| `follow_up_owner` | `text` | Who should follow up |
| `owner` | `text` | Who performed the activity |
| `account_id` | `uuid` | FK → `accounts.id` |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `deal_id` | `uuid` | FK → `deals.id` |

---

### 5. events

All Beacon events — from planning through post-event analysis.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Event name |
| `event_type` | `text` | Type of event |
| `event_date` | `timestamptz` | Event start date/time |
| `end_time` | `timestamptz` | Event end date/time |
| `location` | `text` | Event location |
| `capacity` | `integer` | Maximum capacity |
| `registrations` | `integer` | Number of registrations |
| `actual_attendees` | `integer` | Actual attendance count |
| `status` | `text` | Event status |
| `event_owner` | `text` | Team member responsible |
| `budget` | `numeric` | Planned budget |
| `actual_cost` | `numeric` | Actual cost |
| `nps_score` | `numeric` | Net Promoter Score |
| `nexudus_event_id` | `bigint` | Nexudus event ID for sync |
| `sponsor_account_id` | `uuid` | FK → `accounts.id` (sponsoring company) |

**JSONB fields:**

| Column | Example Values |
|--------|---------------|
| `target_audience` | `["Tech Members", "Industry Partners"]` |
| `industry_focus` | `["HealthTech", "AI"]` |
| `topics` | `["Fundraising", "Product-Market Fit"]` |

---

### 6. event_attendees

Individual attendance records synced from Nexudus.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `event_id` | `uuid` | FK → `events.id` |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `account_id` | `uuid` | FK → `accounts.id` |
| `nexudus_attendee_id` | `bigint` | Nexudus attendee record ID |
| `attendee_email` | `text` | Email used for registration |
| `checked_in` | `boolean` | Whether the attendee checked in |
| `checkin_time` | `timestamptz` | Actual check-in time |
| `processed` | `boolean` | Whether this record has been processed by engagement scoring |

---

### 7. service_deliveries

Track delivery of sold services.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Service delivery name |
| `service_type` | `text` | Type of service |
| `status` | `text` | Delivery status |
| `scheduled_date` | `date` | Planned delivery date |
| `completed_date` | `date` | Actual completion date |
| `satisfaction_score` | `integer` | Client satisfaction (1-5) |
| `account_id` | `uuid` | FK → `accounts.id` |
| `deal_id` | `uuid` | FK → `deals.id` |

---

### 8. invoices

Invoice tracking with payment status.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `reference` | `text` | Invoice reference (format: `INV-YYYY-XXX`) |
| `invoice_date` | `date` | Date of invoice |
| `due_date` | `date` | Payment due date |
| `amount` | `numeric` | Invoice amount |
| `vat_rate` | `numeric` | VAT percentage |
| `status` | `text` | Payment status |
| `payment_date` | `date` | Date payment was received |
| `reminder_sent` | `boolean` | Whether a payment reminder has been sent |
| `account_id` | `uuid` | FK → `accounts.id` |
| `deal_id` | `uuid` | FK → `deals.id` |
| `office_id` | `uuid` | FK → `offices.id` |

---

### 9. offices

Office space inventory and tenant tracking.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `office_number` | `text` | Unique office identifier |
| `office_type` | `text` | Type of office space |
| `floor` | `integer` | Floor number |
| `net_surface_m2` | `numeric` | Net surface area in square meters |
| `desk_capacity` | `integer` | Number of desks |
| `status` | `text` | Availability status |
| `tenant_account_id` | `uuid` | FK → `accounts.id` (current tenant) |
| `contract_start` | `date` | Tenant contract start |
| `contract_end` | `date` | Tenant contract end |
| `base_rent` | `numeric` | Base monthly rent |
| `indexed_rent` | `numeric` | Indexed monthly rent |
| `nexudus_resource_id` | `bigint` | Nexudus resource ID |
| `amenities` | `jsonb` | JSONB array of amenities |

---

### 10. communications

Newsletter and campaign planning.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `title` | `text` | Communication title |
| `comm_type` | `text` | Type of communication |
| `scheduled_date` | `timestamptz` | Planned send date |
| `sent_date` | `timestamptz` | Actual send date |
| `status` | `text` | Communication status |
| `owner` | `text` | Team member responsible |
| `mailchimp_campaign_id` | `text` | Mailchimp campaign ID for sync |
| `opens` | `integer` | Number of opens |
| `clicks` | `integer` | Number of clicks |
| `event_id` | `uuid` | FK → `events.id` |
| `channels` | `jsonb` | JSONB array of distribution channels |
| `target_audience` | `jsonb` | JSONB array of target audience segments |

**AI columns:**

| Column | Type | Notes |
|--------|------|-------|
| `ai_generated` | `boolean` | Whether content was AI-generated |
| `ai_prompt_version` | `text` | Version of the AI prompt used |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |

---

### 11. social_media_posts

Individual social media post planning and performance.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `title` | `text` | Post title |
| `platform` | `text` | Social media platform |
| `post_type` | `text` | Type of post |
| `content_category` | `text` | Content category |
| `caption` | `text` | Post caption/body |
| `scheduled_date` | `timestamptz` | Planned publish date |
| `status` | `text` | Post status |
| `campaign_id` | `uuid` | FK → `communications.id` |
| `event_id` | `uuid` | FK → `events.id` |
| `impressions` | `integer` | Number of impressions |
| `likes` | `integer` | Number of likes |
| `comments_count` | `integer` | Number of comments |
| `shares` | `integer` | Number of shares |

---

### 12. community_news

Member company news and achievements.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `headline` | `text` | News headline |
| `news_type` | `text` | Type of news |
| `priority` | `text` | Priority level |
| `description` | `text` | Full news description |
| `source_url` | `text` | Original source URL |
| `share_approved` | `boolean` | Whether approved for sharing |
| `status` | `text` | News item status |
| `account_id` | `uuid` | FK → `accounts.id` |
| `use_in_newsletter` | `boolean` | Flag for newsletter inclusion |
| `use_in_social` | `boolean` | Flag for social media inclusion |

---

### 13. trends_intel

Industry trends and technology developments.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Trend name |
| `industry` | `text` | Related industry |
| `category` | `text` | Trend category |
| `relevance_score` | `integer` | Relevance to The Beacon community (1-5) |
| `stage` | `text` | Trend maturity stage |
| `description` | `text` | Trend description |
| `beacon_opportunity` | `text` | How The Beacon can leverage this trend |
| `signals` | `jsonb` | JSONB array of trend signals |
| `member_relevance` | `jsonb` | JSONB mapping of relevant members |

---

### 14. form_responses

Centralized feedback collection.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `form_type` | `text` | Type of form (NPS, onboarding, event feedback, etc.) |
| `response_data` | `jsonb` | Full form response as JSONB |
| `sentiment` | `text` | Detected sentiment |
| `overall_rating` | `integer` | Overall rating score |
| `nps_score` | `integer` | Net Promoter Score (0-10) |
| `action_status` | `text` | Status of any follow-up action |
| `priority` | `text` | Priority level |
| `commercial_opportunity` | `text` | Identified commercial opportunity |
| `account_id` | `uuid` | FK → `accounts.id` |
| `event_id` | `uuid` | FK → `events.id` |

---

### 15. tasks

Pull-based workflow with 8-dimension priority scoring.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `title` | `text` | Task title |
| `task_type` | `text` | Type of task |
| `zone` | `text` | `active` / `ready_to_pull` / `to_delegate` / `to_prioritize` / `done` / `on_hold` |
| `project` | `text` | Associated project |
| `work_grade` | `text` | `Deep Work` / `Shallow Work` |
| `due_date` | `date` | Task due date |
| `assignee` | `text` | Assigned team member |
| `parent_task_id` | `uuid` | FK → `tasks.id` (self-referencing for subtasks) |
| `depends_on_task_id` | `uuid` | FK → `tasks.id` (self-referencing for dependencies) |
| `estimated_minutes` | `integer` | Estimated time to complete |
| `actual_minutes` | `integer` | Actual time spent |
| `scheduled_start` | `timestamptz` | Scheduled start time |
| `completed_at` | `timestamptz` | Completion timestamp |
| `source` | `text` | Where this task originated |
| `monday_item_id` | `text` | Monday.com item ID (migration reference) |
| `account_id` | `uuid` | FK → `accounts.id` |
| `deal_id` | `uuid` | FK → `deals.id` |
| `event_id` | `uuid` | FK → `events.id` |
| `okr_id` | `uuid` | FK → `okrs.id` |

**Priority score dimensions:**

| Dimension | Column | Weight | Description |
|-----------|--------|--------|-------------|
| Impact | `score_impact` | x2.0 | Business impact of the task |
| Urgency | `score_urgency` | x1.8 | Time sensitivity |
| Leverage | `score_leverage` | x1.5 | Force multiplier potential |
| Energy | `score_energy` | x1.5 | Energy level match |
| Goals | `score_goals` | x1.2 | OKR alignment |
| Risk | `score_risk` | x1.0 | Risk of not doing it |
| Motivation | `score_motivation` | x0.8 | Personal motivation factor |
| Frequency | `score_frequency` | x0.7 | Recurrence value |
| Time | `score_time` | x-1.0 | Time cost (negative weight) |

**Priority score formula:**

```
priority_score = (score_impact * 2.0) + (score_urgency * 1.8) + (score_leverage * 1.5)
               + (score_energy * 1.5) + (score_goals * 1.2) + (score_risk * 1.0)
               + (score_motivation * 0.8) + (score_frequency * 0.7) + (score_time * -1.0)
               + deadline_boost
```

Where `deadline_boost = +20` when `due_date < 7 days from now`.

---

### 16. okrs

Company-level objectives and key results.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `objective` | `text` | Objective statement |
| `key_result` | `text` | Key result description |
| `target_value` | `numeric` | Target metric value |
| `current_value` | `numeric` | Current metric value |
| `quarter` | `text` | Quarter (e.g., Q2 2026) |
| `status` | `text` | OKR status |
| `owner` | `text` | Responsible team member |

---

### 17. engagement_logs

Raw engagement touchpoints. Points are assigned per interaction type.

| Engagement Type | Points |
|----------------|--------|
| `event_attended` | 10 |
| `coworking_day` | 2 |
| `meeting_room_booking` | 3 |
| `introduction_received` | 15 |
| `referral_given` | 30 |

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_id` | `uuid` | FK → `accounts.id` |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `engagement_type` | `text` | Type of engagement |
| `points` | `integer` | Points awarded |
| `source` | `text` | Data source (Nexudus, manual, etc.) |
| `metadata` | `jsonb` | Additional context |
| `created_at` | `timestamptz` | When the engagement occurred |

---

### 18. engagement_scores

Calculated health per account.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_id` | `uuid` | FK → `accounts.id` (unique) |
| `total_score` | `numeric` | Aggregate engagement score |
| `health_status` | `text` | `Healthy` (>= 80) / `At Risk` (40-79) / `Critical` (< 40) |
| `events_attended_90d` | `integer` | Events attended in last 90 days (tracks 3-event rule) |
| `last_interaction` | `timestamptz` | Most recent engagement |
| `calculated_at` | `timestamptz` | When this score was last calculated |

---

### 19. facility_bookings

Bookings synced from Nexudus.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `nexudus_booking_id` | `bigint` | Nexudus booking ID |
| `account_id` | `uuid` | FK → `accounts.id` |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `resource_name` | `text` | Booked resource name |
| `booking_start` | `timestamptz` | Booking start time |
| `booking_end` | `timestamptz` | Booking end time |
| `status` | `text` | Booking status |

---

### 20. renewal_reports

AI-generated renewal preparation briefs.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_id` | `uuid` | FK → `accounts.id` |
| `renewal_date` | `date` | Target renewal date |
| `report_data` | `jsonb` | Full AI-generated renewal brief |
| `engagement_summary` | `text` | Engagement summary narrative |
| `risk_factors` | `jsonb` | Identified risk factors |
| `recommendations` | `jsonb` | AI recommendations |
| `generated_at` | `timestamptz` | When the report was generated |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |

---

### 21. knowledge_base

Community resources, case studies, templates.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `title` | `text` | Resource title |
| `content_type` | `text` | Type of content (case study, template, guide, etc.) |
| `content` | `text` | Full content body |
| `tags` | `jsonb` | JSONB array of tags |
| `embedding` | `vector(1536)` | OpenAI embedding for semantic search |
| `created_at` | `timestamptz` | Creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

---

### 22. status_changes (Audit Log)

Tracks every status/stage transition across all entities.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `entity_type` | `text` | Table name (e.g., `deals`, `accounts`) |
| `entity_id` | `uuid` | ID of the changed entity |
| `field_name` | `text` | Field that changed (e.g., `stage`, `status`) |
| `old_value` | `text` | Previous value |
| `new_value` | `text` | New value |
| `changed_by` | `text` | Who made the change |
| `metadata` | `jsonb` | Additional context (e.g., reason, trigger source) |
| `changed_at` | `timestamptz` | When the change occurred |

---

## AI Infrastructure Tables

### ai_logs

Universal LLM call logging.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `function_name` | `text` | Name of the AI function called |
| `model` | `text` | LLM model used |
| `prompt_tokens` | `integer` | Input token count |
| `completion_tokens` | `integer` | Output token count |
| `total_tokens` | `integer` | Total token count |
| `cost_estimate` | `numeric` | Estimated cost in USD |
| `latency_ms` | `integer` | Response time in milliseconds |
| `input_summary` | `text` | Summary of input |
| `output_summary` | `text` | Summary of output |
| `error` | `text` | Error message if failed |
| `metadata` | `jsonb` | Additional context |
| `created_at` | `timestamptz` | When the call was made |

### ai_suggestions

AI-generated action items for team members.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `suggestion_type` | `text` | Type of suggestion |
| `title` | `text` | Suggestion title |
| `description` | `text` | Detailed suggestion |
| `priority` | `text` | Priority level |
| `assignee` | `text` | Suggested team member |
| `entity_type` | `text` | Related entity type |
| `entity_id` | `uuid` | Related entity ID |
| `status` | `text` | `pending` / `accepted` / `dismissed` |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |
| `created_at` | `timestamptz` | When the suggestion was generated |

### ai_tool_definitions (ADR-009)

Dynamic AI tool registry.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `tool_name` | `text` | Unique tool name |
| `description` | `text` | Human-readable description |
| `parameters_schema` | `jsonb` | JSON Schema for tool parameters |
| `implementation_type` | `text` | `sql_query` / `edge_function` / `n8n_webhook` / `rest_api` |
| `implementation_config` | `jsonb` | Configuration for the implementation |
| `enabled` | `boolean` | Whether the tool is active |
| `version` | `integer` | Tool version number |
| `created_at` | `timestamptz` | Creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

---

## Matchmaking & Social Graph Tables

### matchmaking_history

Tracks every introduction with outcomes.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_a_id` | `uuid` | FK → `accounts.id` |
| `account_b_id` | `uuid` | FK → `accounts.id` |
| `match_type` | `text` | Type of match (technology, market, collaboration) |
| `match_score` | `numeric` | Algorithm-calculated match score |
| `introduced_by` | `text` | Team member who made the introduction |
| `introduced_at` | `timestamptz` | When the introduction was made |
| `outcome` | `text` | Result of the introduction |
| `outcome_date` | `date` | When outcome was recorded |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |

### member_connections

Member-to-member social graph.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_a_id` | `uuid` | FK → `accounts.id` |
| `account_b_id` | `uuid` | FK → `accounts.id` |
| `connection_type` | `text` | Type of connection |
| `strength` | `numeric` | Connection strength score |
| `created_at` | `timestamptz` | When the connection was first recorded |

### match_suggestions

AI-generated weekly match suggestions per member. Multi-signal scoring.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_id` | `uuid` | FK → `accounts.id` (the member receiving suggestions) |
| `suggested_account_id` | `uuid` | FK → `accounts.id` (the suggested match) |
| `match_score` | `numeric` | Multi-signal match score |
| `match_reasons` | `jsonb` | Array of reasons for the match |
| `status` | `text` | `pending` / `accepted` / `rejected` |
| `week_of` | `date` | Week the suggestion was generated for |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |
| `created_at` | `timestamptz` | Generation timestamp |

### match_feedback

Explicit quality ratings from members.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `match_suggestion_id` | `uuid` | FK → `match_suggestions.id` |
| `rating` | `integer` | Quality rating (1-5) |
| `feedback_text` | `text` | Free-text feedback |
| `created_at` | `timestamptz` | When feedback was given |

### event_recommendations

Per-event contact targeting with conversion tracking.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `event_id` | `uuid` | FK → `events.id` |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `recommendation_score` | `numeric` | Relevance score |
| `reasons` | `jsonb` | Why this contact was recommended |
| `invited` | `boolean` | Whether the contact was invited |
| `registered` | `boolean` | Whether the contact registered |
| `attended` | `boolean` | Whether the contact attended |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |

---

## AI Content & Meeting Tables

### email_drafts

AI email drafts with edit tracking for style learning.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `subject` | `text` | Email subject line |
| `body` | `text` | Email body |
| `tone` | `text` | Requested tone |
| `context` | `jsonb` | Context provided to the AI |
| `edited_body` | `text` | Human-edited version |
| `edit_distance` | `numeric` | Measure of how much was changed |
| `sent` | `boolean` | Whether the email was sent |
| `account_id` | `uuid` | FK → `accounts.id` |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |
| `created_at` | `timestamptz` | When the draft was generated |

### meeting_briefings

Pre-meeting executive summaries. 4-layer data gathering.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `account_id` | `uuid` | FK → `accounts.id` |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `meeting_date` | `date` | Date of the meeting |
| `briefing_content` | `jsonb` | Structured briefing data (4-layer) |
| `summary` | `text` | Executive summary |
| `talking_points` | `jsonb` | Suggested talking points |
| `risks` | `jsonb` | Identified risks |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |
| `created_at` | `timestamptz` | When the briefing was generated |

### meeting_summaries

Post-meeting AI processing with auto-action creation.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `activity_id` | `uuid` | FK → `activities.id` |
| `account_id` | `uuid` | FK → `accounts.id` |
| `raw_transcript` | `text` | Raw meeting transcript |
| `summary` | `text` | AI-generated summary |
| `key_decisions` | `jsonb` | Decisions made |
| `action_items` | `jsonb` | Extracted action items |
| `sentiment` | `text` | Meeting sentiment analysis |
| `embedding` | `vector(1536)` | Embedding for semantic search |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |
| `created_at` | `timestamptz` | When the summary was generated |

---

## Innovation Schema (`innovation.*`)

### innovation.analyses

Core analysis — one row per company. Links to `public.accounts`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `company_name` | `text` | Analyzed company name |
| `account_id` | `uuid` | FK → `public.accounts.id` (nullable, linked post-analysis) |
| `analysis_data` | `jsonb` | Full analysis results |
| `maturity_score` | `numeric` | Overall maturity score |
| `embedding` | `vector(1536)` | Embedding for ecosystem matching |
| `created_at` | `timestamptz` | When the analysis was performed |

### innovation.maturity_dimensions

5 dimensions of innovation maturity assessment.

| Dimension | Description |
|-----------|-------------|
| R&D Investment | Research and development spending and strategy |
| Product/Service Innovation | New product/service development pipeline |
| Digital Transformation | Digital maturity and transformation progress |
| External Partnerships | Collaboration and open innovation activity |
| Market Leadership/Vision | Market positioning and strategic vision |

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `analysis_id` | `uuid` | FK → `innovation.analyses.id` |
| `dimension` | `text` | Dimension name |
| `score` | `numeric` | Dimension score |
| `evidence` | `jsonb` | Supporting evidence |

### innovation.ecosystem_matches

6 matches per analysis linking to real `public.accounts` members.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `analysis_id` | `uuid` | FK → `innovation.analyses.id` |
| `matched_account_id` | `uuid` | FK → `public.accounts.id` |
| `match_score` | `numeric` | Match quality score |
| `match_reasons` | `jsonb` | Reasons for the match |
| `rank` | `integer` | Match rank (1-6) |

### innovation.sessions

Anonymous session tracking.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `session_token` | `text` | Anonymous session identifier |
| `started_at` | `timestamptz` | Session start |
| `last_active_at` | `timestamptz` | Last activity timestamp |
| `metadata` | `jsonb` | Session metadata (UTM params, referrer, etc.) |

### innovation.interactions

Behavioral events per session.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `session_id` | `uuid` | FK → `innovation.sessions.id` |
| `interaction_type` | `text` | Type of interaction |
| `interaction_data` | `jsonb` | Event-specific data |
| `created_at` | `timestamptz` | When the interaction occurred |

### innovation.leads

Captured leads — auto-creates contact + deal in `public` schema.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `analysis_id` | `uuid` | FK → `innovation.analyses.id` |
| `session_id` | `uuid` | FK → `innovation.sessions.id` |
| `email` | `text` | Lead email |
| `company_name` | `text` | Lead company name |
| `contact_name` | `text` | Lead contact name |
| `synced_contact_id` | `uuid` | FK → `public.contacts.id` (created on sync) |
| `synced_deal_id` | `uuid` | FK → `public.deals.id` (created on sync) |
| `created_at` | `timestamptz` | When the lead was captured |

### innovation.conversations

Chat messages with platform chatbot.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `session_id` | `uuid` | FK → `innovation.sessions.id` |
| `role` | `text` | `user` / `assistant` |
| `content` | `text` | Message content |
| `metadata` | `jsonb` | Additional message metadata |
| `created_at` | `timestamptz` | Message timestamp |

---

## Competitive Intelligence Tables

### competitors

Registry of organizations to monitor.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Competitor name |
| `website` | `text` | Competitor website |
| `description` | `text` | Competitor description |
| `competitor_type` | `text` | Type of competitor |
| `strengths` | `jsonb` | Known strengths |
| `weaknesses` | `jsonb` | Known weaknesses |
| `monitoring_priority` | `text` | Monitoring priority level |
| `created_at` | `timestamptz` | Creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

### external_events

Events discovered in the ecosystem.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Event name |
| `organizer` | `text` | Event organizer |
| `event_date` | `timestamptz` | Event date |
| `location` | `text` | Event location |
| `description` | `text` | Event description |
| `url` | `text` | Event URL |
| `relevance_score` | `integer` | Relevance to The Beacon (1-5) |
| `competitor_id` | `uuid` | FK → `competitors.id` (nullable) |
| `created_at` | `timestamptz` | Discovery timestamp |

### external_event_analyses

Post-event competitive assessments.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `external_event_id` | `uuid` | FK → `external_events.id` |
| `analysis` | `text` | Assessment narrative |
| `key_takeaways` | `jsonb` | Key takeaways |
| `threats` | `jsonb` | Identified threats |
| `opportunities` | `jsonb` | Identified opportunities |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |
| `created_at` | `timestamptz` | Analysis timestamp |

### competitive_landscape_reports

Monthly/quarterly strategic synthesis.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `report_period` | `text` | Period covered (e.g., "Q1 2026", "March 2026") |
| `report_type` | `text` | `monthly` / `quarterly` |
| `summary` | `text` | Executive summary |
| `market_trends` | `jsonb` | Observed market trends |
| `competitive_moves` | `jsonb` | Competitor actions |
| `recommendations` | `jsonb` | Strategic recommendations |
| `ai_log_id` | `uuid` | FK → `ai_logs.id` |
| `created_at` | `timestamptz` | Report generation timestamp |

---

## Presence & Networking Tables

### presence_log

Check-in/check-out records from Nexudus.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `contact_id` | `uuid` | FK → `contacts.id` |
| `account_id` | `uuid` | FK → `accounts.id` |
| `nexudus_checkin_id` | `bigint` | Nexudus check-in record ID |
| `checked_in_at` | `timestamptz` | Check-in time |
| `checked_out_at` | `timestamptz` | Check-out time |
| `location` | `text` | Building/floor location |

### presence_alerts

AI networking notifications.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `contact_id` | `uuid` | FK → `contacts.id` (the person being notified) |
| `present_contact_id` | `uuid` | FK → `contacts.id` (the person who is present) |
| `alert_type` | `text` | Type of networking alert |
| `reason` | `text` | Why this alert was generated |
| `sent` | `boolean` | Whether the alert was sent |
| `clicked` | `boolean` | Whether the alert was acted on |
| `created_at` | `timestamptz` | Alert creation timestamp |

### presence_preferences

Per-member privacy settings (GDPR opt-in).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `contact_id` | `uuid` | FK → `contacts.id` (unique) |
| `visible_to_community` | `boolean` | Whether presence is visible to other members |
| `receive_networking_alerts` | `boolean` | Whether to receive networking notifications |
| `gdpr_consent_date` | `date` | Date of GDPR consent for presence features |
| `updated_at` | `timestamptz` | Last preference update |

---

## Embedding Columns

The following tables include an `embedding vector(1536)` column for semantic search and AI-powered matching via OpenAI embeddings:

| Table | Use Case |
|-------|----------|
| `accounts` | Account matchmaking and semantic search |
| `contacts` | Contact discovery and skill matching |
| `events` | Event recommendation and similarity |
| `community_news` | News relevance and clustering |
| `trends_intel` | Trend similarity and member relevance |
| `knowledge_base` | Semantic document search |
| `innovation.analyses` | Ecosystem matching for analyzed companies |
| `meeting_summaries` | Meeting context retrieval |

All embeddings use the `pgvector` extension with cosine similarity for nearest-neighbor queries.

---

## Migration Phases

### Phase 1: Foundation + AI Infrastructure
- `accounts`, `contacts`, `deals`, `activities`, `events`, `status_changes`, `ai_logs`
- Core foreign keys and GIN indexes on JSONB matchmaking fields
- `pgvector` extension enabled

### Phase 2: Operations
- `communications`, `social_media_posts`, `community_news`, `trends_intel`, `tasks`, `okrs`
- `form_responses`, `invoices`, `offices`, `service_deliveries`

### Phase 3: Engagement Engine + AI Matching
- `engagement_logs`, `engagement_scores`, `event_attendees`, `facility_bookings`
- `matchmaking_history`, `member_connections`, `match_suggestions`, `match_feedback`
- `event_recommendations`, `email_drafts`, `meeting_briefings`, `meeting_summaries`
- `ai_suggestions`, `ai_tool_definitions`

### Phase 4: Innovation Schema
- `innovation.analyses`, `innovation.maturity_dimensions`, `innovation.ecosystem_matches`
- `innovation.sessions`, `innovation.interactions`, `innovation.leads`, `innovation.conversations`

### Phase 5: Triggers, Views & Functions
- Status change triggers → `status_changes` audit log
- Engagement score recalculation triggers
- Materialized views for dashboards
- Edge functions for AI workflows

### Phase 6: Security & Realtime
- Row Level Security (RLS) policies
- Supabase Realtime subscriptions for live dashboards
- API key scoping for n8n and edge functions
- Competitive intelligence tables
- Presence & networking tables

---

*The Beacon 2.0 Supabase Schema v1.3 | April 2026*
*Maintained by: Robin & Claude Architecture Lab*
