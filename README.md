# The Beacon 2.0 — System Context & Architecture Reference
## The single document any AI or developer needs to understand the entire system
### Version 1.0 | April 2026

---

## How to Use This Document

**This document is designed to be read by AI assistants (Claude, Claude Code, Cursor, Copilot) and human developers.** It provides the complete context needed to understand *why* every component exists, *how* they connect, and *what decisions led to this architecture*. Include this document in any AI assistant context, Claude Project, or Claude Code session that works on The Beacon's systems.

When making changes to the system, always:
1. Read this document first for context
2. Check the relevant ADR for the specific component
3. Make the change
4. Update this document and/or create a new ADR if the change is architectural

---

## 1. Organization Context

### What is The Beacon?

The Beacon is a business community and innovation hub in Antwerp, Belgium. It operates at the intersection of technology innovation and traditional industries (maritime, port operations, logistics, chemicals). The Beacon provides physical workspace (coworking, offices, meeting rooms, event space, recording studio), organizes 70+ events per year (~4,000 attendees), and actively connects its ~200 member companies (~600 individual contacts) through matchmaking and community programs.

### Revenue model

Four distinct revenue streams, each with different operational requirements:

| Stream | Tiers | Price range | Sales cycle |
|--------|-------|-------------|-------------|
| Tech memberships | Starter / Accelerator / Champion | €1,500-€10,000/year | Community-driven, inbound |
| Industry partnerships | Explore / Engage / Strategic | €5,000-€15,000/year | Outbound, relationship-driven |
| À la carte services | Innovation Challenge, Sessions, Workshops | €1,200-€7,500 per engagement | Project-based |
| Facility/Building | Offices, meeting rooms, event space, studio | Variable | Lease-based or per-booking |

### Team (4 people — critical constraint)

| Name | Role | Primary systems | What they need from AI |
|------|------|-----------------|----------------------|
| Inés | Managing Director | High-level dashboards, board reports | Automated reporting, KPI summaries |
| Robin | Community Manager & BD | CRM, deals, meetings, matchmaking | Meeting prep, task prioritization, email drafting, member intelligence |
| Marijn | Facility Manager & Admin | Invoicing, building, offices, onboarding | Overdue alerts, contract expiry warnings, booking management |
| Vincent | Communications & Marketing | Newsletters, social media, events | Content generation, audience segmentation, event recommendations |

**Critical constraint:** No dedicated developer. Robin and Vincent can build n8n workflows and basic API integrations. Edge Functions require TypeScript knowledge. For complex development, use Claude Code or engage a freelancer.

---

## 2. Technology Stack — What Runs Where and Why

### Decision: Why these specific tools?

Each tool was chosen for a specific reason tied to The Beacon's constraints. Understanding the *why* prevents future "let's add tool X" decisions that create unnecessary complexity.

### Supabase (The Beacon 2.0 project)

**Role:** Single source of truth. Database, compute, auth, real-time updates, vector search.
**Project ID:** `troftohnocgxcsvswhbo`
**Region:** eu-west-1 (Frankfurt — GDPR compliant, low latency from Belgium)
**PostgreSQL version:** 17.6

**Why Supabase and not a raw database or Firebase?**
- PostgreSQL gives us pgvector for AI embeddings, JSONB for flexible matchmaking fields, and full SQL power
- PostgREST provides an instant REST API for every table without writing server code
- Edge Functions (Deno/TypeScript) handle compute-heavy operations without a separate server
- Supabase Auth handles user login for any member-facing pages
- Realtime subscriptions enable live presence updates
- Single managed platform = one bill, one dashboard, one place to monitor

**What lives in Supabase:**
- All ~50 database tables (public schema + innovation schema)
- All vector embeddings (pgvector, 1536 dimensions)
- Edge Functions for: embedding generation, RAG search, Innovation Platform analysis, matchmaking engine
- Auth configuration for member-facing pages
- The `ai_tool_definitions` table (dynamic AI tool registry)
- The `knowledge_base` table (prompt templates and reference documents)

