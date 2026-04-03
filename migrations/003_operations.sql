-- Migration 003: Operations Tables
-- Applied: 2026-04-03 (versions 20260403130820 through 20260403130928)
-- Creates: events, event_attendees, service_deliveries, invoices, offices,
--          communications, social_media_posts, community_news, trends_intel,
--          form_responses, okrs, tasks
-- Note: Applied as 4 separate migrations via Supabase MCP

-- ============================================================
-- 003a: events + event_attendees
-- ============================================================
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL,
  event_date timestamptz NOT NULL,
  end_time timestamptz,
  location text,
  target_audience jsonb DEFAULT '[]',
  industry_focus jsonb DEFAULT '[]',
  topics jsonb DEFAULT '[]',
  capacity integer,
  registrations integer DEFAULT 0,
  actual_attendees integer,
  status text NOT NULL DEFAULT 'Idea',
  event_owner text,
  budget numeric(10,2),
  actual_cost numeric(10,2),
  nps_score integer,
  description text,
  post_event_notes text,
  nexudus_event_id text,
  registration_url text,
  sponsor_account_id uuid REFERENCES accounts(id),
  search_text text GENERATED ALWAYS AS (
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(event_type, '') || ' ' ||
    coalesce(industry_focus::text, '') || ' ' ||
    coalesce(target_audience::text, '')
  ) STORED,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_date ON events (event_date);
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_events_nexudus ON events (nexudus_event_id);
CREATE INDEX idx_events_audience ON events USING GIN (target_audience);
CREATE INDEX idx_events_industry ON events USING GIN (industry_focus);
CREATE INDEX idx_events_topics ON events USING GIN (topics);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id),
  contact_id uuid REFERENCES contacts(id),
  account_id uuid REFERENCES accounts(id),
  nexudus_attendee_id text,
  attendee_email text,
  attendee_name text,
  registration_date timestamptz,
  checked_in boolean DEFAULT false,
  checkin_time timestamptz,
  ticket_type text,
  processed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendees_event ON event_attendees (event_id);
CREATE INDEX idx_attendees_contact ON event_attendees (contact_id);
CREATE INDEX idx_attendees_account ON event_attendees (account_id);
CREATE UNIQUE INDEX idx_attendees_dedup ON event_attendees (event_id, attendee_email);
CREATE INDEX idx_attendees_unprocessed ON event_attendees (processed) WHERE processed = false;

-- ============================================================
-- 003b: service_deliveries, invoices, offices
-- ============================================================
CREATE TABLE service_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  service_type text NOT NULL,
  status text NOT NULL DEFAULT 'Not Started',
  scheduled_date date,
  completed_date date,
  satisfaction_score integer,
  feedback text,
  deliverables text,
  owner text,
  account_id uuid NOT NULL REFERENCES accounts(id),
  deal_id uuid REFERENCES deals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_account ON service_deliveries (account_id);
CREATE INDEX idx_service_deal ON service_deliveries (deal_id);
CREATE INDEX idx_service_status ON service_deliveries (status);

CREATE TRIGGER trg_service_updated_at
  BEFORE UPDATE ON service_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  amount numeric(10,2) NOT NULL,
  vat_rate numeric(4,2) DEFAULT 21.00,
  status text NOT NULL DEFAULT 'Draft',
  payment_date date,
  payment_method text,
  reminder_sent boolean DEFAULT false,
  reminder_2_sent boolean DEFAULT false,
  notes text,
  account_id uuid NOT NULL REFERENCES accounts(id),
  deal_id uuid REFERENCES deals(id),
  office_id uuid,
  billing_contact_id uuid REFERENCES contacts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_invoices_ref ON invoices (reference);
CREATE INDEX idx_invoices_account ON invoices (account_id);
CREATE INDEX idx_invoices_status ON invoices (status);
CREATE INDEX idx_invoices_due ON invoices (due_date);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_number text NOT NULL,
  office_type text NOT NULL,
  floor text NOT NULL,
  net_surface_m2 numeric(6,2),
  desk_capacity integer,
  status text NOT NULL DEFAULT 'Available',
  amenities jsonb DEFAULT '[]',
  tenant_account_id uuid REFERENCES accounts(id),
  tenant_contact_id uuid REFERENCES contacts(id),
  contract_start date,
  contract_end date,
  notice_period_days integer DEFAULT 90,
  base_rent numeric(10,2),
  indexed_rent numeric(10,2),
  provisions numeric(10,2),
  deposit_amount numeric(10,2),
  deposit_status text,
  payment_method text,
  badges_issued integer DEFAULT 0,
  badge_numbers text,
  contract_file_url text,
  notes text,
  nexudus_resource_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_offices_number ON offices (office_number);
CREATE INDEX idx_offices_status ON offices (status);
CREATE INDEX idx_offices_tenant ON offices (tenant_account_id);
CREATE INDEX idx_offices_contract ON offices (contract_end);

CREATE TRIGGER trg_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add FK from invoices to offices (offices created after invoices)
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_office FOREIGN KEY (office_id) REFERENCES offices(id);

-- ============================================================
-- 003c: communications, social_media_posts, community_news, trends_intel, form_responses
-- ============================================================
CREATE TABLE communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  comm_type text NOT NULL,
  channels jsonb DEFAULT '[]',
  target_audience jsonb DEFAULT '[]',
  scheduled_date date,
  sent_date date,
  status text NOT NULL DEFAULT 'Idea',
  owner text,
  reviewer text,
  content_brief text,
  content_draft text,
  mailchimp_campaign_id text,
  opens integer,
  clicks integer,
  unsubscribes integer,
  event_id uuid REFERENCES events(id),
  notes text,
  ai_generated boolean DEFAULT false,
  ai_prompt_version text,
  ai_log_id uuid REFERENCES ai_logs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comms_scheduled ON communications (scheduled_date);
