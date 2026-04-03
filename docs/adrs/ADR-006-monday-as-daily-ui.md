# ADR-006: Monday.com as Daily UI

**Status:** Accepted

**Date:** April 2026

## Context

The team already uses Monday.com daily. Switching to a new tool would create adoption friction. Supabase's table editor is not suitable for daily CRM work. Building a custom UI is premature.

## Decision

Keep Monday.com as the daily operational UI for the team. Supabase is the data layer -- invisible to daily workflow. Data flows Monday to Supabase for master data, Supabase to Monday for AI-generated insights.

## Consequences

- **+** Zero adoption friction -- team continues working in familiar tool
- **+** Monday's views, dashboards, and automations cover 90% of daily needs
- **+** AI outputs appear as Monday items/updates (familiar format)
- **-** Two-way sync adds complexity
- **-** Monday.com API rate limits (10,000 requests/minute) could be a concern at scale
- **-** Monthly subscription cost
