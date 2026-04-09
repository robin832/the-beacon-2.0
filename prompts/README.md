# Prompts

The canonical prompt files that the Edge Functions use at runtime are located in:

```
supabase/functions/_shared/prompts/
```

Edit the files there — the Edge Functions load them directly using `Deno.readTextFile()`.

The 3 prompt files used by the Innovation Platform:
- `company-lookup.md` — Company identification (used by `company-lookup` Edge Function)
- `innovation-analysis.md` — Innovation opportunity analysis (used by `innovation-analysis` Edge Function)
- `ecosystem-matching.md` — Ecosystem matchmaking (used by `ecosystem-matching` Edge Function)

Other prompt files in this directory are used by n8n workflows and are NOT loaded by Edge Functions.
