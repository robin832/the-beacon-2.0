-- Migration 006: Innovation Maturity Platform Schema
-- Applied: 2026-04-03 (version 20260403132856)
-- Creates: innovation.analyses, innovation.maturity_dimensions, innovation.ecosystem_matches,
--          innovation.sessions, innovation.interactions, innovation.leads, innovation.conversations

CREATE TABLE innovation.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,
  country text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz
);

CREATE INDEX idx_inno_sessions_started ON innovation.sessions (started_at);
CREATE INDEX idx_inno_sessions_utm ON innovation.sessions (utm_source);

CREATE TABLE innovation.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_website text,
  industry text,
  company_type text,
  overall_score numeric(2,1),
  maturity_level text,
  technologies_detected jsonb DEFAULT '[]',
  strategic_goals jsonb DEFAULT '[]',
  active_projects jsonb DEFAULT '[]',
  innovation_gaps jsonb DEFAULT '[]',
  pain_points_detected jsonb DEFAULT '[]',
  beacon_relevance text,
  recommended_offerings jsonb DEFAULT '[]',
  data_confidence text,
  full_analysis_json jsonb,
  account_id uuid REFERENCES public.accounts(id),
  session_id uuid REFERENCES innovation.sessions(id),
  previous_analysis_id uuid REFERENCES innovation.analyses(id),
  search_text text GENERATED ALWAYS AS (
    coalesce(company_name, '') || ' ' ||
    coalesce(technologies_detected::text, '') || ' ' ||
    coalesce(innovation_gaps::text, '') || ' ' ||
    coalesce(beacon_relevance, '')
  ) STORED,
  embedding vector(1536),
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inno_analyses_account ON innovation.analyses (account_id);
CREATE INDEX idx_inno_analyses_company ON innovation.analyses (company_name);
CREATE INDEX idx_inno_analyses_industry ON innovation.analyses (industry);
CREATE INDEX idx_inno_analyses_time ON innovation.analyses (analyzed_at);
CREATE INDEX idx_inno_analyses_tech ON innovation.analyses USING GIN (technologies_detected);
CREATE INDEX idx_inno_analyses_gaps ON innovation.analyses USING GIN (innovation_gaps);

CREATE TABLE innovation.maturity_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES innovation.analyses(id),
  dimension text NOT NULL,
  weight numeric(3,2) NOT NULL,
  score numeric(2,1),
  assessment text,
  evidence_citations jsonb DEFAULT '[]',
  evidence_found boolean,
  source_quality text,
  corroboration_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inno_dims_analysis ON innovation.maturity_dimensions (analysis_id);
CREATE INDEX idx_inno_dims_benchmark ON innovation.maturity_dimensions (dimension, score);
CREATE UNIQUE INDEX idx_inno_dims_dedup ON innovation.maturity_dimensions (analysis_id, dimension);

CREATE TABLE innovation.ecosystem_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES innovation.analyses(id),
  matched_account_id uuid NOT NULL REFERENCES public.accounts(id),
  match_rank integer NOT NULL,
  match_score numeric(3,2),
  match_rationale text,
  match_category text,
  is_visible boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inno_matches_analysis ON innovation.ecosystem_matches (analysis_id);
CREATE INDEX idx_inno_matches_account ON innovation.ecosystem_matches (matched_account_id);
CREATE UNIQUE INDEX idx_inno_matches_dedup ON innovation.ecosystem_matches (analysis_id, matched_account_id);

CREATE TABLE innovation.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES innovation.sessions(id),
  event_type text NOT NULL,
  page text,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inno_interactions_session ON innovation.interactions (session_id);
CREATE INDEX idx_inno_interactions_type ON innovation.interactions (event_type);
CREATE INDEX idx_inno_interactions_time ON innovation.interactions (timestamp);

CREATE TABLE innovation.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES innovation.analyses(id),
  session_id uuid REFERENCES innovation.sessions(id),
  name text,
  email text,
  company_name text,
  phone text,
  message text,
  lead_type text NOT NULL,
  calendly_booked boolean DEFAULT false,
  contact_id uuid REFERENCES public.contacts(id),
  deal_id uuid REFERENCES public.deals(id),
  status text DEFAULT 'New',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inno_leads_analysis ON innovation.leads (analysis_id);
CREATE INDEX idx_inno_leads_status ON innovation.leads (status);
CREATE INDEX idx_inno_leads_email ON innovation.leads (email);
CREATE INDEX idx_inno_leads_contact ON innovation.leads (contact_id);
CREATE INDEX idx_inno_leads_deal ON innovation.leads (deal_id);

CREATE TABLE innovation.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES innovation.analyses(id),
  session_id uuid REFERENCES innovation.sessions(id),
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inno_convos_analysis ON innovation.conversations (analysis_id);
CREATE INDEX idx_inno_convos_session ON innovation.conversations (session_id);
CREATE INDEX idx_inno_convos_time ON innovation.conversations (created_at);

-- Link matchmaking_history.innovation_analysis_id
ALTER TABLE public.matchmaking_history
  ADD CONSTRAINT fk_match_hist_innovation
  FOREIGN KEY (innovation_analysis_id) REFERENCES innovation.analyses(id);

-- Link meeting_briefings.innovation_analysis_id
ALTER TABLE public.meeting_briefings
  ADD CONSTRAINT fk_briefing_innovation
  FOREIGN KEY (innovation_analysis_id) REFERENCES innovation.analyses(id);
