import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    // Get active Beacon members
    const { data: members } = await publicClient
      .from("accounts")
      .select("id, name, description, technologies, industry_verticals, use_cases, membership_tier")
      .not("membership_tier", "is", null)
      .is("archived_at", null);

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Score each member
    const techsDetected = (analysis.technologies_detected as string[]) || [];
    const gaps = (analysis.innovation_gaps as string[]) || [];
    const painPoints = (analysis.pain_points_detected as string[]) || [];

    const scored = members.map((member) => {
      const memberTechs = (member.technologies as string[]) || [];
      const memberVerticals = (member.industry_verticals as string[]) || [];
      const memberUseCases = (member.use_cases as string[]) || [];

      // Technology overlap
      const techOverlap = memberTechs.filter((t: string) =>
        techsDetected.some((d) => d.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(d.toLowerCase()))
      ).length;

      // Industry relevance
      const industryMatch = memberVerticals.some((v: string) =>
        analysis.industry?.toLowerCase().includes(v.toLowerCase().split(" ")[0]) ||
        v.toLowerCase().includes(analysis.industry?.toLowerCase().split(" ")[0] || "")
      ) ? 1 : 0;

      // Pain point / use case match
      const useCaseMatch = memberUseCases.filter((uc: string) =>
        painPoints.some((p) => p.toLowerCase().includes(uc.toLowerCase().split(" ")[0]))
      ).length;

      const score = (techOverlap * 0.35) + (industryMatch * 0.3) + (useCaseMatch * 0.2) + (member.description ? 0.15 : 0);

      return { member, score };
    });

    // Sort and take top 6
    scored.sort((a, b) => b.score - a.score);
    const top6 = scored.slice(0, 6);

    // Generate rationales via Claude
    const matchSummaries = top6.map((m, i) => ({
      rank: i + 1,
      name: m.member.name,
      description: m.member.description || "No description available",
      technologies: (m.member.technologies as string[]) || [],
      industry_verticals: (m.member.industry_verticals as string[]) || [],
      score: m.score,
    }));

    const rationaleResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `For the company "${analysis.company_name}" (industry: ${analysis.industry}, technologies: ${techsDetected.join(", ")}, gaps: ${gaps.join(", ")}), generate match rationales for these Beacon members:

${JSON.stringify(matchSummaries, null, 2)}

Return ONLY a JSON array (no markdown):
[
  {
    "rank": 1,
    "match_category": "Technology Partner|Industry Peer|Service Provider|Domain Expert",
    "match_rationale": "2-3 sentence explanation of why this is a good match",
    "shared_themes": ["theme1", "theme2"],
    "collaboration_idea": "One paragraph describing a potential collaboration"
  }
]`,
          },
        ],
      }),
    });

    const rationaleResult = await rationaleResponse.json();
    let rationales: Array<{
      rank: number;
      match_category: string;
      match_rationale: string;
      shared_themes: string[];
      collaboration_idea: string;
    }> = [];

    for (const block of rationaleResult.content || []) {
      if (block.type === "text") {
        try {
          const match = block.text.match(/\[[\s\S]*\]/);
          if (match) rationales = JSON.parse(match[0]);
        } catch {
          // Fallback — empty rationales
        }
      }
    }

    // Insert matches
    const matchRows = top6.map((m, i) => {
      const rationale = rationales.find((r) => r.rank === i + 1) || {};
      return {
        analysis_id,
        matched_account_id: m.member.id,
        match_rank: i + 1,
        match_score: Math.min(m.score / 2, 0.99), // Normalize to 0-1
        match_rationale: (rationale as { match_rationale?: string }).match_rationale || null,
        match_category: (rationale as { match_category?: string }).match_category || "Technology Partner",
        shared_themes: (rationale as { shared_themes?: string[] }).shared_themes || [],
        collaboration_idea: (rationale as { collaboration_idea?: string }).collaboration_idea || null,
        is_visible: i < 2,
      };
    });

    await innovationClient.from("ecosystem_matches").insert(matchRows);

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
