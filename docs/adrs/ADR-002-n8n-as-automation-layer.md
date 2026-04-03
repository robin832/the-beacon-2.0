# ADR-002: n8n as Automation Layer

**Status:** Accepted

**Date:** April 2026

## Context

The Beacon runs 50+ automations connecting Supabase, Monday.com, Nexudus, Claude API, Mailchimp, and calendar systems. Zapier would cost EUR 500+/month at this volume. The team (non-developers) needs to build and modify workflows.

## Decision

Use n8n (self-hosted or cloud) as the sole automation orchestrator. All scheduled jobs, webhook processing, AI API calls, and data sync between systems go through n8n workflows.

## Consequences

- **+** Visual workflow builder -- Robin and Vincent can create automations without coding
- **+** Flat-cost pricing (no per-execution charges)
- **+** HTTP Request node can call any API
- **+** Workflow JSON is exportable and version-controllable
- **-** Self-hosted n8n requires server maintenance
- **-** Not suitable for real-time user interactions (use Edge Functions for that)
