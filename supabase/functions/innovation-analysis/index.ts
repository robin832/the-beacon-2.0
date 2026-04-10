import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Load prompt from shared module — edit _shared/prompts/innovation-analysis.md then regenerate
import { INNOVATION_ANALYSIS_PROMPT as SYSTEM_PROMPT } from "../_shared/prompt-innovation-analysis.ts";
import { getCuratedSources } from "../_shared/curated-sources.ts";
import { verifySourceUrls, verifyUrl } from "../_shared/url-verify.ts";

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
    const {
      analysis_id,
      company_name,
      company_website,
      industry,
      session_id,
      confirmed_verticals,
      feedback_context,
    } = await req.json() as {
      analysis_id: string;
      company_name: string;
      company_website?: string;
      industry?: string;
      session_id?: string;
      confirmed_verticals?: string[];
      feedback_context?: { rating?: number; feedback?: string } | null;
    };

    if (!analysis_id || !company_name) {
      return new Response(
        JSON.stringify({ error: "analysis_id and company_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasFeedback = !!(feedback_context && (feedback_context.feedback || feedback_context.rating));

    // Check for recent cached analysis (same company in last 7 days).
    // Regeneration runs with `feedback_context` — we bypass the cache in that
    // case because the user explicitly wants a fresh analysis that incorporates
    // their corrections.
    const { data: cached } = hasFeedback ? { data: null } : await supabase
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

        // Trigger ecosystem matching in the background via waitUntil
        const cachedMatchingTask = fetch(`${supabaseUrl}/functions/v1/ecosystem-matching`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ analysis_id }),
        }).catch(() => { /* matching is optional */ });
        // deno-lint-ignore no-explicit-any
        const edgeRuntimeCached = (globalThis as any).EdgeRuntime;
        if (edgeRuntimeCached?.waitUntil) {
          edgeRuntimeCached.waitUntil(cachedMatchingTask);
        }

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

    // Build curated + learned source list for this vertical
    const curated = getCuratedSources(industry);

    // Fetch top learned sources from source_quality table (sources that have performed well historically)
    const { data: learnedSources } = await supabase
      .from("source_quality")
      .select("source_domain, source_url, quality_score")
      .eq("industry_vertical", industry || "")
      .not("quality_score", "is", null)
      .order("quality_score", { ascending: false })
      .limit(10);

    // Merge curated and learned (learned ranked first, curated filling the gap)
    const seenDomains = new Set<string>();
    type SourceForPrompt = { domain: string; url: string; description?: string; score?: number };
    const sourcesForPrompt: SourceForPrompt[] = [];
    for (const ls of (learnedSources || [])) {
      const domain = ls.source_domain as string;
      if (!seenDomains.has(domain)) {
        seenDomains.add(domain);
        sourcesForPrompt.push({
          domain,
          url: (ls.source_url as string) || `https://${domain}`,
          score: Number(ls.quality_score),
        });
      }
    }
    for (const cs of curated) {
      if (!seenDomains.has(cs.domain)) {
        seenDomains.add(cs.domain);
        sourcesForPrompt.push({ domain: cs.domain, url: cs.url, description: cs.description });
      }
      if (sourcesForPrompt.length >= 18) break;
    }

    const sourcesList = sourcesForPrompt.map((s) => {
      const scoreNote = typeof s.score === "number" ? ` [quality: ${s.score.toFixed(2)}]` : "";
      const desc = s.description ? ` — ${s.description}` : "";
      return `- ${s.url}${scoreNote}${desc}`;
    }).join("\n");

    const feedbackSection = hasFeedback
      ? `

## User Feedback on Previous Analysis

The user provided the following feedback on a previous analysis of this company. Take it seriously:

- Rating: ${feedback_context?.rating ?? "not given"}/5
- Feedback: "${(feedback_context?.feedback || "").replace(/"/g, '\\"')}"

Instructions for handling the feedback:
- If the user corrected factual information, prioritize their corrections over what you find online.
- If they said the analysis was too generic, be markedly more specific this time — name projects, technologies, partners, numbers.
- If they mentioned specific initiatives, projects, partnerships, or people you missed, search for those explicitly.
- If they disputed a dimension score, re-examine the evidence for that dimension carefully.
- Do not flatter or restate the feedback in the output — just let it shape your research and conclusions.
`
      : "";

    const userMessage = `## Context

**Company:** ${company_name}
**Website:** ${company_website || "Not provided"}
**Industry:** ${industry || "Not specified"}
**Confirmed Verticals:** ${verticalsText}

## Recommended Sources (ranked by quality for this industry)

Prioritize these curated and learned sources when researching. They have been verified to produce accurate, relevant insights for ${industry || "this"} companies. Use them as your first-pass search targets before going broader:

${sourcesList}
${feedbackSection}
---

Perform a complete innovation opportunity analysis for ${company_name}. Today's date is ${currentDate}. Follow all phases of the research protocol, score all dimensions with sub-indicators, and produce the full JSON output.`;

    // Update status: analyzing
    await supabase
      .from("analyses")
      .update({ analysis_status: "analyzing" })
      .eq("id", analysis_id);

    // Anthropic call with one retry on transient overload. Innovation analysis
    // is long (80-120s) so we can only afford a single retry with a short
    // backoff before risking the 150s edge function timeout.
    const callAnthropic = async () => {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search",
              // 10 searches: ~5 company research, ~3-4 real-world example verification,
              // ~1-2 industry context. Bumped from 8 to 10 after observing analyses
              // with as few as 3 sources — the prompt now requires 8+ distinct sources
              // and verified URLs for each of 3 real-world examples.
              max_uses: 10,
            },
          ],
          messages: [
            { role: "user", content: userMessage },
          ],
        }),
      });
      const body = await r.json();
      return { r, body };
    };

    const isOverloaded = (status: number, body: { error?: { type?: string }; type?: string }) =>
      status === 529 ||
      status === 503 ||
      body?.error?.type === "overloaded_error" ||
      (body?.type === "error" && /overload/i.test(JSON.stringify(body).slice(0, 300)));

    let { r: response, body: result } = await callAnthropic();
    if (isOverloaded(response.status, result)) {
      console.warn("[innovation-analysis] Anthropic overloaded, retrying after 2500ms");
      await new Promise((res) => setTimeout(res, 2500));
      ({ r: response, body: result } = await callAnthropic());
    }

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

    // Verify source URLs with a HEAD fetch so the frontend never renders broken
    // links. Each source gets a `verified: boolean` field. Runs in parallel
    // and caps at ~5s per URL, so the whole step typically adds <5s.
    try {
      if (Array.isArray(analysisData.sources) && analysisData.sources.length > 0) {
        analysisData.sources = await verifySourceUrls(analysisData.sources);
      }
    } catch (verifyErr) {
      console.error("Source URL verification failed (non-critical):", verifyErr);
    }

    // Verify real-world example URLs in innovation_opportunities. If a URL
    // can't be verified we null it out so the frontend falls back to the
    // text-only example (company + what_they_did + result).
    try {
      if (Array.isArray(analysisData.innovation_opportunities)) {
        await Promise.all(
          analysisData.innovation_opportunities.map(async (opp: { real_world_example?: { url?: string | null } }) => {
            const rwe = opp.real_world_example;
            if (rwe?.url) {
              const ok = await verifyUrl(rwe.url);
              if (!ok) rwe.url = null;
            }
          }),
        );
      }
    } catch (verifyErr) {
      console.error("Real-world example URL verification failed (non-critical):", verifyErr);
    }

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

    // Log source usage into source_quality for the learning loop.
    // We use direct .from() operations instead of RPC to avoid PostgREST schema-routing issues.
    try {
      const usedSources = (analysisData.sources || []) as Array<{ url?: string; verified?: boolean }>;
      const resolvedIndustry = analysisData.industry || industry || "General";
      for (const src of usedSources) {
        if (!src.url) continue;
        let domain = "";
        try {
          domain = new URL(src.url).hostname.replace(/^www\./, "");
        } catch { continue; }

        const verified = src.verified !== false;
        // Try to fetch the existing row
        const { data: existingRow } = await supabase
          .from("source_quality")
          .select("id, times_used, times_verified, times_broken")
          .eq("source_domain", domain)
          .eq("industry_vertical", resolvedIndustry)
          .maybeSingle();

        if (existingRow) {
          await supabase
            .from("source_quality")
            .update({
              times_used: (existingRow.times_used || 0) + 1,
              times_verified: (existingRow.times_verified || 0) + (verified ? 1 : 0),
              times_broken: (existingRow.times_broken || 0) + (verified ? 0 : 1),
              source_url: src.url,
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingRow.id);
        } else {
          await supabase
            .from("source_quality")
            .insert({
              source_domain: domain,
              source_url: src.url,
              industry_vertical: resolvedIndustry,
              times_used: 1,
              times_verified: verified ? 1 : 0,
              times_broken: verified ? 0 : 1,
              last_used_at: new Date().toISOString(),
            });
        }
      }
    } catch (srcError) {
      console.error("Source usage logging failed (non-critical):", srcError);
    }

    // Trigger ecosystem matching as a Supabase background task so the fetch
    // survives past the HTTP response. Plain fire-and-forget `fetch().catch()`
    // gets aborted by the Deno edge runtime the moment this function returns —
    // that was silently dropping 100% of recent match jobs. `EdgeRuntime.waitUntil`
    // is the supported way to keep async work running in the background.
    const matchingTask = fetch(`${supabaseUrl}/functions/v1/ecosystem-matching`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ analysis_id }),
    }).then(async (res) => {
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error(`Ecosystem matching returned ${res.status}: ${txt.slice(0, 300)}`);
      }
    }).catch((matchError) => {
      console.error("Ecosystem matching trigger failed:", matchError);
    });

    // Supabase Edge Functions expose EdgeRuntime.waitUntil for background tasks.
    // Guard the reference for local/test environments that don't have it.
    // deno-lint-ignore no-explicit-any
    const edgeRuntime = (globalThis as any).EdgeRuntime;
    if (edgeRuntime?.waitUntil) {
      edgeRuntime.waitUntil(matchingTask);
    }

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
