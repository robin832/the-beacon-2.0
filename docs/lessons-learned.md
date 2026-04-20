# Lessons Learned

Append-only log of decisions, mistakes, and non-obvious things worth remembering. Most recent first.

---

## 2026-04-20 — Pre-scoring industry relevance matters more than scoring formula

**Symptom:** For Remant (a logistics company), the 3 visible ecosystem matches were NTT Belgium, Pronect, and De Cronos Groep — all generic IT service providers, none in logistics. User read this as "the 1-per-tier rule is broken."

**Actual cause:** The tier rule was fine (one Tech Starter + one Accelerator + one Champion was being picked). The problem was upstream in pre-scoring:
- Industry relevance was a 0/1 binary at weight 0.3; tech overlap was unbounded at weight 0.35.
- Members' `industry_verticals` use older labels ("Logistics / Forwarding Industry", "Port Industry") while the analysis emits canonical labels ("Logistics & Supply Chain"). Without aliasing, many logistics specialists failed the industry check entirely.
- Result: a generic IT member with 4 overlapping techs (1.4 points) beat a logistics specialist with 1 industry match (0.3 points).

**Fix:** Industry-dominant scoring with keyword aliases: `industryOverlap ≥ 1 ? 6 : 0` floor + `4 × industryOverlap` + tech/use-case as tie-breakers. Logistics specialists (Timefold, Dockflow, Shipnext, Faktion, Delaware) now outrank generic IT vendors by a wide margin.

**Lesson:** When a scoring function mixes dimensions of different scales, the bounded dimension gets dominated. Either bound everything to the same scale or give the one that matters most a step-function bonus (like the 6-point floor) so it's impossible to outrank via accumulation on secondary signals.

**Separate lesson:** Label drift between data sources is silent. The analysis pipeline generates labels from a clean canonical list, but existing DB data was tagged years earlier under a different taxonomy. Never assume two "industry" columns use the same vocabulary — alias explicitly.

---

## 2026-04-20 — Supabase CLI deploys silently reset `verify_jwt` to `true`

**Symptom:** `ecosystem-matching` started returning 401 to `innovation-analysis`'s service-role-authenticated invocation. No code changed.

**Cause:** `supabase functions deploy <name>` without `--no-verify-jwt` resets the function to JWT-verified mode, even if the previous version had it off. Our innovation-analysis → ecosystem-matching bridge uses a service-role bearer token, which is not a user JWT, so JWT-verify rejects it.

**Lesson:** For any edge function that's invoked function-to-function with the service key (vs. from a browser with a user JWT), always deploy with `--no-verify-jwt`. This is a CLI footgun — the flag doesn't persist across deploys.

---

## 2026-04-20 — Claude `web_search_20250305` leaks `<cite index="...">` tags

**Symptom:** Company descriptions on the confirm page literally rendered `<cite index="1-1,30-5">Remant is a trusted…</cite>`.

**Cause:** The tool emits inline citation markers in text output. Without explicit stripping they pass straight through JSON parsing into user-visible fields.

**Fix:** A recursive walker in `innovation-analysis` (`stripCitationsDeep`) and a per-field sanitizer in `company-lookup` that runs `.replace(/<\/?cite(?:\s[^>]*)?>/g, "")` on every string before DB write.

**Lesson:** Any model output that's displayed raw should be sanitized for tool-emitted markup. Citation tags are one; others to watch: `<search_quality_reflection>`, tool-use metadata, etc. Treat LLM text output like untrusted HTML — strip or escape.

---

## 2026-04-20 — Unversioned model aliases can silently hang an edge function

**Symptom:** Remant analysis stuck in `analyzing` for 24 minutes, no error ever written. Frontend hit its 270s timeout and showed "Analysis Taking Longer Than Expected."

**Cause:** We swapped the model name from `claude-sonnet-4-20250514` to `claude-sonnet-4-6` (what the environment said was the current Sonnet 4.6 ID). The Anthropic API rejected it in a way that didn't hit our existing `result.error || result.type === 'error'` check — the bg task just waited indefinitely until the Supabase edge runtime killed the isolate past its wall-clock limit. Because the isolate was killed (not an exception thrown), our try/catch never fired to mark the row as errored.

**Fix:**
1. Reverted to the fully-versioned `claude-sonnet-4-20250514` snapshot.
2. Added breadcrumb writes to `data_confidence_explanation` at each step of the bg task so the next silent hang is debuggable from SQL.
3. Reduced `max_uses` from 8 → 6 — 8 searches × ~12s avg was pushing some complex prospects past the runtime limit where the catch can't run.

