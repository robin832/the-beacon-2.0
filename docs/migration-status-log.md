# The Beacon 2.0 — Migration Status Log
## Last Updated: April 7, 2026

---

## Database State Snapshot

| Table | Rows | Notes |
|-------|------|-------|
| **accounts** | 357 | 351 from Zapfloor + 6 inserted from Active Members board |
| **contacts** | 573 | From Zapfloor users export (576 unique emails, deduped) |
| **deals** | 91 | From Monday Sales Funnel (46 Won, 19 Lost, 26 Active) |
| **events** | 0 | Not loaded yet |
| **tasks** | 0 | Not loaded yet |
| **All other tables** | 0 | Schema created, awaiting data |

## Accounts Enrichment Status

| Field | Populated | Source | Notes |
|-------|-----------|--------|-------|
| name | 357/357 | Zapfloor | Complete |
| vat_number | 328/357 | Zapfloor | 29 without VAT |
| address | 351/357 | Zapfloor | |
| description | 83/357 | Monday CRM (Accounts_1775554116.xlsx) | ~40 more available in Excel, enrichment partially done |
| website | 101/357 | Zapfloor (19) + Monday CRM (~82) | |
| technologies | 80/357 | Monday CRM | JSONB arrays, ~40 more available |
| industry_verticals | 85/357 | Monday CRM | JSONB arrays, ~40 more available |
| billing_email | ~90/357 | Mixed | |
| membership_tier | 63/357 | Monday Active Members | See tier breakdown below |
| annual_value | ~50/357 | Monday Active Members | €116,000 total |
| contract_start | ~55/357 | Monday Active Members | |
| renewal_date | ~50/357 | Monday Active Members | |
| account_type | 0/357 | NOT SET | Needs manual classification to match Supabase predefined values |
| community_goals | 0/357 | Empty in Monday export | |

### Membership Tier Breakdown
| Tier | Count |
|------|-------|
| Tech Accelerator | 31 |
| Tech Starter | 20 |
| Private Office | 3 |
| Coworking | 3 |
| Office | 2 |
| Tech Champion | 2 |
| Industry Engage | 2 |
| **Total with tier** | **63** |

## Deals Status

| Stage | Count | Total Value |
|-------|-------|-------------|
| Won | 46 | €216,064 |
| Lost | 19 | €158,830 |
| Discovery | 11 | €15,540 |
| Proposal Sent | 10 | €24,400 |
| Meeting Scheduled | 3 | — |
| New Lead | 2 | €5,000 |

- 48/91 deals linked to accounts (account_id populated)
- 43/91 unmatched — company names stored in `specific_product` column for later matching
- `account_id` was made **nullable** on deals table to allow unmatched deals
- deal_owner = 'Robin' for all deals

## Contacts Status

- 573 contacts loaded, all linked to accounts (0 orphaned)
- 152 Primary, remaining Secondary (based on Zapfloor `primary_contact` flag)
- Job titles mostly empty (not in Zapfloor data)
- Phone numbers: 97 have phone data (many Zapfloor records had empty phone fields)
- 6 duplicate emails were resolved during import

## Schema Status (All 47 Tables Created)

| Phase | Tables | Status |
|-------|--------|--------|
| 0 - Foundation | pgvector, pg_cron, status_changes, ai_logs, ai_tool_definitions | Done |
| 1 - Core CRM | accounts, contacts, deals, activities | Schema + data |
| 2 - Operations | events, event_attendees, service_deliveries, invoices, offices, tasks, okrs | Schema only |
| 3 - Comms | communications, social_media_posts, community_news, trends_intel, form_responses | Schema only |
| 4 - Engagement | engagement_logs, engagement_scores, facility_bookings, renewal_reports, knowledge_base | Schema only |
| 5 - AI | ai_suggestions, matchmaking_history, match_suggestions, member_connections, match_feedback, event_recommendations, email_drafts, meeting_briefings, meeting_summaries | Schema only |
| 6 - Innovation | innovation.sessions, analyses, maturity_dimensions, ecosystem_matches, interactions, leads, conversations | Schema only |
| 7 - Competitive | competitors, external_events, external_event_analyses, competitive_landscape_reports, presence_log, presence_alerts, presence_preferences | Schema only |

## Infrastructure Status

| Component | Status |
|-----------|--------|
| Supabase project (troftohnocgxcsvswhbo, eu-west-1) | Active |
| GitHub repo (robin832/the-beacon-2.0) | Created |
| Supabase CLI on Hetzner server | Installed, linked |
| n8n to Supabase connection | Working |
| Claude Code MCP to Supabase | Working (.mcp.json configured) |
| Edge Functions (embeddings, search, matchmaking) | Scaffold files only, not deployed |
| Monday.com draft boards (new CRM structure) | Not started |
| n8n automations | Not started |

## Key Architecture Decisions Made

1. **Nexudus CRM is complementary, not a replacement** for Monday+Supabase — handles member lifecycle, billing, bookings, portal. Lacks relational matchmaking, unified pipeline, AI.
2. **Data ownership:** Supabase = brain (all data, AI), Monday = daily UI (active items), Nexudus = member-facing, Mailchimp = mass comms
3. **Contacts don't need a Monday board** — live in Supabase + Nexudus, queryable via Claude Project
4. **Communication targeting** via Supabase queries to Mailchimp segments (n8n sync)
5. **GDPR:** Team plan DPA covers Claude Code and Claude.ai processing. Hybrid approach recommended for production (SQL-generation for lists, full AI for insights).
6. **account_id on deals is now nullable** to accommodate deals for companies not yet in accounts table

## Remaining Data Migration Tasks (Priority Order)

1. **Finish Monday CRM enrichment** — ~40 accounts still need technologies/sectors/descriptions from Accounts_1775554116.xlsx (Claude Code prompt ready at ~/the-beacon-2.0/migration/data-migration/)
2. **Fix deal-account matching** — 43 unmatched deals need either account creation or manual matching
3. **Load Events 2026** — 120 events from Monday board 18390423678
4. **Load Tasks** — 181 tasks from Robin's Pull-Based System board 8339394119
5. **Mailchimp subscribers** — merge by email into contacts
6. **Event attendee data** — create contacts and event_attendees records
7. **Manual: account_type classification** — map all 357 accounts to Supabase predefined values
8. **Manual: membership_tier validation** — verify the 63 classified accounts match reality

## Files Generated for Claude Code

| File | Purpose |
|------|---------|
| `data_migration_claude_code_prompt.md` | Initial Zapfloor to Supabase load (completed) |
| `enrichment_claude_code_prompt.md` | Monday CRM accounts enrichment (partially completed) |
| `deals_migration_claude_code_prompt.md` | Sales Funnel deals migration (completed via this chat instead) |

## Innovation Schema (Ready for Development)

The `innovation` schema has 7 tables already created and waiting for the Innovation Maturity Platform:
- `innovation.sessions` — Assessment sessions
- `innovation.analyses` — Company maturity analyses
- `innovation.maturity_dimensions` — Per-dimension scores
- `innovation.ecosystem_matches` — Company-to-member matching
- `innovation.interactions` — User interactions with platform
- `innovation.leads` — Generated leads from assessments
- `innovation.conversations` — Chatbot conversation history

All tables have proper indexes, FKs to public CRM tables, and embedding columns for AI matching.
