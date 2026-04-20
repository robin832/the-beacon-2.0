# Platform State — 2026-04-20 (matchmaking rev 2)

Living snapshot of what's deployed and how it behaves. Update when you change something material.

---

## Stack

- **Frontend:** Next.js 16 (`innovation-platform/`) — VSCode extension conventions in `AGENTS.md` (APIs differ from public Next.js docs).
- **Backend:** Supabase edge functions (Deno) in `supabase/functions/`.
- **Project ref:** `troftohnocgxcsvswhbo` (eu-west-1).
- **AI model:** `claude-sonnet-4-20250514` across all functions. Web search via `web_search_20250305` tool.

---

## Edge functions

| Function | verify_jwt | Purpose |
|---|---|---|
| `company-lookup` | false | Resolves a user-entered company name into candidates (name, website, industry, description). Uses `max_uses: 5` web searches. |
| `innovation-analysis` | true | The long analysis. Runs in background via `EdgeRuntime.waitUntil` — HTTP returns `{status:"started"}` within ~2s; actual work continues. Max 6 web searches, 8000 output tokens, 240s Anthropic timeout. |
| `ecosystem-matching` | false | Fires from `innovation-analysis` when analysis completes. Pre-scores ~67 tiered members, hands top 9 to Claude for rationales, writes 6 match rows (3 visible, 3 locked). |
| `submit-lead`, `create-session`, `track-event`, `get-analysis`, `update-analysis`, `eventbrite-import` | false | Supporting utilities (untouched in current work). |

**Authentication pattern:** `innovation-analysis` uses service-role bearer when calling `ecosystem-matching`; `ecosystem-matching` must stay `verify_jwt: false` or that call 401s. (CLI deploys default `verify_jwt` to `true` — always pass `--no-verify-jwt` for `ecosystem-matching` and `company-lookup`.)

---

## Matchmaking pipeline

### 1. Pre-scoring (deterministic, in edge function)
For each active member with `membership_tier IS NOT NULL`:
- **Industry overlap (dominant):** number of the member's `industry_verticals` that contain any prospect-vertical keyword. Keywords are expanded via an alias map that bridges canonical analysis labels (e.g. "Logistics & Supply Chain") to the older member-side labels (e.g. "Logistics / Forwarding Industry", "Port Industry"). **6-point floor** if any overlap exists + **4 points per overlap**.
- **Technology overlap:** case-insensitive substring match, 1 point each.
- **Use-case ↔ pain-point match:** 0.8 points each.
- **Has description:** 0.3 point tie-breaker.

### 2. Eligible tiers
Only these `membership_tier` values participate — organizational relationships (Ecosystem/Founding/Public/Education Partner) are excluded from matchmaking:
`Tech Starter`, `Tech Accelerator`, `Tech Champion`, `Private Office`, `Industry Engage`, `Industry Explore`.

### 3. Candidate pool (top 9)
Top 2 from each of Tech Starter / Tech Accelerator / Tech Champion / Private Office guaranteed, then best-overall fills the remaining slots up to 9. Deduped, re-sorted by score. This ensures Private Office specialists (Dockflow, LANARK, etc.) have a fair seat at the table.

### 4. Claude ranks + writes rationales
- Model sees prospect profile + top 9 candidates + real Beacon use case themes (from `knowledge_base`).
- Emits JSON array with `why_this_match`, `match_evidence`, `member_expertise`, `conversation_starter`, `shared_sectors`, `teaser_text`.

### 5. Visible slot selection (flexible tier diversity)
Greedy pick 3 visible slots by Claude's ranking, enforcing **distinct tiers**:
- Rank 1 visible = Claude's best overall.
- Rank 2 visible = best whose tier ≠ rank 1's tier.
- Rank 3 visible = best whose tier ≠ ranks 1 & 2's tiers.
- Fallback to next-best if fewer than 3 distinct tiers exist in the candidate set.

This guarantees up to 3 *different* tiers on screen without forcing a specific tier trio. A logistics prospect can see Private Office + Tech Starter + Tech Accelerator if that's the relevance ordering; a tech prospect can see Tech Champion + Tech Accelerator + Tech Starter.

- **Rank 4–6 locked:** remaining 3 by Claude's ranking.

**Rendering:**
- `/report/[id]` — ecosystem matches **NOT shown** (removed on user request 2026-04-20).
- `/tryout/[id]` — all 6 matches shown; visible cards use `MatchCard` with full rationale, locked cards show evidence teaser + blurred name/tier.