**Lesson:** Background tasks that don't bubble up their own failures need external observability — don't rely on try/catch alone because the isolate can be destroyed out from under you. Checkpoint progress into a DB field at every major async boundary so post-mortem is possible.

**Second lesson:** When changing a model ID, don't assume environment-provided aliases work with the versioned Anthropic API. Prefer fully-dated snapshot IDs (`claude-sonnet-4-5-20250929`) and confirm with a test call before deploying.

---

## 2026-04-20 — `EcosystemMatches` component existed but was never imported

**Symptom:** User reported "ecosystem matching is broken." Matches were being written to the DB correctly (6 rows per analysis), but nothing rendered on the report page.

**Cause:** Classic orphaned component. `components/report/EcosystemMatches.tsx` was fully implemented, the types existed, the edge function wrote the data — but `app/report/[analysisId]/page.tsx` never imported or rendered it.

**Lesson:** When a "feature is broken" report comes in, first check the rendering path, not the data. DB queries confirm data; only actual UI imports prove it's on the page. ("The data is there" ≠ "the user sees it.")

(The ecosystem section was later removed from the report page by user decision 2026-04-20 — but the tryout page still uses the same component/data.)

---

## 2026-04-20 — Client-side polling timeout ≠ backend failure

**Symptom:** User saw "Analysis Taking Longer Than Expected" screen on `/analyzing` and assumed the backend failed.

**Cause:** That screen is triggered by a 270s `setTimeout` in the client — it's a UX bailout, not a backend status. The background task may still be running successfully; the UI has just stopped waiting.

**Lesson:** When debugging "it didn't finish" reports, always check the DB row status directly. Frontend timers and backend state are independent. Also: make sure the client timeout is generous enough to cover realistic worst-case backend runtimes, otherwise users report false failures.

---

## 2026-04-20 — Background tasks make fast-click race conditions possible

**Symptom:** Tryout page rendered an empty matches grid right after a user completed analysis and clicked straight through.

**Cause:** `ecosystem-matching` fires as a background task after `innovation-analysis` marks `status='complete'`. There's a ~30–60s window where the report is viewable but matches aren't in the DB yet. Fast users hit an empty grid.

**Fix:** The tryout page polls `ecosystem_matches` every 5s (up to 90s) while the result set is empty, and shows a "Matching you with Beacon members…" skeleton in the meantime.

**Lesson:** Any UI that reads data produced by a background job needs a polling/skeleton state. "Fire and forget on the backend" requires "wait and show progress" on the frontend.

---

## 2026-04-15 — Decouple HTTP response from long work (background tasks)

**Context:** The innovation-analysis function was synchronous. A 120s Claude call held the HTTP request open, and 504 gateway timeouts fired for complex prospects. Users saw "Analysis Taking Longer Than Expected" even when work would have completed.

**Fix:** Moved the Claude call + URL verification + DB writes into `EdgeRuntime.waitUntil`. HTTP returns in ~2s; the analyzing page polls the DB. The frontend UX is unchanged for successful runs, and slow runs no longer visibly fail.

**Lesson:** For any long-running function where the caller doesn't need the result body, prefer "start work in background + poll status table" over "hold the HTTP connection open." The HTTP wall-clock is almost always a more aggressive constraint than the actual compute budget.

---

## 2026-04-14 — The DB is the source of truth, not the instruction doc

**Context:** A long implementation brief listed member companies that needed enrichment ("xyzt.ai has no data", "Dockflow has only an 84-char description"). Before writing any SQL, we queried the actual DB — most of that was already done in an earlier pass, and the brief was stale.

**Lesson:** Always diff the brief against the current DB state before acting on "needs enrichment" or "is missing" claims. A fifteen-minute audit query saves an hour of redundant writes and avoids overwriting better data with worse.

---

## 2026-04-13 — Edge function logs in Supabase MCP only return HTTP metadata

**Context:** When debugging silent failures in `innovation-analysis`, `console.error` output isn't visible through `get_logs` — only request/response metadata (status code, timing) is exposed.

**Workaround:** Capture error details into a DB column the bg task writes before the isolate dies (we use `data_confidence_explanation`). Treat the DB as the diagnostic surface for anything happening inside an edge function's bg task.

**Lesson:** Don't rely on console logs for production edge function debugging through the MCP. Design your error paths to leave forensic evidence in tables you can query.
