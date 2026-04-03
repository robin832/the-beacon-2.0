-- Migration 005: AI Infrastructure Tables
-- Applied: 2026-04-03 (version 20260403132832)
-- Creates: ai_suggestions, matchmaking_history, member_connections, match_suggestions,
--          match_feedback, event_recommendations, email_drafts, meeting_briefings, meeting_summaries

CREATE TABLE ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  assignee text,
  urgency text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  reason text,
  suggested_action text,
  context_data jsonb,
  status text NOT NULL DEFAULT 'pending',
  dismissed_reason text,
  snoozed_until date,
  completed_activity_id uuid REFERENCES activities(id),
  ai_log_id uuid REFERENCES ai_logs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suggestions_assignee ON ai_suggestions (assignee, status);
CREATE INDEX idx_suggestions_urgency ON ai_suggestions (urgency, status);
CREATE INDEX idx_suggestions_entity ON ai_suggestions (entity_type, entity_id);
CREATE INDEX idx_suggestions_time ON ai_suggestions (created_at);

CREATE TRIGGER trg_suggestions_updated_at
  BEFORE UPDATE ON ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Link tasks.ai_suggestion_id now that ai_suggestions exists
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_suggestion FOREIGN KEY (ai_suggestion_id) REFERENCES ai_suggestions(id);

CREATE TABLE matchmaking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_a_id uuid NOT NULL REFERENCES accounts(id),
  account_b_id uuid NOT NULL REFERENCES accounts(id),
  contact_a_id uuid REFERENCES contacts(id),
  contact_b_id uuid REFERENCES contacts(id),
  match_reason text,
  match_source text,
  match_score numeric(3,2),
  outcome text,
  outcome_date date,
  outcome_notes text,
  innovation_analysis_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_hist_a ON matchmaking_history (account_a_id);
CREATE INDEX idx_match_hist_b ON matchmaking_history (account_b_id);
CREATE INDEX idx_match_hist_source ON matchmaking_history (match_source);
CREATE INDEX idx_match_hist_outcome ON matchmaking_history (outcome);

CREATE TRIGGER trg_match_hist_updated_at
  BEFORE UPDATE ON matchmaking_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE member_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_a_id uuid NOT NULL REFERENCES contacts(id),
  contact_b_id uuid NOT NULL REFERENCES contacts(id),
  account_a_id uuid REFERENCES accounts(id),
  account_b_id uuid REFERENCES accounts(id),
  connection_source text NOT NULL,
  match_suggestion_id uuid,
  matchmaking_history_id uuid REFERENCES matchmaking_history(id),
  status text NOT NULL DEFAULT 'pending',
  accepted_at timestamptz,
  message text,
  interaction_count integer DEFAULT 0,
  last_interaction_at timestamptz,
  collaboration_status text,
  collaboration_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_connections_dedup ON member_connections (
  LEAST(contact_a_id, contact_b_id), GREATEST(contact_a_id, contact_b_id)
);
CREATE INDEX idx_connections_a ON member_connections (contact_a_id);
CREATE INDEX idx_connections_b ON member_connections (contact_b_id);
CREATE INDEX idx_connections_status ON member_connections (status);
CREATE INDEX idx_connections_source ON member_connections (connection_source);
CREATE INDEX idx_connections_collab ON member_connections (collaboration_status);

CREATE TRIGGER trg_connections_updated_at
  BEFORE UPDATE ON member_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE match_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_contact_id uuid NOT NULL REFERENCES contacts(id),
  suggested_contact_id uuid NOT NULL REFERENCES contacts(id),
  target_account_id uuid REFERENCES accounts(id),
  suggested_account_id uuid REFERENCES accounts(id),
  match_type text NOT NULL,
  match_score numeric(3,2) NOT NULL,
  match_reason text,
  match_dimensions jsonb,
  status text NOT NULL DEFAULT 'pending',
  viewed_at timestamptz,
  acted_at timestamptz,
  dismissed_reason text,
  connection_id uuid REFERENCES member_connections(id),
  batch_id text,
  ai_log_id uuid REFERENCES ai_logs(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_sug_target ON match_suggestions (target_contact_id);
CREATE INDEX idx_match_sug_suggested ON match_suggestions (suggested_contact_id);
CREATE INDEX idx_match_sug_status ON match_suggestions (status);
CREATE INDEX idx_match_sug_pending ON match_suggestions (target_contact_id, status);
CREATE UNIQUE INDEX idx_match_sug_dedup ON match_suggestions (target_contact_id, suggested_contact_id, batch_id);
CREATE INDEX idx_match_sug_expires ON match_suggestions (expires_at);
CREATE INDEX idx_match_sug_score ON match_suggestions (match_score DESC);

-- Add FK from member_connections to match_suggestions
ALTER TABLE member_connections ADD CONSTRAINT fk_connections_suggestion FOREIGN KEY (match_suggestion_id) REFERENCES match_suggestions(id);

CREATE TABLE match_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_suggestion_id uuid REFERENCES match_suggestions(id),
  connection_id uuid REFERENCES member_connections(id),
  contact_id uuid NOT NULL REFERENCES contacts(id),
  feedback_type text NOT NULL,
  rating integer,
  feedback_text text,
  tags jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_fb_suggestion ON match_feedback (match_suggestion_id);
CREATE INDEX idx_match_fb_connection ON match_feedback (connection_id);
CREATE INDEX idx_match_fb_contact ON match_feedback (contact_id);
CREATE INDEX idx_match_fb_rating ON match_feedback (rating);

CREATE TABLE event_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id),
  contact_id uuid NOT NULL REFERENCES contacts(id),
  relevance_score numeric(3,2),
  reason text,
  rank integer,
  invitation_sent boolean DEFAULT false,
  registered boolean DEFAULT false,
  attended boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_rec_event ON event_recommendations (event_id);