---

## Background-task architecture (innovation-analysis)

- Synchronous portion returns HTTP 200 in ~2s with `{success:true, analysis_id, status:"started"}`.
- `runAnalysisInBackground()` runs via `EdgeRuntime.waitUntil` and steps:
  `researching → analyzing → matching → complete`.
- On exception: sets `analysis_status='error'` and writes error message to `data_confidence_explanation` with prefix `bg-task error:`.
- **Breadcrumbs:** `data_confidence_explanation` is stamped `[debug] before-anthropic | anthropic-returned status=... | parsed outputLen=...` as the task progresses. If a row hangs, query that field to see the last checkpoint. Successful runs overwrite it with the real confidence explanation from Claude.

**Frontend polling:** `/analyzing` polls `analyses.analysis_status` every 4s with a 270s client-side timeout. On `complete` → navigate to `/report/{id}`. On `error` or timeout → "Analysis Taking Longer Than Expected" screen.

---

## Beacon ecosystem context injection

Both `innovation-analysis` and `ecosystem-matching` pull from `knowledge_base` and `events` via `_shared/beacon-context.ts`:

- `getUseCasesForVerticals()` — matches `knowledge_base.resource_type = 'Use Case Library'` where `industries @> [vertical]`.
- `getEventsForVerticals()` — prefers upcoming, falls back to recent past from `events.industry_focus`.
- `getServiceDescriptions(track)` — filters by `resource_type = 'Service Description'` and category matching inferred track (`industry` → Industry Partnerships; `tech` → Tech Memberships).
- `getReferenceAnalyses()` — the 2 gold-standard examples (Borealis, Katoen Natie) with `resource_type = 'prospect_example'`.

`inferTrack(industry, verticals)` maps industrial verticals → `industry`, tech/software → `tech`, unknown → `both`. The edge function filters `analysisData.recommended_offerings` server-side to only titles from the allowed track.

---

## Data quality (as of 2026-04-20)

- `knowledge_base`: 43 rows (use cases, services, programs, about/strategy, 2 reference analyses).
- `events`: 185 total, 32 in 2025 with real attendee numbers backfilled.
- `accounts`: ~67 tiered (27 Starter, 36 Accelerator, 4 Champion) + 32 Private Office + 31 partners/education/misc. Industry verticals on members use older labels that require alias mapping to match canonical analysis labels.

---

## Report page sections (top to bottom)

1. Sticky orange AI disclaimer bar (`sticky top-0 z-[60]`).
2. Hero.
3. What Stood Out.
4. Industry Landscape + Strategic Priorities (two-column).
5. **Dimensions** — includes nested "Detected Technologies" sub-section (moved from its own section 2026-04-20).
6. **Innovation Opportunities** — cards + Recommended Beacon Offerings (Quick Win / "Start This Quarter" removed 2026-04-20).
7. Sources & Methodology.
8. Rating + CTA — required rating unlocks "Claim Your Free Tryout"; optional feedback below; secondary regenerate link.

---

## Tryout page

- Fetches analysis + ecosystem matches (polls every 5s up to 90s for matches that arrive after the user clicks through).
- 3-column grid: 3 visible match cards + 3 locked.
- "A Day at The Beacon" section with lightbox gallery.
- Free matching event section.
- CTA: Book with Robin (Calendly) + email fallback.

---

## Loading screen (`/analyzing`)

- Split view: terminal loader on left, industry briefing on right.
- Industry briefing pulls from `innovation-platform/lib/industry-content.ts`: facts rotator + news ticker (non-clickable — links were misleading) + poll sequence (3 polls per industry, each shown once then a "thanks" closer).
- Static ETA hint at top: "Usually takes 60–90 seconds. Deep analyses can run up to 3 minutes."
- Quotes deleted (feedback: they weren't funny).

---

## Known limitations / open work

- **Web search is sequential.** Claude runs each `web_search_20250305` call one at a time; 6 searches × ~10s avg ≈ 60s minimum. Not controllable from our side.
- **`updated_at` has no trigger** on `innovation.analyses` — it stays equal to `created_at` because writes don't include it. Don't use row timestamps to infer run duration.
- **Headlines in `industry-content.ts` are hand-curated placeholders.** TODO in the file mentions a planned n8n workflow to refresh weekly.
- **Visible tier variety is opportunistic, not guaranteed.** If the candidate set only spans 2 tiers (e.g. all Tech Starters + one Private Office), only 2 distinct tiers appear visible and the third slot is next-best-overall.
