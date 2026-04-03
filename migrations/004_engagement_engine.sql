-- Migration 004: Engagement Engine
-- Applied: 2026-04-03 (version 20260403131302)
-- Creates: engagement_logs, engagement_scores, facility_bookings, renewal_reports, knowledge_base

CREATE TABLE engagement_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_type text NOT NULL,
  engagement_date date NOT NULL,
  points integer NOT NULL,
  source text NOT NULL,
  source_reference text,
  notes text,
  account_id uuid NOT NULL REFERENCES accounts(id),
  contact_id uuid REFERENCES contacts(id),
  event_id uuid REFERENCES events(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_engagement_account ON engagement_logs (account_id);
CREATE INDEX idx_engagement_contact ON engagement_logs (contact_id);
CREATE INDEX idx_engagement_date ON engagement_logs (engagement_date);
CREATE INDEX idx_engagement_type ON engagement_logs (engagement_type);
CREATE INDEX idx_engagement_scoring ON engagement_logs (account_id, engagement_date);

CREATE TABLE engagement_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  total_points_12mo integer DEFAULT 0,
  health_status text,
  events_ytd integer DEFAULT 0,
  coworking_days_ytd integer DEFAULT 0,
  last_engagement date,
  days_since_engagement integer,
  trend text,
  previous_score integer,
  three_event_status text,
  events_needed integer,
  notes text,
  score_history jsonb,
  predicted_status_90d text,
  last_calculated timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_scores_account ON engagement_scores (account_id);
CREATE INDEX idx_scores_health ON engagement_scores (health_status);
CREATE INDEX idx_scores_three_event ON engagement_scores (three_event_status);

CREATE TRIGGER trg_scores_updated_at
  BEFORE UPDATE ON engagement_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE facility_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nexudus_booking_id text,
  booking_type text,
  booker_email text,
  booker_name text,
  booking_date date NOT NULL,
  start_time time,
  end_time time,
  duration_hours numeric(4,1),
  resource_name text,
  contact_id uuid REFERENCES contacts(id),
  account_id uuid REFERENCES accounts(id),
  processed boolean DEFAULT false,
  sync_date timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_bookings_nexudus ON facility_bookings (nexudus_booking_id) WHERE nexudus_booking_id IS NOT NULL;
CREATE INDEX idx_bookings_date ON facility_bookings (booking_date);
CREATE INDEX idx_bookings_account ON facility_bookings (account_id);
CREATE INDEX idx_bookings_unprocessed ON facility_bookings (processed) WHERE processed = false;

CREATE TABLE renewal_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  renewal_date date,
  generated_date date,
  ai_summary text,
  highlights text,
  concerns text,
  recommendations text,
  talking_points text,
  tier_recommendation text,
  report_pdf_url text,
  status text DEFAULT 'Generated',
  owner text DEFAULT 'Robin',
  meeting_notes text,
  actual_outcome text,
  actual_tier text,
  ai_accuracy_rating integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_renewal_account ON renewal_reports (account_id);
CREATE INDEX idx_renewal_date ON renewal_reports (renewal_date);
CREATE INDEX idx_renewal_status ON renewal_reports (status);

CREATE TRIGGER trg_renewal_updated_at
  BEFORE UPDATE ON renewal_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  resource_type text,
  category text,
  description text,
  content_url text,
  tags jsonb DEFAULT '[]',
  industries jsonb DEFAULT '[]',
  technologies jsonb DEFAULT '[]',
  visibility text DEFAULT 'Members Only',
  author text,
  search_text text GENERATED ALWAYS AS (
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(category, '') || ' ' ||
    coalesce(tags::text, '') || ' ' ||
    coalesce(technologies::text, '')
  ) STORED,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kb_tags ON knowledge_base USING GIN (tags);
CREATE INDEX idx_kb_industries ON knowledge_base USING GIN (industries);
CREATE INDEX idx_kb_technologies ON knowledge_base USING GIN (technologies);
CREATE INDEX idx_kb_type ON knowledge_base (resource_type);

CREATE TRIGGER trg_kb_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