CREATE INDEX idx_event_rec_contact ON event_recommendations (contact_id);
CREATE UNIQUE INDEX idx_event_rec_dedup ON event_recommendations (event_id, contact_id);
CREATE INDEX idx_event_rec_funnel ON event_recommendations (invitation_sent, registered, attended);

CREATE TABLE email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_type text NOT NULL,
  trigger_source text,
  account_id uuid REFERENCES accounts(id),
  contact_id uuid REFERENCES contacts(id),
  deal_id uuid REFERENCES deals(id),
  incoming_email_subject text,
  incoming_email_body text,
  incoming_email_from text,
  ai_draft_subject text,
  ai_draft_body text,
  edited_subject text,
  edited_body text,
  edit_diff jsonb,
  context_used jsonb,
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  ai_log_id uuid REFERENCES ai_logs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_account ON email_drafts (account_id);
CREATE INDEX idx_email_contact ON email_drafts (contact_id);
CREATE INDEX idx_email_type ON email_drafts (draft_type);
CREATE INDEX idx_email_status ON email_drafts (status);
CREATE INDEX idx_email_time ON email_drafts (created_at);

CREATE TRIGGER trg_email_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE meeting_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date date NOT NULL,
  meeting_time time,
  meeting_title text,
  meeting_location text,
  calendar_event_id text,
  attendee_email text,
  attendee_name text,
  contact_id uuid REFERENCES contacts(id),
  account_id uuid REFERENCES accounts(id),
  innovation_analysis_id uuid,
  company_summary text,
  relationship_summary text,
  engagement_highlights text,
  synergies text,
  innovation_profile text,
  unmade_introductions jsonb,
  meeting_history text,
  suggested_talking_points jsonb DEFAULT '[]',
  web_research text,
  data_sources_used jsonb DEFAULT '[]',
  briefing_status text NOT NULL DEFAULT 'generated',
  post_meeting_notes text,
  follow_up_task_id uuid REFERENCES tasks(id),
  ai_log_id uuid REFERENCES ai_logs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_briefing_date ON meeting_briefings (meeting_date);
CREATE INDEX idx_briefing_account ON meeting_briefings (account_id);
CREATE INDEX idx_briefing_contact ON meeting_briefings (contact_id);
CREATE INDEX idx_briefing_calendar ON meeting_briefings (calendar_event_id);
CREATE INDEX idx_briefing_status ON meeting_briefings (briefing_status);

CREATE TABLE meeting_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_briefing_id uuid REFERENCES meeting_briefings(id),
  meeting_date date NOT NULL,
  meeting_title text,
  calendar_event_id text,
  input_type text NOT NULL,
  raw_transcript text,
  raw_notes text,
  monday_notetaker_id text,
  attendee_emails jsonb DEFAULT '[]',
  contact_id uuid REFERENCES contacts(id),
  account_id uuid REFERENCES accounts(id),
  executive_summary text,
  key_decisions jsonb DEFAULT '[]',
  action_items jsonb DEFAULT '[]',
  commitments jsonb DEFAULT '[]',
  topics_discussed jsonb DEFAULT '[]',
  mentioned_entities jsonb DEFAULT '[]',
  sentiment text,
  deal_signals jsonb,
  next_meeting_date date,
  next_meeting_notes text,
  activity_id uuid REFERENCES activities(id),
  ai_log_id uuid REFERENCES ai_logs(id),
  processed boolean DEFAULT false,
  search_text text GENERATED ALWAYS AS (
    coalesce(executive_summary, '') || ' ' ||
    coalesce(topics_discussed::text, '')
  ) STORED,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_summary_date ON meeting_summaries (meeting_date);
CREATE INDEX idx_summary_account ON meeting_summaries (account_id);
CREATE INDEX idx_summary_contact ON meeting_summaries (contact_id);
CREATE INDEX idx_summary_briefing ON meeting_summaries (meeting_briefing_id);
CREATE INDEX idx_summary_calendar ON meeting_summaries (calendar_event_id);
CREATE INDEX idx_summary_unprocessed ON meeting_summaries (processed) WHERE processed = false;

CREATE TRIGGER trg_summary_updated_at
  BEFORE UPDATE ON meeting_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
