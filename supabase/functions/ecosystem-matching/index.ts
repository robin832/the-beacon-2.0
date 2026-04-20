import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Load prompt from shared module — edit _shared/prompts/ecosystem-matching.md then regenerate
import { ECOSYSTEM_MATCHING_PROMPT as SYSTEM_PROMPT } from "../_shared/prompt-ecosystem-matching.ts";
import { verifyUrl } from "../_shared/url-verify.ts";
import { getUseCasesForVerticals, formatUseCasesForPrompt } from "../_shared/beacon-context.ts";

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

    // Sort and ensure the 3 visible tiers (Starter, Accelerator, Champion) are represented
    scored.sort((a, b) => b.score - a.score);
    const getTier = (m: { membership_tier?: string | null }) =>
      (m.membership_tier as string | null) || "";

    const topStarters = scored.filter((s) => getTier(s.member) === "Tech Starter").slice(0, 4);
    const topAccelerators = scored.filter((s) => getTier(s.member) === "Tech Accelerator").slice(0, 4);
    const topChampions = scored.filter((s) => getTier(s.member) === "Tech Champion").slice(0, 4);
    const topOther = scored.filter((s) => {
      const t = getTier(s.member);
      return t !== "Tech Starter" && t !== "Tech Accelerator" && t !== "Tech Champion";
    }).slice(0, 4);

    // Merge, dedupe, and limit to 9 candidates for Claude to evaluate
    const seen = new Set<string>();
    const topCandidates: typeof scored = [];
    for (const cand of [...topStarters, ...topAccelerators, ...topChampions, ...topOther].sort((a, b) => b.score - a.score)) {
      if (!seen.has(cand.member.id as string)) {
        seen.add(cand.member.id as string);
        topCandidates.push(cand);
        if (topCandidates.length >= 9) break;
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

    // Pull the real Beacon use case themes for this prospect's verticals so
    // Claude can ground match rationales in named Beacon themes instead of
    // generic language.
    const verticalsForContext = (analysis.confirmed_verticals as string[] | null)
      || (analysis.industry ? [analysis.industry as string] : []);
    const useCaseRows = await getUseCasesForVerticals(publicClient, verticalsForContext, 5);
    const useCaseBlock = formatUseCasesForPrompt(useCaseRows);
    const beaconContextBlock = useCaseBlock ? `\n${useCaseBlock}` : "";

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
${beaconContextBlock}

## Research Instructions for Top Members

For the top 3-4 member companies (those you expect to rank highest), do a quick web search:
- Search: "{member_name}" Belgium to find their website, products, services, or recent news
- Find: specific solutions, case studies, or press releases relevant to the prospect's needs
- Extract: one concrete URL from the member's website showing what they offer

Use these findings to write richer \`why_this_match\` and \`member_expertise\` fields. Add an \`evidence_url\` and \`evidence_title\` to match_evidence entries when you find a relevant page on the member's site. Only include URLs you actually retrieved during this session — never guess or construct a URL.

For lower-ranked members, use only the database data provided — no web search needed.

Generate match profiles for the top 6 members from this list. Return only the JSON array.`;

    const rationaleResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 6000,
        system: SYSTEM_PROMPT,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            // ~1 search per top member to find a real evidence URL
            max_uses: 6,
          },
        ],
        messages: [
          { role: "user", content: userMessage },
        ],
      }),
    });

    const rationaleResult = await rationaleResponse.json();

    if (rationaleResult.error || rationaleResult.type === "error") {
      console.error("Claude API error:", JSON.stringify(rationaleResult));
      return new Response(
        JSON.stringify({ error: "Claude API error", detail: rationaleResult.error?.message || JSON.stringify(rationaleResult) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let outputText = "";
    for (const block of rationaleResult.content || []) {
      if (block.type === "text") outputText += block.text;
    }

    let matchProfiles: Array<{
      rank: number;
      matched_account_id: string;
      match_score: number;
      match_category: string;
      why_this_match: string;
      match_evidence: Array<{
        type: string;
        prospect_signal: string;
        member_signal: string;
        strength: string;
        evidence_url?: string;
        evidence_title?: string;
      }>;
      member_expertise: string[];
      conversation_starter: string;
      shared_sectors: string[];
      teaser_text: string;
    }> = [];

    // Robust parser: strip markdown fences, find balanced array brackets
    try {
      let jsonText = outputText;
      const fenceMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonText = fenceMatch[1].trim();

      const startIdx = jsonText.indexOf("[");
      if (startIdx !== -1) {
        let depth = 0;
        let endIdx = -1;
        for (let i = startIdx; i < jsonText.length; i++) {
          if (jsonText[i] === "[") depth++;
          else if (jsonText[i] === "]") { depth--; if (depth === 0) { endIdx = i; break; } }
        }
        if (endIdx !== -1) {
          matchProfiles = JSON.parse(jsonText.substring(startIdx, endIdx + 1));
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse match profiles:", parseErr, "Raw (first 500):", outputText.substring(0, 500));
    }

    // Verify evidence URLs before persisting. Unverified URLs are stripped
    // (along with evidence_title) so the frontend never renders broken links.
    // Runs in parallel with a 5s per-URL cap.
    try {
      await Promise.all(
        matchProfiles.flatMap((profile) =>
          (profile.match_evidence || []).map(async (ev) => {
            if (ev.evidence_url) {
              const ok = await verifyUrl(ev.evidence_url);
              if (!ok) {
                delete ev.evidence_url;
                delete ev.evidence_title;
              }
            }
          }),
        ),
      );
    } catch (verifyErr) {
      console.error("Evidence URL verification failed (non-critical):", verifyErr);
    }

    // Build profiles enriched with tier info
    const profilesWithTier = matchProfiles.slice(0, 9).map((profile) => {
      const memberEntry = topCandidates.find((m) => m.member.id === profile.matched_account_id);
      const member = memberEntry?.member;
      const tier = (member?.membership_tier as string | null) || null;
      return { profile, member, tier };
    });

    // Visible cards (rank 1-3): one Tech Starter, one Tech Accelerator, one Tech Champion
    // Pick the highest-ranked (by Claude's ordering) from each tier
    const pickFirstByTier = (tier: string) =>
      profilesWithTier.find((p) => p.tier === tier);

    const visibleStarter = pickFirstByTier("Tech Starter");
    const visibleAccelerator = pickFirstByTier("Tech Accelerator");
    const visibleChampion = pickFirstByTier("Tech Champion");

    // Build visible list — preserve Claude's ranking order where possible
    const visibleCandidates = [visibleStarter, visibleAccelerator, visibleChampion]
      .filter((v): v is NonNullable<typeof v> => v !== undefined);

    // Sort visible by their original Claude rank so the strongest shows first
    visibleCandidates.sort(
      (a, b) => profilesWithTier.indexOf(a) - profilesWithTier.indexOf(b)
    );

    // If we don't have one of each tier, fill remaining visible slots with next-best by Claude's ranking
    const visibleIds = new Set(visibleCandidates.map((p) => p.profile.matched_account_id));
    while (visibleCandidates.length < 3) {
      const next = profilesWithTier.find((p) => !visibleIds.has(p.profile.matched_account_id));
      if (!next) break;
      visibleCandidates.push(next);
      visibleIds.add(next.profile.matched_account_id);
    }

    // Locked cards (rank 4-6): next 3 by Claude's ranking, excluding already-visible
    const lockedList = profilesWithTier
      .filter((p) => !visibleIds.has(p.profile.matched_account_id))
      .slice(0, 3);

    const finalList = [...visibleCandidates, ...lockedList];

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
        is_visible: i < 3,
        account_name: member?.name || null,
        account_website: null,
        account_description: member?.description || null,
        match_details: {
          member_expertise: profile.member_expertise || [],
          conversation_starter: profile.conversation_starter || null,
          teaser_text: profile.teaser_text || null,
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
