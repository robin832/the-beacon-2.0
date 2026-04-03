-- Migration 001: Foundation Setup
-- Applied: 2026-04-03 (version 20260403111056)
-- Creates: extensions, schemas, utility functions, audit tables, ai_logs, ai_tool_definitions

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

-- status_changes (audit log for all status transitions)
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

-- ai_logs (universal LLM call logging)
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

-- ai_tool_definitions (ADR-009: dynamic tool registry)
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
