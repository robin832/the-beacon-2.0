-- Migration 007: Competitive Intelligence & Presence Tables
-- Applied: 2026-04-03 (version 20260403132926)
-- Creates: competitors, external_events, external_event_analyses,
--          competitive_landscape_reports, presence_log, presence_alerts, presence_preferences

-- ============================================================
-- Competitive Intelligence
-- ============================================================

CREATE TABLE competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  website text,
  events_url text,
  linkedin_url text,
  location text,
  focus_domains jsonb DEFAULT '[]',
  focus_cities jsonb DEFAULT '[]',
  description text,
  strengths jsonb DEFAULT '[]',
  weaknesses jsonb DEFAULT '[]',
  threat_level text DEFAULT 'monitor',
  notes text,
  last_scanned timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_competitors_domains ON competitors USING GIN (focus_domains);
CREATE INDEX idx_competitors_cities ON competitors USING GIN (focus_cities);
CREATE INDEX idx_competitors_threat ON competitors (threat_level);

CREATE TRIGGER trg_competitors_updated_at
  BEFORE UPDATE ON competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE external_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organizer_id uuid REFERENCES competitors(id),
  organizer_name text,
  event_date date,
  event_end_date date,
  city text,
  venue text,
  event_url text,
  source_platform text,
  source_url text,
  topics jsonb DEFAULT '[]',
  industry_focus jsonb DEFAULT '[]',
  format text,
  estimated_attendance integer,
  ticket_price text,
  is_free boolean,
  speakers jsonb DEFAULT '[]',
  description text,
  ai_relevance_score integer,
  ai_overlap_analysis text,
  ai_opportunity_notes text,
  beacon_event_overlap_id uuid REFERENCES events(id),
  status text NOT NULL DEFAULT 'upcoming',
  post_event_analysis_id uuid,
  discovered_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ext_events_date ON external_events (event_date);
CREATE INDEX idx_ext_events_city ON external_events (city);
CREATE INDEX idx_ext_events_organizer ON external_events (organizer_id);
CREATE INDEX idx_ext_events_status ON external_events (status);
CREATE INDEX idx_ext_events_relevance ON external_events (ai_relevance_score);
CREATE INDEX idx_ext_events_topics ON external_events USING GIN (topics);
CREATE INDEX idx_ext_events_industry ON external_events USING GIN (industry_focus);

CREATE TRIGGER trg_ext_events_updated_at
  BEFORE UPDATE ON external_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE external_event_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_event_id uuid NOT NULL REFERENCES external_events(id),
  feedback_sources jsonb DEFAULT '[]',
  feedback_sentiment text,
  attendance_estimate integer,
  what_worked jsonb DEFAULT '[]',
  what_didnt_work jsonb DEFAULT '[]',
  topics_that_resonated jsonb DEFAULT '[]',
  speaker_highlights jsonb DEFAULT '[]',
  audience_profile text,
  beacon_opportunity text,
  suggested_event_title text,
  suggested_event_format text,
  suggested_topics jsonb DEFAULT '[]',
  suggested_speakers jsonb DEFAULT '[]',
  competitive_advantage text,
  ai_log_id uuid REFERENCES ai_logs(id),
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ext_analyses_event ON external_event_analyses (external_event_id);
CREATE INDEX idx_ext_analyses_sentiment ON external_event_analyses (feedback_sentiment);
CREATE INDEX idx_ext_analyses_time ON external_event_analyses (analyzed_at);
CREATE INDEX idx_ext_analyses_topics ON external_event_analyses USING GIN (topics_that_resonated);

-- Add FK from external_events to analyses
ALTER TABLE external_events
  ADD CONSTRAINT fk_ext_events_analysis
  FOREIGN KEY (post_event_analysis_id) REFERENCES external_event_analyses(id);

CREATE TABLE competitive_landscape_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_period text NOT NULL,
  report_type text NOT NULL,
  total_external_events integer,
  events_by_city jsonb,
  events_by_domain jsonb,
  top_competitors jsonb,
  trending_topics jsonb DEFAULT '[]',
  underserved_topics jsonb DEFAULT '[]',
  beacon_market_share jsonb,
  executive_summary text,
  recommendations jsonb DEFAULT '[]',
  ai_log_id uuid REFERENCES ai_logs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_landscape_period ON competitive_landscape_reports (report_period);
CREATE INDEX idx_landscape_type ON competitive_landscape_reports (report_type);

-- ============================================================
-- Presence & In-Building Networking
-- ============================================================

CREATE TABLE presence_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id),
  account_id uuid REFERENCES accounts(id),
  nexudus_checkin_id text,
  nexudus_coworker_id text,
  check_in_time timestamptz NOT NULL,
  check_out_time timestamptz,
  check_in_method text,
  duration_minutes integer,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_presence_contact ON presence_log (contact_id);
CREATE INDEX idx_presence_account ON presence_log (account_id);
CREATE INDEX idx_presence_date ON presence_log (date);
CREATE INDEX idx_presence_current ON presence_log (check_out_time) WHERE check_out_time IS NULL;
CREATE UNIQUE INDEX idx_presence_nexudus ON presence_log (nexudus_checkin_id) WHERE nexudus_checkin_id IS NOT NULL;

CREATE TABLE presence_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  triggered_by_contact_id uuid NOT NULL REFERENCES contacts(id),
  target_contact_id uuid REFERENCES contacts(id),
  triggered_by_account_id uuid REFERENCES accounts(id),
  alert_reason text,
  related_match_suggestion_id uuid REFERENCES match_suggestions(id),
  related_matchmaking_history_id uuid REFERENCES matchmaking_history(id),
  presence_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  acted_on_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_target ON presence_alerts (target_contact_id);
CREATE INDEX idx_alerts_date ON presence_alerts (presence_date);
CREATE INDEX idx_alerts_status ON presence_alerts (status);
CREATE INDEX idx_alerts_pending ON presence_alerts (target_contact_id, status, presence_date);

CREATE TABLE presence_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id),
  show_presence_to_community boolean NOT NULL DEFAULT false,
  show_presence_to_staff boolean NOT NULL DEFAULT true,
  show_bookings_to_community boolean NOT NULL DEFAULT false,
  receive_networking_alerts boolean NOT NULL DEFAULT false,
  receive_match_presence_alerts boolean NOT NULL DEFAULT false,
  alert_channels jsonb DEFAULT '["in_app"]',
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_prefs_contact ON presence_preferences (contact_id);

CREATE TRIGGER trg_prefs_updated_at
  BEFORE UPDATE ON presence_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
