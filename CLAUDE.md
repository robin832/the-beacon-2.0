# The Beacon 2.0 — Instructions for Claude Code

## Before you do anything non-trivial

**Read these two files first.** They exist precisely so you don't have to rediscover context every session:

- [`docs/state.md`](docs/state.md) — what's currently deployed, how the pieces fit together, where the known rough edges are.
- [`docs/lessons-learned.md`](docs/lessons-learned.md) — append-only log of traps, surprising behaviors, and decisions. Check it before proposing a fix — the problem you're about to solve may already have a documented answer or a known dead-end.

Skip this step only for trivial questions ("what's in this file?"). For any task that touches edge functions, the database, the report/tryout pages, or the matchmaking pipeline, read both first.

## After you finish work

**Update both files when the work warrants it.** Be selective — not every commit needs an entry. Add to them when:

- **`state.md`** — anything architectural changed: a new edge function, a schema change, a model swap, a new data flow, a removed section, a pipeline you rewired. Update the relevant section in-place; don't just append. Bump the date at the top.
- **`lessons-learned.md`** — you hit something non-obvious that cost you time and would cost the next engineer (human or Claude) the same time. A silent failure mode, a CLI footgun, a label mismatch, a race condition. Append at the top (most-recent-first). Keep it specific: what happened, what caused it, what the fix was, what the generalizable lesson is. Don't write "we learned to be careful" — write "X tool silently resets Y setting on every invocation."

If a task has no documentation implications, don't force one. Empty entries are worse than missing entries.

## Project-specific operational rules

These are rules you'd otherwise trip over. Keep them in mind even when you haven't re-read `state.md` yet:

- **Supabase project ref:** `troftohnocgxcsvswhbo` (eu-west-1). Only use `mcp__supabase__*` tools for DB work on this project.
- **Edge function CLI deploys silently reset `verify_jwt: true`.** Always deploy `ecosystem-matching` and `company-lookup` with `--no-verify-jwt` or function-to-function invocation will 401. Documented in `lessons-learned.md` 2026-04-20.
- **`innovation-platform/` uses Next.js 16 with breaking changes.** Read `innovation-platform/AGENTS.md` before writing frontend code — APIs and conventions differ from older Next.js you may know.
- **Models:** All edge functions use `claude-sonnet-4-20250514`. Don't swap model IDs without testing — unversioned aliases can silently hang (see `lessons-learned.md` 2026-04-20).
- **LLM text output is not safe to display raw.** The web_search tool emits `<cite index="...">` tags. Strip them before writing to user-visible fields. There's a sanitizer already in place in both `company-lookup` and `innovation-analysis`.
- **`innovation.analyses.updated_at` has no trigger.** Don't use it to measure run duration — it equals `created_at` forever.

## Coding conventions

Inherited from the repo — mostly obvious, but worth restating:

- Don't create documentation or README files unless the user explicitly asks. The two exceptions are `state.md` and `lessons-learned.md` above, which you can and should update without asking.
- Don't add comments that explain *what* obvious code does. Only write a comment when the *why* is non-obvious (hidden constraint, workaround for a specific bug, surprising invariant).
- Edit existing files over creating new ones.
- Don't commit changes unless explicitly asked.
- When deploying edge functions, the script size in the output tells you nothing useful — only errors matter. Success prints "Deployed Functions on project ...".