**What does NOT live in Supabase:**
- Workflow orchestration (that's n8n)
- Daily UI for the team (that's Monday.com)
- Member portal, bookings, events (that's Nexudus)
- Version-controlled source files (that's GitHub)

### n8n (Self-hosted or cloud)

**Role:** The nervous system. All automations, all AI API calls, all data routing between systems.

**Why n8n and not Zapier/Make/custom code?**
- Visual workflow builder — Robin and Vincent can create and modify automations without coding
- Self-hostable — no per-execution pricing that explodes at scale (Zapier would cost €500+/month for our volume)
- HTTP Request node can call any API (Claude, Supabase PostgREST, Monday GraphQL, Nexudus REST, Mailchimp, calendar APIs)
- Built-in error handling, retry logic, and webhook support
- Workflow JSON is exportable and version-controllable in GitHub

**What n8n does:**
- All scheduled jobs (morning digest, priority recalculation, weekly event scan, engagement scoring)
- All webhook processing (Monday item changes, Nexudus check-ins, calendar events)
- All AI API calls (Claude for briefings, summaries, scoring, email drafts, analysis)
- All data sync between Monday ↔ Supabase ↔ Nexudus
- All notification delivery (Slack messages, email digests)

**What n8n does NOT do:**
- Serve real-time user interactions (too slow — use Edge Functions for that)
- Store data persistently (that's Supabase)
- Provide a user interface (that's Monday/Nexudus)

### Monday.com

**Role:** Daily UI for the internal team. Where Robin, Vincent, and Marijn do their work.

**Why Monday.com and not Airtable/Notion/direct Supabase?**
- The team already uses it and knows it well — zero adoption friction
- Board views, dashboards, and automations cover 90% of daily CRM needs
- Robin's pull-based task system (board ID: 8339394119) is already built and working
- GraphQL API enables bidirectional sync with Supabase via n8n

**What Monday.com owns (source of truth for):**
- Account and contact master data (Robin edits here, synced to Supabase)
- Deal pipeline (Robin manages here, synced to Supabase)
- Task management (pull-based system, bidirectional sync with Supabase for AI scoring)
- OKRs and goals

**What Monday.com displays (read from Supabase):**
- AI-generated suggestions (pushed from Supabase via n8n)
- Engagement scores (calculated in Supabase, displayed in Monday)
- Meeting briefings (generated in Supabase, attached to Monday items)
- Competitive intelligence (weekly digest items)

### Nexudus

**Role:** Member-facing platform. Bookings, events, check-in, community portal.

**Why Nexudus?**
- Purpose-built for coworking/innovation hubs — handles bookings, invoicing, access control natively
- Salto KS integration for NFC building access with automatic check-in
- Member portal with "Who is in?" presence visibility
- Event management with registration and check-in
- REST API for data sync to Supabase

**What Nexudus owns (source of truth for):**
- Facility bookings (meeting rooms, desks, event space)
- Member check-ins and presence (via Salto badge, WiFi, NexIO tablet, Passport app)
- Event registrations and attendance
- Member portal content and visibility

### Claude API (Anthropic)

**Role:** AI intelligence. Called via n8n workflows or Edge Functions. Not a platform — an API.

**Why Claude and not GPT/Gemini?**
- Superior reasoning quality for complex tasks (matchmaking, analysis, strategy)
- Tool-use support for structured AI capabilities
- Anthropic's API pricing is competitive for our volume (~€200-250/year total)
- This Claude Project with MCP connections serves as the interactive AI interface

**How Claude is called:**
- From n8n: HTTP Request node to `https://api.anthropic.com/v1/messages`
- From Edge Functions: fetch() to the same endpoint
- From this Claude Project: directly via conversation (MCP connections to Supabase + Monday)

**Models used:**
- `claude-sonnet-4-20250514` for routine tasks (scoring, classification, short generation)
- `claude-opus-4-6` for complex reasoning (matchmaking, competitive analysis, meeting summaries)

### GitHub Repository: `beacon-operations`

**Role:** Version control for all configuration, code, and documentation.

**Repository structure:**
```
beacon-operations/
├── README.md                        — This document (system context)
├── docs/
│   ├── beacon_supabase_schema.md    — Complete database schema reference
│   ├── beacon_ai_automation_roadmap.md — All AI capabilities with specs
│   ├── beacon_implementation_plan.md   — Phased rollout plan
│   └── adrs/                        — Architecture Decision Records
├── prompts/                         — AI prompt templates (markdown)
├── edge-functions/                  — Supabase Edge Functions (TypeScript)
├── migrations/                      — Database migrations (SQL)
├── n8n-workflows/                   — Exported workflow JSON (backup)
└── tests/                           — Validation queries
```

### VS Code

**Role:** Code editor. Not a platform — a local tool for editing files in the GitHub repo.

### Tools we explicitly chose NOT to use (and why)

| Tool | Why not |
|------|---------|
| **Python** | Every AI call goes through n8n HTTP nodes or Edge Functions (TypeScript). No ML training needed. |
| **Vercel** | No custom frontend yet. Edge Functions handle compute. |
| **LangChain/LlamaIndex** | Our RAG is simple: embed query → pgvector similarity search → inject context into Claude prompt. |
| **Pinecone/Weaviate** | pgvector in Supabase IS our vector database. |
| **Zapier** | Per-execution pricing would be €500+/month at our automation volume. n8n is flat-cost. |
| **Firebase** | No PostgreSQL, no pgvector, no Edge Functions with Deno. |

---

## 3. Data Ownership & Consistency Model

### Source of truth per data entity

| Data entity | Owner system | Direction | Sync method |
|-------------|-------------|-----------|-------------|
| Account/contact master data | Monday.com | Monday → Supabase | n8n webhook on Monday item change |
| Deal pipeline | Monday.com | Monday → Supabase | n8n webhook on Monday item change |
| Tasks (pull-based) | Bidirectional | Monday ↔ Supabase | n8n webhook both ways. Conflict: latest `updated_at` wins |
| AI outputs (briefings, suggestions, scores) | Supabase | Supabase → Monday | n8n pushes display items to Monday |
| Engagement scores | Supabase | Supabase → Monday | Calculated weekly in Supabase, synced to Monday |
| Bookings, check-ins | Nexudus | Nexudus → Supabase | n8n polls Nexudus API every 5 min |
| Event registrations | Nexudus | Nexudus → Supabase | n8n webhook on Nexudus event |
| Calendar events | Microsoft 365 | Calendar → Supabase | n8n polls calendar API daily at 7am |
| Innovation Platform data | Supabase | Supabase only | Edge Functions write directly |

### Consistency rules

1. **Supabase is always queried for AI operations.** When the AI needs context, it reads from Supabase, never from Monday or Nexudus directly.
2. **One owner per entity.** Prevents conflicting updates.
3. **Last write wins for bidirectional sync.** Every table has `updated_at`.
4. **`status_changes` catches everything.** The audit log enables debugging any sync discrepancy.

---

## 4. AI System Architecture

### How AI capabilities work

Every AI capability follows the same pattern:

```
TRIGGER (n8n schedule, webhook, or manual)
  → GATHER CONTEXT (SQL queries against Supabase)
  → LOAD PROMPT (from knowledge_base table or GitHub prompts/*.md)
  → CALL CLAUDE API (via n8n HTTP Request or Edge Function)
  → WRITE RESULTS (to appropriate Supabase table)
  → NOTIFY (Slack, email, Monday item, or in-app)
  → LOG (to ai_logs with feature, tokens, latency, quality)
```

### Prompt management (ADR-005)

Every AI prompt template is a markdown file in `prompts/`. Git commit history tracks every change. The `ai_logs.prompt_hash` field records which version of the prompt produced each output.

### RAG (Retrieval-Augmented Generation)

1. **Embedding generation:** Edge Function calls `text-embedding-3-small` on `search_text` generated column → stores 1536-dim vector in `embedding` column.
2. **Semantic search:** Query embedded → pgvector cosine distance → top results returned.
3. **Context injection:** Results injected into Claude prompt as context.

**No external vector DB needed.** pgvector handles similarity search directly in PostgreSQL.

### AI tool registry (ADR-009)

`ai_tool_definitions` table stores tool definitions read at runtime. Adding a new AI skill = INSERT a row, not deploying code.

---

## 5. Architecture Decision Records (ADR Index)

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Supabase as single database | Accepted |
| ADR-002 | n8n as automation layer | Accepted |
| ADR-003 | JSONB for matchmaking fields | Accepted |
| ADR-004 | Pull-based task system | Accepted |
| ADR-005 | Prompts as code | Accepted |
| ADR-006 | Monday.com as daily UI | Accepted |
| ADR-007 | Nexudus for facility + community | Accepted |
| ADR-008 | No Python, no Vercel | Accepted |
| ADR-009 | AI tool definitions table | Accepted |
| ADR-010 | Claude Project as primary AI interface | Accepted |

---

## 6. Operational Reference

### Key identifiers

| System | Identifier | Value |
|--------|-----------|-------|
| Supabase project ID | troftohnocgxcsvswhbo | The Beacon 2.0 |
| Supabase region | eu-west-1 | Frankfurt |
| Monday.com workspace | 3270747 | The Beacon 2.0 |
| Monday pull-based board | 8339394119 | Robin's Pull-Based System |
| Monday subitems board | 9005054987 | Subitems van Robin's Pull-Based System |
| Monday OKR board | 5747273783 | Doelstellingen 2025 |
| Old Innovation Supabase | lwsjjwcxyvfvumpleugc | To be deprecated after Phase 12 |

### Estimated AI API costs

Total annual estimate: ~€200-300/year for all capabilities combined.

---

*The Beacon 2.0 System Context & Architecture Reference v1.0*
*This document should be included in every Claude Code session, Claude Project, and developer onboarding.*
*Last updated: April 2026 | Maintained by: Robin & Claude Architecture Lab*
