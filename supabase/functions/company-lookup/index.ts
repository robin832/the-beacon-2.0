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

  try {
    const { company_name, session_id } = await req.json();

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

    // Call Claude API with web_search tool
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 3,
          },
        ],
        messages: [
          {
            role: "user",
            content: `Identify the company "${company_name}". Search the web to find the correct organization and return structured information.

Return ONLY a JSON object (no markdown, no code blocks) with this structure:
{
  "candidates": [
    {
      "name": "Official Company Name",
      "website": "https://...",
      "headquarters": "City, Country",
      "industry": "Primary Industry",
      "description": "Brief 2-3 sentence description",
      "confidence": 0.95
    }
  ]
}

If multiple companies match, return up to 3 candidates ordered by confidence. Always include at least one result.`,
          },
        ],
      }),
    });

    const result = await response.json();

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

    // Parse the JSON from Claude's response
    let candidates;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        candidates = parsed.candidates || [parsed];
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      // Fallback: return the company name as-is
      candidates = [
        {
          name: company_name,
          website: null,
          headquarters: null,
          industry: null,
          description: null,
          confidence: 0.5,
        },
      ];
    }

    const latencyMs = Date.now() - startTime;

    // Log to ai_logs
    await supabase.rpc("", {}).catch(() => {}); // Schema switch workaround
    const publicClient = createClient(supabaseUrl, supabaseServiceKey);
    await publicClient.from("ai_logs").insert({
      feature: "company_lookup",
      model: "claude-sonnet-4-20250514",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      latency_ms: latencyMs,
      metadata: { company_name, session_id },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ candidates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Company lookup error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to look up company" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