CREATE INDEX idx_comms_status ON communications (status);
CREATE INDEX idx_comms_event ON communications (event_id);
CREATE INDEX idx_comms_audience ON communications USING GIN (target_audience);

CREATE TRIGGER trg_comms_updated_at
  BEFORE UPDATE ON communications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE social_media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  platform text NOT NULL,
  post_type text,
  content_category text,
  caption text,
  hashtags text,
  link text,
  scheduled_date date,
  scheduled_time time,
  status text NOT NULL DEFAULT 'Idea',
  owner text,
  campaign_id uuid REFERENCES communications(id),
  event_id uuid REFERENCES events(id),
  buffer_id text,
  post_url text,
  impressions integer,
  likes integer,
  comments_count integer,
  shares integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_platform ON social_media_posts (platform);
CREATE INDEX idx_social_scheduled ON social_media_posts (scheduled_date);
CREATE INDEX idx_social_status ON social_media_posts (status);
CREATE INDEX idx_social_campaign ON social_media_posts (campaign_id);

CREATE TRIGGER trg_social_updated_at
  BEFORE UPDATE ON social_media_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE community_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  news_type text,
  priority text DEFAULT 'Normal',
  description text,
  source_url text,
  share_approved boolean DEFAULT false,
  quotable_text text,
  status text NOT NULL DEFAULT 'To Verify',
  discovered_date date,
  account_id uuid REFERENCES accounts(id),
  submitted_by_contact_id uuid REFERENCES contacts(id),
  use_in_newsletter boolean DEFAULT false,
  use_in_social boolean DEFAULT false,
  use_in_proposal boolean DEFAULT false,
  search_text text GENERATED ALWAYS AS (
    coalesce(headline, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(news_type, '')
  ) STORED,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_account ON community_news (account_id);
CREATE INDEX idx_news_status ON community_news (status);
CREATE INDEX idx_news_priority ON community_news (priority);

CREATE TRIGGER trg_news_updated_at
  BEFORE UPDATE ON community_news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE trends_intel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  category text,
  relevance_score integer,
  stage text,
  description text,
  beacon_opportunity text,
  signals jsonb DEFAULT '[]',
  member_relevance jsonb DEFAULT '[]',
  first_spotted date,
  last_updated date,
  owner text,
  search_text text GENERATED ALWAYS AS (
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(category, '') || ' ' ||
    coalesce(beacon_opportunity, '')
  ) STORED,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trends_industry ON trends_intel (industry);
CREATE INDEX idx_trends_relevance ON trends_intel (relevance_score);
CREATE INDEX idx_trends_stage ON trends_intel (stage);

CREATE TRIGGER trg_trends_updated_at
  BEFORE UPDATE ON trends_intel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL,
  respondent_name text,
  respondent_email text,
  respondent_company text,
  response_data jsonb NOT NULL,
  sentiment text,
  overall_rating integer,
  nps_score integer,
  action_status text DEFAULT 'New',
  action_notes text,
  you_asked_we_did boolean DEFAULT false,
  priority text DEFAULT 'Normal',
  commercial_opportunity boolean DEFAULT false,
  account_id uuid REFERENCES accounts(id),
  contact_id uuid REFERENCES contacts(id),
  event_id uuid REFERENCES events(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_forms_type ON form_responses (form_type);
CREATE INDEX idx_forms_status ON form_responses (action_status);
CREATE INDEX idx_forms_account ON form_responses (account_id);
CREATE INDEX idx_forms_event ON form_responses (event_id);

-- ============================================================
-- 003d: okrs, tasks
-- ============================================================
CREATE TABLE okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective text NOT NULL,
  key_result text,
  owner text,
  quarter text,
  target_value numeric(10,2),
  current_value numeric(10,2),
  status text DEFAULT 'On Track',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_okrs_quarter ON okrs (quarter);
CREATE INDEX idx_okrs_status ON okrs (status);

CREATE TRIGGER trg_okrs_updated_at
  BEFORE UPDATE ON okrs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  task_type text,
  zone text NOT NULL DEFAULT 'to_prioritize',
  project text,
  work_grade text,
  due_date date,
  date_added date,
  scheduled_start timestamptz,
  estimated_minutes integer,
  actual_minutes integer,
  description text,
  assignee text,
  score_impact integer,
  score_urgency integer,
  score_leverage integer,
  score_energy integer,
  score_goals integer,
  score_risk integer,
  score_motivation integer,
  score_frequency integer,
  score_time integer,
  priority_score numeric(5,1),
  priority_score_updated_at timestamptz,
  parent_task_id uuid REFERENCES tasks(id),
  depends_on_task_id uuid REFERENCES tasks(id),
  sort_order integer,
  source text DEFAULT 'manual',
  ai_suggestion_id uuid,
  monday_item_id text,
  account_id uuid REFERENCES accounts(id),
  deal_id uuid REFERENCES deals(id),
  event_id uuid REFERENCES events(id),
  okr_id uuid REFERENCES okrs(id),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assignee ON tasks (assignee);
CREATE INDEX idx_tasks_zone ON tasks (zone);
CREATE INDEX idx_tasks_due ON tasks (due_date);
CREATE INDEX idx_tasks_priority ON tasks (priority_score DESC);
CREATE INDEX idx_tasks_parent ON tasks (parent_task_id);
CREATE INDEX idx_tasks_depends ON tasks (depends_on_task_id);
CREATE INDEX idx_tasks_monday ON tasks (monday_item_id);
CREATE INDEX idx_tasks_pull ON tasks (assignee, zone, priority_score DESC);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
