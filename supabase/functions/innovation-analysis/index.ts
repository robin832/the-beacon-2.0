import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Load prompt from shared module — edit _shared/prompts/innovation-analysis.md then regenerate
import { INNOVATION_ANALYSIS_PROMPT as SYSTEM_PROMPT } from "../_shared/prompt-innovation-analysis.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: "innovation" },
  });
  const publicClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { analysis_id, company_name, company_website, industry, session_id, confirmed_verticals } = await req.json();

    if (!analysis_id || !company_name) {
      return new Response(
        JSON.stringify({ error: "analysis_id and company_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for recent cached analysis (same company in last 7 days)
    const { data: cached } = await supabase
      .from("analyses")
      .select("id")
      .ilike("company_name", company_name)
      .eq("analysis_status", "complete")
      .gt("analyzed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .neq("id", analysis_id)
      .order("analyzed_at", { ascending: false })
      .limit(1);

    if (cached && cached.length > 0) {
      // Copy the existing analysis data to the new record
      const { data: existing } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", cached[0].id)
        .single();

      if (existing) {
        await supabase
          .from("analyses")
          .update({
            overall_score: existing.overall_score,
            maturity_level: existing.maturity_level,
            industry: existing.industry,
            company_type: existing.company_type,
            technologies_detected: existing.technologies_detected,
            strategic_goals: existing.strategic_goals,
            active_projects: existing.active_projects,
            innovation_gaps: existing.innovation_gaps,
            pain_points_detected: existing.pain_points_detected,
            beacon_relevance: existing.beacon_relevance,
            recommended_offerings: existing.recommended_offerings,
            industry_context: existing.industry_context,
            industry_landscape: existing.industry_landscape,
            data_confidence: existing.data_confidence,
            data_confidence_explanation: existing.data_confidence_explanation,
            surprising_insight: existing.surprising_insight,
            quick_win: existing.quick_win,
            sources: existing.sources,
            research_data: existing.research_data,
            full_analysis_json: existing.full_analysis_json,
            previous_analysis_id: cached[0].id,
            analysis_status: "complete",
          })
          .eq("id", analysis_id);

        // Copy maturity dimensions
        const { data: existingDims } = await supabase
          .from("maturity_dimensions")
          .select("*")
          .eq("analysis_id", cached[0].id);

        if (existingDims && existingDims.length > 0) {
          const dimRows = existingDims.map((d: Record<string, unknown>) => ({
            analysis_id,
            dimension_name: d.dimension_name,
            dimension: d.dimension_name,
            score: d.score,
            weight: d.weight,
            evidence: d.evidence,
            key_findings: d.key_findings || [],
            sub_scores: d.sub_scores || {},
            insight: d.insight,
          }));
          await supabase.from("maturity_dimensions").insert(dimRows);
        }

        // Trigger ecosystem matching for the new analysis
        try {
          await fetch(`${supabaseUrl}/functions/v1/ecosystem-matching`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ analysis_id }),
          });
        } catch { /* matching is optional */ }

        return new Response(
          JSON.stringify({ success: true, analysis_id, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update status: researching
    await supabase
      .from("analyses")
      .update({ analysis_status: "researching" })
      .eq("id", analysis_id);

    // Build the user message with template variables interpolated
    const verticalsText = (confirmed_verticals && confirmed_verticals.length > 0)
      ? confirmed_verticals.join(", ")
      : industry || "General";

    const currentDate = new Date().toISOString().split("T")[0];

    const userMessage = `## Context

**Company:** ${company_name}
**Website:** ${company_website || "Not provided"}
**Industry:** ${industry || "Not specified"}
**Confirmed Verticals:** ${verticalsText}

Perform a complete innovation opportunity analysis for ${company_name}. Today's date is ${currentDate}. Follow all phases of the research protocol, score all dimensions with sub-indicators, and produce the full JSON output.`;

    // Update status: analyzing
    await supabase
      .from("analyses")
      .update({ analysis_status: "analyzing" })
      .eq("id", analysis_id);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
            max_uses: 3,
          },
        ],
        messages: [
          { role: "user", content: userMessage },
        ],
      }),
    });

    const result = await response.json();

    // Log Claude API response status for debugging
    if (result.error || result.type === "error") {
      console.error("Claude API error:", JSON.stringify(result));
      await supabase.from("analyses").update({ analysis_status: "error" }).eq("id", analysis_id);
      return new Response(
        JSON.stringify({ error: "Claude API error", detail: result.error?.message || result.message || JSON.stringify(result) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let outputText = "";
    let inputTokens = result.usage?.input_tokens || 0;
    let outputTokens = result.usage?.output_tokens || 0;

    for (const block of result.content || []) {
      if (block.type === "text") {
        outputText += block.text;
      }
    }

    console.log("Claude response - tokens:", inputTokens, "/", outputTokens, "- text length:", outputText.length);

    // Parse the analysis JSON — handle markdown code fences and nested braces
    let analysisData;
    try {
      // First try: strip markdown code fences if present
      let jsonText = outputText;
      const fenceMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonText = fenceMatch[1].trim();
      }

      // Find the outermost JSON object
      const startIdx = jsonText.indexOf('{');
      if (startIdx === -1) throw new Error("No JSON object found in response");

      // Find matching closing brace by counting nesting
      let depth = 0;
      let endIdx = -1;
      for (let i = startIdx; i < jsonText.length; i++) {
        if (jsonText[i] === '{') depth++;
        else if (jsonText[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
      }
      if (endIdx === -1) throw new Error("Unbalanced JSON braces");

      analysisData = JSON.parse(jsonText.substring(startIdx, endIdx + 1));
    } catch (parseError) {
      console.error("Failed to parse analysis:", parseError, "Raw output (first 500 chars):", outputText.substring(0, 500));
      await supabase
        .from("analyses")
        .update({ analysis_status: "error" })
        .eq("id", analysis_id);
      return new Response(
        JSON.stringify({ error: "Failed to parse analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status: matching
    await supabase
      .from("analyses")
      .update({ analysis_status: "matching" })
      .eq("id", analysis_id);

    // Build industry_context from industry_landscape for backwards compat
    const industryLandscape = analysisData.industry_landscape || null;
    const industryContextText = industryLandscape
      ? [industryLandscape.current_trends, industryLandscape.competitive_position, industryLandscape.emerging_opportunities]
          .filter(Boolean).join("\n\n")
      : analysisData.industry_context || null;

    // Map innovation_opportunities to innovation_gaps column (same column, new structure)
    const innovationGaps = analysisData.innovation_opportunities || analysisData.innovation_gaps || [];

    // Write analysis data to DB
    await supabase
      .from("analyses")
      .update({
        overall_score: analysisData.overall_score,
        maturity_level: analysisData.maturity_level,
        industry: analysisData.industry || industry,
        company_type: analysisData.company_type,
        technologies_detected: analysisData.technologies_detected || [],
        strategic_goals: analysisData.strategic_goals || [],
        active_projects: analysisData.active_projects || [],
        innovation_gaps: innovationGaps,
        pain_points_detected: analysisData.pain_points_detected || [],
        beacon_relevance: analysisData.beacon_relevance,
        recommended_offerings: analysisData.recommended_offerings || [],
        industry_context: industryContextText,
        industry_landscape: industryLandscape,
        data_confidence: analysisData.data_confidence,
        data_confidence_explanation: analysisData.data_confidence_explanation || null,
        surprising_insight: analysisData.surprising_insight || null,
        quick_win: analysisData.quick_win || null,
        sources: analysisData.sources || [],
        research_data: analysisData.research_data || null,
        full_analysis_json: analysisData,
        analysis_status: "matching",
      })
      .eq("id", analysis_id);

    // Build a source lookup for evidence citations
    const sourcesMap = new Map<string, { url: string; title: string }>();
    for (const s of (analysisData.sources || [])) {
      if (s.id) sourcesMap.set(s.id, { url: s.url || "", title: s.title || "" });
    }

    // Insert maturity dimensions with v2 fields + evidence tracking
    const dimensionRows = (analysisData.dimensions || []).map(
      (d: {
        dimension_name: string;
        score: number;
        weight: number;
        evidence: string;
        key_findings: string[];
        sub_scores: Record<string, number>;
        insight: string;
      }) => {
        // Extract source references from evidence text (e.g., [S1], [S2])
        const sourceRefs = (d.evidence || "").match(/\[S\d+\]/g) || [];
        const citations = sourceRefs.map((ref: string) => {
          const id = ref.replace(/[\[\]]/g, "");
          const src = sourcesMap.get(id);
          return src ? { source_id: id, url: src.url, title: src.title } : { source_id: id, url: "", title: "" };
        });

        return {
          analysis_id,
          dimension_name: d.dimension_name,
          dimension: d.dimension_name,
          score: d.score,
          weight: d.weight,
          evidence: d.evidence,
          assessment: d.insight || d.evidence,
          key_findings: d.key_findings || [],
          sub_scores: d.sub_scores || {},
          insight: d.insight || null,
          evidence_citations: citations,
          evidence_found: sourceRefs.length > 0,
          source_quality: sourceRefs.length >= 3 ? "primary" : sourceRefs.length >= 1 ? "secondary" : "inferred",
          corroboration_count: sourceRefs.length,
        };
      }
    );

    if (dimensionRows.length > 0) {
      await supabase.from("maturity_dimensions").insert(dimensionRows);
    }

    // Mark analysis as complete BEFORE triggering matching (matching is async)
    await supabase
      .from("analyses")
      .update({ analysis_status: "complete" })
      .eq("id", analysis_id);

    // Trigger ecosystem matching as fire-and-forget (don't await)
    // The matching function runs independently and inserts into ecosystem_matches when done
    fetch(`${supabaseUrl}/functions/v1/ecosystem-matching`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ analysis_id }),
    }).catch((matchError) => {
      console.error("Ecosystem matching trigger failed:", matchError);
    });

    const latencyMs = Date.now() - startTime;

    // Log to ai_logs
    try {
      await publicClient
        .from("ai_logs")
        .insert({
          feature: "innovation_analysis",
          model: "claude-sonnet-4-20250514",
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          latency_ms: latencyMs,
          metadata: { analysis_id, company_name, session_id },
        });
    } catch { /* logging failure is non-critical */ }

    return new Response(
      JSON.stringify({ success: true, analysis_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Innovation analysis error:", error?.message || error);
    // Reset stuck status
    try {
      const { analysis_id } = await req.clone().json().catch(() => ({}));
      if (analysis_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const errorClient = createClient(supabaseUrl, supabaseServiceKey, { db: { schema: "innovation" } });
        await errorClient.from("analyses").update({ analysis_status: "error" }).eq("id", analysis_id);
      }
    } catch { /* best effort */ }
    return new Response(
      JSON.stringify({ error: "Analysis failed", detail: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
