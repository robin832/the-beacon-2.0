import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Load prompt from shared module — edit _shared/prompts/ecosystem-matching.md then regenerate
import { ECOSYSTEM_MATCHING_PROMPT as SYSTEM_PROMPT } from "../_shared/prompt-ecosystem-matching.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysis_id } = await req.json();

    if (!analysis_id) {
      return new Response(
        JSON.stringify({ error: "analysis_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const innovationClient = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: "innovation" },
    });
    const publicClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the analysis data
    const { data: analysis } = await innovationClient
      .from("analyses")
      .select("*")
      .eq("id", analysis_id)
      .single();

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: "Analysis not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active Beacon members with pre-filtering
    const { data: members } = await publicClient
      .from("accounts")
      .select("id, name, description, technologies, industry_verticals, use_cases, membership_tier, pain_points, collaboration_interests")
      .not("membership_tier", "is", null)
      .is("archived_at", null);

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-score members for relevance to narrow down to top candidates
    const techsDetected = (analysis.technologies_detected as Array<{ technology?: string } | string>) || [];
    const techNames = techsDetected.map((t) => typeof t === "string" ? t : t.technology || "").filter(Boolean);
    const gaps = (analysis.innovation_gaps as Array<{ opportunity?: string; gap?: string } | string>) || [];
    const painPoints = (analysis.pain_points_detected as Array<{ pain_point?: string } | string>) || [];

    const scored = members.map((member) => {
      const memberTechs = (member.technologies as string[]) || [];
      const memberVerticals = (member.industry_verticals as string[]) || [];
      const memberUseCases = (member.use_cases as string[]) || [];

      // Technology overlap
      const techOverlap = memberTechs.filter((t: string) =>
        techNames.some((d) => d.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(d.toLowerCase()))
      ).length;

      // Industry relevance
      const industryMatch = memberVerticals.some((v: string) =>
        analysis.industry?.toLowerCase().includes(v.toLowerCase().split(" ")[0]) ||
        v.toLowerCase().includes(analysis.industry?.toLowerCase().split(" ")[0] || "")
      ) ? 1 : 0;

      // Pain point / use case match
      const painPointTexts = painPoints.map((p) => typeof p === "string" ? p : p.pain_point || "");
      const useCaseMatch = memberUseCases.filter((uc: string) =>
        painPointTexts.some((p) => p.toLowerCase().includes(uc.toLowerCase().split(" ")[0]))
      ).length;

      const score = (techOverlap * 0.35) + (industryMatch * 0.3) + (useCaseMatch * 0.2) + (member.description ? 0.15 : 0);

      return { member, score };
    });

    // Sort and ensure both startups AND corporates are represented
    // so the visible cards (rank 1-2) can show one of each
    scored.sort((a, b) => b.score - a.score);
    const STARTUP_TIERS_PREFILTER = new Set(["Tech Starter", "Tech Accelerator"]);
    const isStartupTier = (m: { membership_tier?: string | null }) =>
      !!m.membership_tier && STARTUP_TIERS_PREFILTER.has(m.membership_tier as string);

    const topStartups = scored.filter((s) => isStartupTier(s.member)).slice(0, 5);
    const topCorporates = scored.filter((s) => !isStartupTier(s.member)).slice(0, 5);
    // Merge, dedupe, and limit to 8 — guaranteed to include both categories when available
    const seen = new Set<string>();
    const topCandidates: typeof scored = [];
    for (const cand of [...topStartups, ...topCorporates].sort((a, b) => b.score - a.score)) {
      if (!seen.has(cand.member.id as string)) {
        seen.add(cand.member.id as string);
        topCandidates.push(cand);
        if (topCandidates.length >= 8) break;
      }
    }

    // Format prospect data for the prompt
    const gapTexts = gaps.map((g) => typeof g === "string" ? g : (g as { opportunity?: string; gap?: string }).opportunity || (g as { gap?: string }).gap || "");
    const painPointTexts = painPoints.map((p) => typeof p === "string" ? p : (p as { pain_point?: string }).pain_point || "");
    const goalTexts = (analysis.strategic_goals as Array<{ goal?: string }> || []).map((g) => g.goal || "");

    // Format member data for the prompt
    const memberDataFormatted = topCandidates.map((m) => {
      const member = m.member;
      return `- **${member.name}** (ID: ${member.id})
  Tier: ${member.membership_tier || "Unknown"}
  Description: ${member.description || "No description available"}
  Technologies: ${((member.technologies as string[]) || []).join(", ") || "None listed"}
  Industry Verticals: ${((member.industry_verticals as string[]) || []).join(", ") || "None listed"}
  Use Cases: ${((member.use_cases as string[]) || []).join(", ") || "None listed"}
  Pain Points: ${((member.pain_points as string[]) || []).join(", ") || "None listed"}
  Collaboration Interests: ${((member.collaboration_interests as string[]) || []).join(", ") || "None listed"}`;
    }).join("\n\n");

    const userMessage = `### Prospect Company (from the innovation analysis)

**Company:** ${analysis.company_name}
**Industry:** ${analysis.industry || "Not specified"}
**Confirmed Verticals:** ${(analysis.confirmed_verticals as string[] || []).join(", ") || "General"}
**Overall Innovation Score:** ${analysis.overall_score} (${analysis.maturity_level})
**Technologies Detected:** ${techNames.join(", ") || "None detected"}
**Innovation Opportunities:** ${gapTexts.join("; ") || "None identified"}
**Pain Points:** ${painPointTexts.join("; ") || "None identified"}
**Strategic Goals:** ${goalTexts.join("; ") || "None identified"}

### Pre-Selected Member Companies

${memberDataFormatted}

Generate match profiles for the top 6 members from this list. Return only the JSON array.`;

    const rationaleResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userMessage },
        ],
      }),
    });

    const rationaleResult = await rationaleResponse.json();
    let matchProfiles: Array<{
      rank: number;
      matched_account_id: string;
      match_score: number;
      match_category: string;
      why_this_match: string;
      match_evidence: Array<{ type: string; prospect_signal: string; member_signal: string; strength: string }>;
      member_expertise: string[];
      conversation_starter: string;
      shared_sectors: string[];
      teaser_text: string;
    }> = [];

    for (const block of rationaleResult.content || []) {
      if (block.type === "text") {
        try {
          const match = block.text.match(/\[[\s\S]*\]/);
          if (match) matchProfiles = JSON.parse(match[0]);
        } catch {
          // Fallback — empty profiles
        }
      }
    }

    // Build match rows with v2 fields
    // Categorize each member as "startup" or "corporate" based on membership_tier
    // Startup tiers: Tech Starter, Tech Accelerator (smaller, growing companies)
    // Corporate tiers: Tech Champion, Industry Engage/Strategic, Private Office, Office (larger, established)
    const STARTUP_TIERS = new Set(["Tech Starter", "Tech Accelerator"]);
    const isStartup = (tier: string | null | undefined) =>
      !!tier && STARTUP_TIERS.has(tier);

    // Build profiles with member info and category
    const profilesWithCategory = matchProfiles.slice(0, 8).map((profile) => {
      const memberEntry = topCandidates.find((m) => m.member.id === profile.matched_account_id);
      const member = memberEntry?.member;
      const tier = (member?.membership_tier as string | null) || null;
      return {
        profile,
        member,
        tier,
        category: isStartup(tier) ? "startup" : "corporate",
      };
    });

    // Pick visible: highest-ranked corporate + highest-ranked startup
    // Claude already returned them in rank order, so we can just iterate
    const visibleCorporate = profilesWithCategory.find((p) => p.category === "corporate");
    const visibleStartup = profilesWithCategory.find((p) => p.category === "startup");

    // Build the visible list (1-2) and locked list (3-6)
    // If we don't have one of each category, fall back to top 2 by Claude's ranking
    const visibleList: typeof profilesWithCategory = [];
    if (visibleCorporate && visibleStartup) {
      // Order them by their original Claude rank to keep the strongest first
      const corpRank = profilesWithCategory.indexOf(visibleCorporate);
      const startRank = profilesWithCategory.indexOf(visibleStartup);
      if (corpRank < startRank) {
        visibleList.push(visibleCorporate, visibleStartup);
      } else {
        visibleList.push(visibleStartup, visibleCorporate);
      }
    } else {
      // Fall back: just take Claude's top 2
      visibleList.push(...profilesWithCategory.slice(0, 2));
    }

    // Locked: take remaining profiles in Claude's original rank order, limit to 4
    const visibleIds = new Set(visibleList.map((p) => p.profile.matched_account_id));
    const lockedList = profilesWithCategory
      .filter((p) => !visibleIds.has(p.profile.matched_account_id))
      .slice(0, 4);

    const finalList = [...visibleList, ...lockedList];

    const matchRows = finalList.map((entry, i) => {
      const { profile, member } = entry;
      return {
        analysis_id,
        matched_account_id: profile.matched_account_id,
        match_rank: i + 1,
        match_score: profile.match_score || 0.5,
        match_rationale: profile.why_this_match || null,
        match_category: profile.match_category || "Technology Partner",
        shared_themes: profile.shared_sectors || [],
        is_visible: i < 2,
        account_name: member?.name || null,
        account_website: null,
        account_description: member?.description || null,
        match_details: {
          member_expertise: profile.member_expertise || [],
          conversation_starter: profile.conversation_starter || null,
          teaser_text: profile.teaser_text || null,
          company_category: entry.category,
          membership_tier: entry.tier,
        },
        match_evidence: profile.match_evidence || [],
      };
    });

    if (matchRows.length > 0) {
      await innovationClient.from("ecosystem_matches").insert(matchRows);
    }

    return new Response(
      JSON.stringify({ success: true, matches: matchRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ecosystem matching error:", error);
    return new Response(
      JSON.stringify({ error: "Matching failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
