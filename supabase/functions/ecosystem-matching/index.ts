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

    // Get active Beacon members. We only consider tiers that represent
    // prospective matches for a prospect — organizational relationships
    // (Ecosystem/Founding/Public/Education Partner) aren't match candidates.
    const ELIGIBLE_TIERS = [
      "Tech Starter",
      "Tech Accelerator",
      "Tech Champion",
      "Private Office",
      "Industry Engage",
      "Industry Explore",
    ];
    const { data: members } = await publicClient
      .from("accounts")
      .select("id, name, description, technologies, industry_verticals, use_cases, membership_tier, pain_points, collaboration_interests")
      .in("membership_tier", ELIGIBLE_TIERS)
      .is("archived_at", null);

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-score members for relevance to narrow down to top candidates.
    // Industry fit is the dominant signal — a generic IT member (lots of
    // techs) should NEVER outrank a logistics specialist for a logistics
    // prospect. We alias the canonical analysis labels to the member-side
    // labels (members were tagged years before the canonical list existed)
    // so "Logistics & Supply Chain" matches "Logistics / Forwarding Industry",
    // "Port Industry", etc.
    const INDUSTRY_ALIASES: Record<string, string[]> = {
      "logistics & supply chain": ["logistics", "forwarding", "supply chain", "port", "transport"],
      "maritime & port": ["maritime", "shipping", "port", "marine", "blue economy", "onshore", "offshore"],
      "chemical & process industry": ["chemical", "oil & gas", "pharmaceutic", "process"],
      "manufacturing & engineering": ["manufacturing", "engineering", "smart manufacturing"],
      "energy & utilities": ["energy", "oil & gas", "utilities", "onshore", "offshore"],
      "technology & software": ["technology", "software", "it services", "saas"],
      "construction & infrastructure": ["construction", "infrastructure", "smart city"],
      "healthcare & life sciences": ["healthcare", "life sciences", "pharmaceutic"],
      "financial services": ["financial", "banking", "insurance", "fintech"],
    };

    const prospectVerticals: string[] = (analysis.confirmed_verticals as string[] | null)?.length
      ? (analysis.confirmed_verticals as string[])
      : analysis.industry ? [analysis.industry as string] : [];

    // Expand each prospect vertical into its alias keywords
    const prospectKeywords = new Set<string>();
    for (const v of prospectVerticals) {
      const key = v.toLowerCase();
      prospectKeywords.add(key);
      // direct word tokens
      for (const tok of key.split(/[\s&/,-]+/).filter((t) => t.length >= 4)) {
        prospectKeywords.add(tok);
      }
      // alias expansions
      const aliases = INDUSTRY_ALIASES[key] || [];
      for (const a of aliases) prospectKeywords.add(a);
    }

    const techsDetected = (analysis.technologies_detected as Array<{ technology?: string } | string>) || [];
    const techNames = techsDetected.map((t) => typeof t === "string" ? t : t.technology || "").filter(Boolean);
    const gaps = (analysis.innovation_gaps as Array<{ opportunity?: string; gap?: string } | string>) || [];
    const painPoints = (analysis.pain_points_detected as Array<{ pain_point?: string } | string>) || [];

    const scored = members.map((member) => {
      const memberTechs = (member.technologies as string[]) || [];
      const memberVerticals = (member.industry_verticals as string[]) || [];
      const memberUseCases = (member.use_cases as string[]) || [];

      // Industry overlap count: how many of the member's verticals contain any
      // of the prospect's keywords (or vice versa). Higher = stronger fit.
      const industryOverlap = memberVerticals.reduce((count, v) => {
        const vl = v.toLowerCase();
        const hit = Array.from(prospectKeywords).some((kw) => vl.includes(kw) || kw.includes(vl));
        return count + (hit ? 1 : 0);
      }, 0);

      // Technology overlap
      const techOverlap = memberTechs.filter((t: string) =>
        techNames.some((d) => d.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(d.toLowerCase()))
      ).length;

      // Pain point / use case match
      const painPointTexts = painPoints.map((p) => typeof p === "string" ? p : p.pain_point || "");
      const useCaseMatch = memberUseCases.filter((uc: string) =>
        painPointTexts.some((p) => p.toLowerCase().includes(uc.toLowerCase().split(" ")[0]))
      ).length;

      // Scoring: industry fit dominates (weight 4 per overlap + 6-point floor
      // for any match), tech + use-case are secondary, description is a tiny
      // tie-breaker. This pushes sector-relevant specialists to the top even
      // when generic IT members have broader tech tags.
      const industryBonus = industryOverlap > 0 ? 6 : 0;
      const score =
        industryBonus +
        industryOverlap * 4 +
        techOverlap * 1 +
        useCaseMatch * 0.8 +
        (member.description ? 0.3 : 0);

      return { member, score, industryOverlap };
    });

    // Candidate pool for Claude: ensure each matchable tier is represented
    // (so Claude has the option to rank a Private Office specialist above a
    // generic Tech-tier member) while still capping at ~9 so Claude's
    // attention budget isn't overloaded.
    scored.sort((a, b) => b.score - a.score);
    const getTier = (m: { membership_tier?: string | null }) =>
      (m.membership_tier as string | null) || "";

    const topStarters = scored.filter((s) => getTier(s.member) === "Tech Starter").slice(0, 2);
    const topAccelerators = scored.filter((s) => getTier(s.member) === "Tech Accelerator").slice(0, 2);
    const topChampions = scored.filter((s) => getTier(s.member) === "Tech Champion").slice(0, 2);
    const topResidents = scored.filter((s) => getTier(s.member) === "Private Office").slice(0, 2);

    // Merge guaranteed-per-tier + best overall (to fill remaining slots with
    // whoever scores highest regardless of tier), dedupe, cap at 9.
    const seen = new Set<string>();
    const topCandidates: typeof scored = [];
    const push = (c: typeof scored[number]) => {
      if (!seen.has(c.member.id as string)) {
        seen.add(c.member.id as string);
        topCandidates.push(c);
      }
    };
    for (const c of [...topStarters, ...topAccelerators, ...topChampions, ...topResidents].sort((a, b) => b.score - a.score)) push(c);
    for (const c of scored) {
      if (topCandidates.length >= 9) break;
      push(c);
    }
    topCandidates.sort((a, b) => b.score - a.score);
    topCandidates.length = Math.min(topCandidates.length, 9);

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
        model: "claude-sonnet-4-20250514",
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

    // Visible cards (rank 1-3): flexible tier diversity.
    // Rank 1 = Claude's best overall match. Rank 2 = best whose tier ≠ rank
    // 1's tier. Rank 3 = best whose tier ≠ ranks 1 & 2. This guarantees up
    // to 3 distinct tiers on screen without forcing which three they must
    // be — so a logistics prospect with strong Private Office specialists
    // (Dockflow, Lanark) can surface them over an irrelevant Tech Champion.
    // Falls back to next-best if fewer than 3 unique tiers are available.
    const visibleCandidates: typeof profilesWithTier = [];
    const usedTiers = new Set<string>();
    for (const p of profilesWithTier) {
      const tierKey = p.tier || "__unknown__";
      if (usedTiers.has(tierKey)) continue;
      visibleCandidates.push(p);
      usedTiers.add(tierKey);
      if (visibleCandidates.length >= 3) break;
    }
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
