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

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: "innovation" },
  });
  const publicClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { analysis_id, company_name, company_website, industry, session_id } = await req.json();

    if (!analysis_id || !company_name) {
      return new Response(
        JSON.stringify({ error: "analysis_id and company_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status: researching
    await supabase
      .from("analyses")
      .update({ analysis_status: "researching" })
      .eq("id", analysis_id);

    // Call Claude with web_search for deep research
    const analysisPrompt = `You are an innovation assessment specialist for The Beacon, a technology and innovation hub in Antwerp, Belgium.

Research and analyze "${company_name}"${company_website ? ` (website: ${company_website})` : ""}${industry ? `, operating in the ${industry} industry` : ""}.

Use web search extensively to research:
1. R&D activities, patent filings, technology investments
2. Product launches, service innovations, market disruptions
3. Digital transformation initiatives (cloud, AI, data, automation)
4. Partnerships, open innovation programs, accelerator involvement
5. Market position, strategic vision, leadership on innovation topics

Score each of these 5 dimensions from 0.0 to 5.0 (in 0.5 increments) based on evidence:
1. R&D & Technology Investment (weight: 0.25)
2. Product & Service Innovation (weight: 0.25)
3. Digital Transformation (weight: 0.20)
4. External Partnerships & Open Innovation (weight: 0.15)
5. Market Leadership & Strategic Vision (weight: 0.15)

Maturity levels:
- 0.0-1.0: Innovation Laggard
- 1.1-2.0: Innovation Follower
- 2.1-3.0: Innovation Active
- 3.1-4.0: Innovation Leader
- 4.1-5.0: Innovation Pioneer

Return ONLY a JSON object (no markdown, no code blocks):
{
  "overall_score": 3.2,
  "maturity_level": "Innovation Leader",
  "industry": "Detected industry",
  "company_type": "Industrial|Technology|Service Provider",
  "dimensions": [
    {
      "dimension_name": "R&D & Technology Investment",
      "score": 3.5,
      "weight": 0.25,
      "evidence": "Brief evidence summary (2-3 sentences)",
      "key_findings": ["Finding 1", "Finding 2"]
    },
    {
      "dimension_name": "Product & Service Innovation",
      "score": 3.0,
      "weight": 0.25,
      "evidence": "Brief evidence summary",
      "key_findings": ["Finding 1", "Finding 2"]
    },
    {
      "dimension_name": "Digital Transformation",
      "score": 2.5,
      "weight": 0.20,
      "evidence": "Brief evidence summary",
      "key_findings": ["Finding 1"]
    },
    {
      "dimension_name": "External Partnerships & Open Innovation",
      "score": 3.0,
      "weight": 0.15,
      "evidence": "Brief evidence summary",
      "key_findings": ["Finding 1"]
    },
    {
      "dimension_name": "Market Leadership & Strategic Vision",
      "score": 3.5,
      "weight": 0.15,
      "evidence": "Brief evidence summary",
      "key_findings": ["Finding 1"]
    }
  ],
  "technologies_detected": ["IoT", "Cloud Computing", "AI/ML"],
  "strategic_goals": [
    { "goal": "Goal description", "relevance": "Why it matters" }
  ],
  "active_projects": [
    { "name": "Project name", "status": "active", "description": "Brief description" }
  ],
  "innovation_gaps": ["Gap 1", "Gap 2"],
  "pain_points_detected": ["Pain point 1", "Pain point 2"],
  "beacon_relevance": "2-3 sentence narrative on why The Beacon's ecosystem is relevant to this company's innovation needs.",
  "recommended_offerings": [
    { "offering": "Explore Partnership", "price": "€5,000/year", "match_reason": "Why this fits" },
    { "offering": "Innovation Challenge", "price": "€7,500", "match_reason": "Why this fits" }
  ],
  "industry_context": "2-3 paragraph narrative contextualizing this company's innovation maturity within their industry. Include comparative language like 'Companies in your sector typically...'",
  "data_confidence": "high|medium|low"
}`;

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
        max_tokens: 4096,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 10,
          },
        ],
        messages: [
          { role: "user", content: analysisPrompt },
        ],
      }),
    });

    const result = await response.json();

    let outputText = "";
    let inputTokens = result.usage?.input_tokens || 0;
    let outputTokens = result.usage?.output_tokens || 0;

    for (const block of result.content || []) {
      if (block.type === "text") {
        outputText += block.text;
      }
    }

    // Parse the analysis JSON
    let analysisData;
    try {
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse analysis:", parseError);
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
        innovation_gaps: analysisData.innovation_gaps || [],
        pain_points_detected: analysisData.pain_points_detected || [],
        beacon_relevance: analysisData.beacon_relevance,
        recommended_offerings: analysisData.recommended_offerings || [],
        industry_context: analysisData.industry_context,
        data_confidence: analysisData.data_confidence,
        full_analysis_json: analysisData,
        analysis_status: "matching",
      })
      .eq("id", analysis_id);

    // Insert maturity dimensions
    const dimensionRows = (analysisData.dimensions || []).map(
      (d: { dimension_name: string; score: number; weight: number; evidence: string; key_findings: string[] }) => ({
        analysis_id,
        dimension_name: d.dimension_name,
        score: d.score,
        weight: d.weight,
        evidence: d.evidence,
        key_findings: d.key_findings || [],
      })
    );

    if (dimensionRows.length > 0) {
      await supabase.from("maturity_dimensions").insert(dimensionRows);
    }

    // Trigger ecosystem matching
    try {
      await fetch(`${supabaseUrl}/functions/v1/ecosystem-matching`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ analysis_id }),
      });
    } catch (matchError) {
      console.error("Ecosystem matching trigger failed:", matchError);
      // Don't fail the whole analysis — matching is optional
    }

    // Mark as complete
    await supabase
      .from("analyses")
      .update({ analysis_status: "complete" })
      .eq("id", analysis_id);

    const latencyMs = Date.now() - startTime;

    // Log to ai_logs
    await publicClient
      .from("ai_logs")
      .insert({
        feature: "innovation_analysis",
        model: "claude-sonnet-4-20250514",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        latency_ms: latencyMs,
        metadata: { analysis_id, company_name, session_id },
      })
      .catch(() => {});

    return new Response(
      JSON.stringify({ success: true, analysis_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Innovation analysis error:", error);
    return new Response(
      JSON.stringify({ error: "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
