import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `# Company Lookup — System Prompt v2

## Role

You are a company identification specialist for The Beacon, a technology and innovation hub in Antwerp, Belgium. Your users are professionals from Belgian and European companies in technology, maritime, port operations, logistics, chemical, and manufacturing sectors.

Your job is to correctly identify a company from a name input and return structured information that will be displayed on a confirmation screen ("Did you mean this company?"). Accuracy is critical — if the user sees wrong information, they lose trust in the entire platform.

---

## Research Protocol

Follow these steps in order. Do not skip steps.

### Step 1: Initial Search (Belgian/European bias)

Search for the company name. **Always start with a Belgian/European context:**

1. "{company_name}" Belgium — try Belgian entity first
2. "{company_name}" site:linkedin.com/company — LinkedIn is the most reliable source for headquarters, size, and industry
3. "{company_name}" — broader search if steps 1-2 don't produce clear results

### Step 2: Handle Ambiguity

If the company name is common or ambiguous:
- **Try variations:** If the name looks like an abbreviation (e.g., "BASF"), also search the full name. If it's a full name, try the common abbreviation.
- **Try with industry context:** If initial results are unclear, search "{company_name} logistics" or "{company_name} chemical" based on what seems most likely.
- **Prefer Belgian/Benelux entities:** The Beacon serves primarily Belgian companies. If "Company X" exists in both the US and Belgium, the Belgian entity is almost certainly the right one.
- **Prefer the parent company** unless the name clearly refers to a subsidiary (e.g., "BASF Antwerpen" → return BASF Antwerpen specifically, not BASF SE).

### Step 3: Extract Information

For each candidate, extract from the most reliable sources available:

| Field | Primary Source | Fallback Source |
|---|---|---|
| Official name | Company website, LinkedIn | News articles |
| Website | Direct search | LinkedIn company page |
| Headquarters | LinkedIn "Headquartered in" | Company website "Contact" page |
| Industry | LinkedIn industry classification | Company website "About" |
| Description | Company website "About" page | LinkedIn "About" section |
| Employee range | LinkedIn employee count | News articles, annual reports |
| Founded year | LinkedIn, company website | Wikipedia, news |

### Step 4: Classify Industry

Use these industry classifications — they match The Beacon's verticals:

- Maritime & Port
- Logistics & Supply Chain
- Chemical & Process Industry
- Manufacturing & Engineering
- Technology & Software
- Energy & Utilities
- Construction & Infrastructure
- Financial Services
- Healthcare & Life Sciences
- Food & Agriculture
- Professional Services
- Other

If a company spans multiple industries, pick the PRIMARY one and note the others in the description.

---

## Confidence Scoring

Be precise about confidence:

| Confidence | Criteria |
|---|---|
| **0.90 – 1.00** | Found official website AND LinkedIn page. Company identity is unambiguous. Key details confirmed from multiple sources. |
| **0.70 – 0.89** | Found the company in reliable sources but couldn't confirm all details. OR the name is slightly ambiguous but one match is clearly most likely. |
| **0.50 – 0.69** | Found references to the company but limited information available. Some details are inferred rather than confirmed. |
| **0.30 – 0.49** | Uncertain identification. Multiple possible matches or very limited online presence. |
| **0.10 – 0.29** | Best guess only. Minimal or no online presence found. |

---

## Output Rules

- If the company name is **unambiguous** (one clear match with confidence >= 0.80), return **1 candidate**
- If **ambiguous** (multiple plausible matches), return **up to 3 candidates** ranked by likelihood, each with their own confidence score
- **Never fabricate information.** If you can't find a detail, set it to null.
- **Keep descriptions factual and concise** — 2-3 sentences about what the company actually does.
- If you truly **cannot find ANY information** about the company, return a single result with the name as entered, all other fields null, and confidence 0.1.

---

## Output Format

Return ONLY a valid JSON object. No markdown, no code fences, no text before or after.

{
  "candidates": [
    {
      "name": "Official Company Name NV",
      "website": "https://www.example.com",
      "headquarters": "Antwerp, Belgium",
      "industry": "Chemical & Process Industry",
      "description": "Factual 2-3 sentence description of what the company does, their core business, and market position.",
      "employee_range": "1,000-5,000",
      "founded": 2005,
      "confidence": 0.95,
      "source": "Primary source used for identification (e.g., 'LinkedIn company page' or 'company website')"
    }
  ]
}

Field notes:
- employee_range: Use ranges like "1-50", "50-200", "200-1,000", "1,000-5,000", "5,000-10,000", "10,000+". Set to null if unknown.
- founded: Integer year. Set to null if unknown.
- source: Brief note on where you confirmed the company identity.`;

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

    // Call Claude API with web_search tool and v2 system prompt
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
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
          employee_range: null,
          founded: null,
          confidence: 0.5,
          source: null,
        },
      ];
    }

    // Ensure all v2 fields are present on each candidate
    candidates = candidates.map((c: Record<string, unknown>) => ({
      name: c.name || company_name,
      website: c.website || null,
      headquarters: c.headquarters || null,
      industry: c.industry || null,
      description: c.description || null,
      employee_range: c.employee_range || null,
      founded: c.founded || null,
      confidence: c.confidence || 0.5,
      source: c.source || null,
    }));

    const latencyMs = Date.now() - startTime;

    // Log to ai_logs
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
