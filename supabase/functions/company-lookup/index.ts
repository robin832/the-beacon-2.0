import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Load prompt from shared module — edit _shared/prompts/company-lookup.md then regenerate
import { COMPANY_LOOKUP_PROMPT as SYSTEM_PROMPT } from "../_shared/prompt-company-lookup.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { company_name } = await req.json();

    if (!company_name) {
      return new Response(
        JSON.stringify({ error: "company_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: "innovation" },
    });

    // Anthropic call with one retry on transient overload. Anthropic returns
    // HTTP 529 (or a body of {type:"error", error:{type:"overloaded_error"}})
    // when their fleet is hot. A single ~1.5s backoff catches most of those.
    const callAnthropic = async () => {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          // 4096 tokens leaves headroom for the reasoning + multi-candidate JSON.
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search",
              max_uses: 5,
            },
          ],
          messages: [
            {
              role: "user",
              content: `Identify the company "${company_name}". Follow the research protocol to find the correct organization and return structured information in the specified JSON format.`,
            },
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
      console.warn("[company-lookup] Anthropic overloaded, retrying after 1500ms");
      await new Promise((res) => setTimeout(res, 1500));
      ({ r: response, body: result } = await callAnthropic());
    }

    // Surface upstream errors instead of silently swallowing them. Anthropic
    // returns either { type: "error", error: { ... } } on a logical error or
    // a non-2xx HTTP status on infra issues. Either way we want to know.
    if (!response.ok || result?.error || result?.type === "error") {
      const detail = result?.error?.message || result?.message || JSON.stringify(result).slice(0, 500);
      console.error(`[company-lookup] Anthropic error (status=${response.status}):`, detail);
      // Persist a debug log row so we can audit failures via SQL
      try {
        const debugClient = createClient(supabaseUrl, supabaseServiceKey);
        await debugClient.from("ai_logs").insert({
          feature: "company_lookup",
          model: "claude-sonnet-4-20250514",
          input_tokens: 0,
          output_tokens: 0,
          latency_ms: Date.now() - startTime,
          input_summary: company_name,
          output_summary: JSON.stringify(result).slice(0, 4000),
          error: `Anthropic ${response.status}: ${detail}`,
        });
      } catch { /* non-critical */ }
      return new Response(
        JSON.stringify({ error: "Company lookup upstream error", detail }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract text from response
    let outputText = "";
    let inputTokens = 0;
    let outputTokens = 0;

    if (result.usage) {
      inputTokens = result.usage.input_tokens || 0;
      outputTokens = result.usage.output_tokens || 0;
    }

    for (const block of result.content || []) {
      if (block.type === "text") {
        outputText += block.text;
      }
    }

    // Parse JSON from Claude's response. Uses depth-counted brace matching so
    // we tolerate markdown fences, leading prose, and multiple JSON-like
    // substrings — same approach as the innovation-analysis function.
    let candidates: Array<Record<string, unknown>> | null = null;
    let parseError: string | null = null;
    try {
      let jsonText = outputText;
      const fenceMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonText = fenceMatch[1].trim();

      const startIdx = jsonText.indexOf("{");
      if (startIdx === -1) throw new Error("No JSON object found in response");

      let depth = 0;
      let endIdx = -1;
      for (let i = startIdx; i < jsonText.length; i++) {
        if (jsonText[i] === "{") depth++;
        else if (jsonText[i] === "}") {
          depth--;
          if (depth === 0) { endIdx = i; break; }
        }
      }
      if (endIdx === -1) throw new Error("Unbalanced JSON braces");

      const parsed = JSON.parse(jsonText.substring(startIdx, endIdx + 1));
      const list = Array.isArray(parsed.candidates) ? parsed.candidates : [parsed];
      candidates = list.length > 0 ? list : null;
    } catch (e) {
      parseError = String((e as Error)?.message || e);
      console.error("[company-lookup] parse failed:", parseError, "raw (first 500):", outputText.slice(0, 500));
    }

    // Fallback: return the company name as-is so the page still has something
    // to show, but flag low confidence so the UI can warn the user.
    if (!candidates || candidates.length === 0) {
      candidates = [
        {
          name: company_name,
          website: null,
          headquarters: null,
          industry: null,
          description: null,
          employee_range: null,
          founded: null,
          confidence: 0.1,
          source: null,
        },
      ];
    }

    // Strip Claude web_search citation tags (e.g. <cite index="1-1,30-5">…</cite>)
    // that leak into user-visible text fields. The opening tag carries no
    // content we want to preserve, so we remove both open and close tags and
    // keep the inner text.
    const stripCitations = (s: unknown): unknown => {
      if (typeof s !== "string") return s;
      return s.replace(/<\/?cite(?:\s[^>]*)?>/g, "").trim();
    };

    // Ensure all v2 fields are present on each candidate
    candidates = candidates.map((c: Record<string, unknown>) => ({
      name: stripCitations(c.name) || company_name,
      website: c.website || null,
      headquarters: stripCitations(c.headquarters) || null,
      industry: stripCitations(c.industry) || null,
      description: stripCitations(c.description) || null,
      employee_range: stripCitations(c.employee_range) || null,
      founded: stripCitations(c.founded) || null,
      confidence: c.confidence || 0.5,
      source: c.source || null,
    }));

    const latencyMs = Date.now() - startTime;

    // Log to ai_logs. Stores Claude's raw text in `output_summary` (truncated)
    // and any parse error in `error`, so failed lookups can be audited via SQL.
    const publicClient = createClient(supabaseUrl, supabaseServiceKey);
    try {
      await publicClient.from("ai_logs").insert({
        feature: "company_lookup",
        model: "claude-sonnet-4-20250514",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        latency_ms: latencyMs,
        input_summary: company_name,
        output_summary: outputText.slice(0, 4000),
        error: parseError,
      });
    } catch (logErr) {
      console.error("[company-lookup] ai_logs insert failed:", logErr);
    }

    return new Response(
      JSON.stringify({ candidates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Company lookup error:", error?.message || error, JSON.stringify(error));
    return new Response(
      JSON.stringify({ error: "Failed to look up company", detail: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
