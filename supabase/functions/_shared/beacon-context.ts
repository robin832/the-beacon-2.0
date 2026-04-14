// Fetches real Beacon ecosystem context (use cases, events, services,
// reference analyses) from Supabase and formats it for injection into the
// innovation-analysis and ecosystem-matching prompts. All helpers fail soft:
// they return [] / "" on error so prompt generation never breaks.

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const TRACK_CATEGORY: Record<"industry" | "tech", string> = {
  industry: "Industry Partnerships",
  tech: "Tech Memberships",
};

const MAX_DESC = 450;

function truncate(s: string | null | undefined, n = MAX_DESC): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

type KbRow = { title: string; description: string };
type EventRow = {
  name: string;
  event_date: string;
  actual_attendees: number | null;
  industry_focus: string[] | null;
  topics: string[] | null;
};

// Use cases relevant to the prospect's verticals. Matches any of the provided
// verticals against the `industries` JSONB array. Returns up to `limit`
// entries, deduped by title.
export async function getUseCasesForVerticals(
  publicClient: SupabaseClient,
  verticals: string[],
  limit = 5,
): Promise<KbRow[]> {
  if (!verticals || verticals.length === 0) return [];
  try {
    const results = new Map<string, KbRow>();
    for (const vertical of verticals) {
      const { data } = await publicClient
        .from("knowledge_base")
        .select("title, description")
        .eq("resource_type", "Use Case Library")
        .contains("industries", [vertical])
        .limit(limit);
      for (const row of (data || []) as KbRow[]) {
        if (!results.has(row.title)) results.set(row.title, row);
        if (results.size >= limit) break;
      }
      if (results.size >= limit) break;
    }
    return Array.from(results.values()).slice(0, limit);
  } catch (err) {
    console.error("[beacon-context] getUseCasesForVerticals failed:", err);
    return [];
  }
}

// Events matching any of the prospect's verticals. Prefers upcoming; falls
// back to most recent completed events when no upcoming ones exist so the
// prompt always has something real to reference.
export async function getEventsForVerticals(
  publicClient: SupabaseClient,
  verticals: string[],
  limit = 5,
): Promise<EventRow[]> {
  if (!verticals || verticals.length === 0) return [];
  try {
    const nowIso = new Date().toISOString();
    const results = new Map<string, EventRow>();

    for (const vertical of verticals) {
      const { data: upcoming } = await publicClient
        .from("events")
        .select("name, event_date, actual_attendees, industry_focus, topics")
        .contains("industry_focus", [vertical])
        .gte("event_date", nowIso)
        .order("event_date", { ascending: true })
        .limit(limit);
      for (const row of (upcoming || []) as EventRow[]) {
        if (!results.has(row.name)) results.set(row.name, row);
      }
    }

    if (results.size < limit) {
      for (const vertical of verticals) {
        const { data: recent } = await publicClient
          .from("events")
          .select("name, event_date, actual_attendees, industry_focus, topics")
          .contains("industry_focus", [vertical])
          .lt("event_date", nowIso)
          .order("event_date", { ascending: false })
          .limit(limit);
        for (const row of (recent || []) as EventRow[]) {
          if (!results.has(row.name)) results.set(row.name, row);
          if (results.size >= limit) break;
        }
        if (results.size >= limit) break;
      }
    }

    return Array.from(results.values()).slice(0, limit);
  } catch (err) {
    console.error("[beacon-context] getEventsForVerticals failed:", err);
    return [];
  }
}

// Service descriptions for the right track. 'both' includes à la carte too.
export async function getServiceDescriptions(
  publicClient: SupabaseClient,
  track: "industry" | "tech" | "both" = "both",
): Promise<KbRow[]> {
  try {
    const categories: string[] = [];
    if (track === "industry" || track === "both") categories.push(TRACK_CATEGORY.industry);
    if (track === "tech" || track === "both") categories.push(TRACK_CATEGORY.tech);
    categories.push("À la Carte Services");

    const { data } = await publicClient
      .from("knowledge_base")
      .select("title, description")
      .eq("resource_type", "Service Description")
      .in("category", categories);
    return (data || []) as KbRow[];
  } catch (err) {
    console.error("[beacon-context] getServiceDescriptions failed:", err);
    return [];
  }
}

// The 2 reference analyses (Borealis, Katoen Natie) — used as quality
// benchmarks so Claude can see what "gold standard" Beacon output looks like.
export async function getReferenceAnalyses(
  publicClient: SupabaseClient,
): Promise<KbRow[]> {
  try {
    const { data } = await publicClient
      .from("knowledge_base")
      .select("title, description")
      .eq("resource_type", "prospect_example");
    return (data || []) as KbRow[];
  } catch (err) {
    console.error("[beacon-context] getReferenceAnalyses failed:", err);
    return [];
  }
}

// Heuristic: industrial prospects get the Industry Partnership track, tech
// vendors get the Tech Membership track. Falls back to 'both' if unsure.
export function inferTrack(
  industry: string | null | undefined,
  verticals: string[] | null | undefined,
): "industry" | "tech" | "both" {
  const hay = [industry || "", ...(verticals || [])].join(" ").toLowerCase();
  if (/technology|software|saas|it services/.test(hay)) return "tech";
  if (/maritime|port|logistics|chemical|manufacturing|energy|construction|healthcare|financial/.test(hay)) return "industry";
  return "both";
}

export function formatUseCasesForPrompt(rows: KbRow[]): string {
  if (rows.length === 0) return "";
  const items = rows.map((r) => `- **${r.title}**: ${truncate(r.description)}`).join("\n");
  return `### Relevant Beacon Use Case Themes

These are real use case patterns from The Beacon's member library that match this prospect's industry. Reference them by name when framing opportunities or matches:

${items}
`;
}

export function formatEventsForPrompt(rows: EventRow[]): string {
  if (rows.length === 0) return "";
  const now = Date.now();
  const items = rows.map((e) => {
    const date = new Date(e.event_date);
    const when = date.getTime() > now ? "Upcoming" : "Past";
    const dateStr = date.toISOString().slice(0, 10);
    const attendees = e.actual_attendees ? ` — ${e.actual_attendees} attendees` : "";
    const topics = (e.topics || []).slice(0, 3).join(", ");
    return `- ${when} (${dateStr}): **${e.name}**${attendees}${topics ? ` — topics: ${topics}` : ""}`;
  }).join("\n");
  return `### Real Beacon Events Relevant To This Prospect

These are actual events The Beacon has hosted or is hosting for this industry. Reference specific ones by name in \`beacon_relevance\` when arguing why The Beacon fits:

${items}
`;
}

export function formatServicesForPrompt(rows: KbRow[]): string {
  if (rows.length === 0) return "";
  const items = rows.map((r) => `- **${r.title}**: ${truncate(r.description, 350)}`).join("\n");
  return `### Beacon Service Offerings (real, current catalogue)

Use these when filling \`recommended_offerings\`. Pick offerings by name from this list, and make \`match_reason\` specific to the content of the description:

${items}
`;
}

export function formatReferenceAnalysesForPrompt(rows: KbRow[]): string {
  if (rows.length === 0) return "";
  const items = rows.map((r) => `#### ${r.title}\n${truncate(r.description, 800)}`).join("\n\n");
  return `### Reference Analyses — Gold Standard Examples

These are manually-authored Beacon analyses. Match this level of specificity (named projects, named Beacon members, concrete engagement plans):

${items}
`;
}
