-- Migration 002: Core CRM Tables
-- Applied: 2026-04-03 (versions 20260403111840 through 20260403111908)
-- Creates: accounts, contacts, deals, activities
-- Note: Applied as 4 separate migrations (one per table) via Supabase MCP

-- ============================================================
-- 002a: accounts
-- ============================================================
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vat_number text,
  website text,
  logo_url text,
  description text,
  country text DEFAULT 'Belgium',
  address text,
  account_type text NOT NULL DEFAULT 'Prospect',
  membership_tier text,
  industry_verticals jsonb DEFAULT '[]',
  technologies jsonb DEFAULT '[]',
  company_size text,
  founded_year integer,
  community_goals jsonb DEFAULT '[]',
  international_ambitions jsonb DEFAULT '[]',
  pain_points jsonb DEFAULT '[]',
  use_cases jsonb DEFAULT '[]',
  offering_capabilities jsonb DEFAULT '[]',
  collaboration_interests jsonb DEFAULT '[]',
  sdg_focus jsonb DEFAULT '[]',
  target_markets jsonb DEFAULT '[]',
  account_owner text,
  relationship_status text DEFAULT 'Prospect',
  contract_start date,
  renewal_date date,
  member_since date,
  annual_value numeric(10,2),
  payment_status text,
  billing_email text,
  nexudus_id text,
  internal_notes text,
  search_text text GENERATED ALWAYS AS (
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(industry_verticals::text, '') || ' ' ||
    coalesce(technologies::text, '') || ' ' ||
    coalesce(community_goals::text, '')
  ) STORED,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX idx_accounts_technologies ON accounts USING GIN (technologies);
CREATE INDEX idx_accounts_industry ON accounts USING GIN (industry_verticals);
CREATE INDEX idx_accounts_goals ON accounts USING GIN (community_goals);
CREATE INDEX idx_accounts_pain_points ON accounts USING GIN (pain_points);
CREATE INDEX idx_accounts_use_cases ON accounts USING GIN (use_cases);
CREATE INDEX idx_accounts_offerings ON accounts USING GIN (offering_capabilities);
CREATE INDEX idx_accounts_collab ON accounts USING GIN (collaboration_interests);
CREATE INDEX idx_accounts_sdg ON accounts USING GIN (sdg_focus);
CREATE INDEX idx_accounts_markets ON accounts USING GIN (target_markets);
CREATE INDEX idx_accounts_type ON accounts (account_type);
CREATE INDEX idx_accounts_tier ON accounts (membership_tier);
CREATE INDEX idx_accounts_renewal ON accounts (renewal_date);
CREATE INDEX idx_accounts_nexudus ON accounts (nexudus_id);
CREATE UNIQUE INDEX idx_accounts_vat ON accounts (vat_number) WHERE vat_number IS NOT NULL;

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 002b: contacts
-- ============================================================
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  full_name text NOT NULL,
  first_name text,
  last_name text,
  email text NOT NULL,
  phone text,
  linkedin text,
  photo_url text,
  job_title text,
  function text,
  decision_maker boolean DEFAULT false,
  tech_interests jsonb DEFAULT '[]',
  industry_focus jsonb DEFAULT '[]',
  skills jsonb DEFAULT '[]',
  looking_for jsonb DEFAULT '[]',
  offering jsonb DEFAULT '[]',
  event_topic_interests jsonb DEFAULT '[]',
  newsletter_optin boolean DEFAULT false,
  event_notifications boolean DEFAULT false,
  partner_updates boolean DEFAULT false,
  marketing_optin boolean DEFAULT false,
  unsubscribed boolean DEFAULT false,
  gdpr_consent_date date,
  contact_group text DEFAULT 'Secondary',
  source text,
  nexudus_id text,
  search_text text GENERATED ALWAYS AS (
    coalesce(full_name, '') || ' ' ||
    coalesce(job_title, '') || ' ' ||
    coalesce(function, '') || ' ' ||
    coalesce(tech_interests::text, '') || ' ' ||
    coalesce(industry_focus::text, '')
  ) STORED,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE UNIQUE INDEX idx_contacts_email ON contacts (email) WHERE archived_at IS NULL;
CREATE INDEX idx_contacts_account ON contacts (account_id);
CREATE INDEX idx_contacts_tech ON contacts USING GIN (tech_interests);
CREATE INDEX idx_contacts_industry ON contacts USING GIN (industry_focus);
CREATE INDEX idx_contacts_skills ON contacts USING GIN (skills);
CREATE INDEX idx_contacts_looking ON contacts USING GIN (looking_for);
CREATE INDEX idx_contacts_topics ON contacts USING GIN (event_topic_interests);
CREATE INDEX idx_contacts_group ON contacts (contact_group);
CREATE INDEX idx_contacts_nexudus ON contacts (nexudus_id);

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 002c: deals
-- ============================================================
CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  deal_type text NOT NULL,
  stage text NOT NULL DEFAULT 'New Lead',
  deal_value numeric(10,2),
  probability integer DEFAULT 10,
  weighted_value numeric(10,2),
  expected_close date,
  actual_close date,
  stage_entered_at timestamptz DEFAULT now(),
  loss_reason text,
  deal_owner text,
  account_id uuid NOT NULL REFERENCES accounts(id),
  contact_id uuid REFERENCES contacts(id),
  specific_product text,
  notes text,
  pain_points_addressed jsonb DEFAULT '[]',
  predicted_close_date date,
  win_probability_ai numeric(3,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_account ON deals (account_id);
CREATE INDEX idx_deals_type ON deals (deal_type);
CREATE INDEX idx_deals_stage ON deals (stage);
CREATE INDEX idx_deals_close ON deals (expected_close);
CREATE INDEX idx_deals_composite ON deals (stage, deal_type);

CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 002d: activities
-- ============================================================
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  activity_type text NOT NULL,
  activity_date date NOT NULL,
  duration_minutes integer,
  description text,
  outcome text,
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  follow_up_owner text,
  owner text NOT NULL,
  account_id uuid REFERENCES accounts(id),
  contact_id uuid REFERENCES contacts(id),
  deal_id uuid REFERENCES deals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_account ON activities (account_id);
CREATE INDEX idx_activities_contact ON activities (contact_id);
CREATE INDEX idx_activities_deal ON activities (deal_id);
CREATE INDEX idx_activities_date ON activities (activity_date);
CREATE INDEX idx_activities_followup ON activities (follow_up_required, follow_up_date) WHERE follow_up_required = true;

CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
