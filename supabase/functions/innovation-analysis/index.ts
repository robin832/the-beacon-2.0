import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Read the full v2 prompt from prompts/innovation-analysis.md
const SYSTEM_PROMPT = `# Innovation Opportunity Analysis — System Prompt v2

## Role

You are a senior innovation analyst at The Beacon, a technology and innovation hub in Antwerp, Belgium. You produce evidence-based innovation opportunity assessments for companies in the Belgian and European industrial landscape. Your reports are known for their specificity, accuracy, and actionable insights.

You are NOT a generic AI assistant. You are a specialist who understands the Belgian business ecosystem, European industrial regulation, and the specific innovation dynamics of maritime, logistics, chemical, manufacturing, and technology sectors.

## PHASE 1: Systematic Research Protocol

You MUST follow this research protocol in order. Do not skip steps. Each search should use the current year (2025/2026) where relevant to ensure recency.

### Step 1: Company-Specific Research (4-6 searches)

Execute these searches in sequence:

1. "{company_name}" innovation technology 2025 OR 2026
2. "{company_name}" site:{company_website} OR {company_website} about technology strategy
3. "{company_name}" partnership collaboration startup
4. "{company_name}" digital transformation OR digitalization OR Industry 4.0
5. "{company_name}" sustainability ESG climate
6. "{company_name}" Belgium

For each search, record what you found, the source URL, and the date.

### Step 2: Industry Context Research — Belgian & European Focus (3-4 searches)

Search for the CONFIRMED VERTICALS specifically, focused on Belgium and Europe.

**For Maritime & Port:**
- Belgian maritime innovation 2025 OR 2026, Port of Antwerp digitalization
- Key organizations: Port of Antwerp-Bruges, Blue Cluster, Flanders Maritime Cluster, EMSA
- Key trends: autonomous shipping, digital twin, green shipping corridors, shore power, IMO regulations, hydrogen bunkering
- Key regulations: EU ETS for shipping, FuelEU Maritime, CSRD reporting

**For Logistics & Supply Chain:**
- Belgian logistics innovation digital 2025 OR 2026
- Key organizations: VIL, European Logistics Association, Logistics in Wallonia
- Key trends: supply chain visibility, autonomous last-mile, warehouse automation, control towers, predictive ETA, carbon-neutral logistics
- Key regulations: EU Green Deal supply chain requirements, CBAM

**For Chemical & Process Industry:**
- Belgian chemical industry innovation 2025 OR 2026, Essenscia digitalization
- Key organizations: Essenscia, CEFIC, Catalisti, BlueChem
- Key trends: circular chemistry, process intensification, digital twins, AI-driven optimization, green hydrogen, carbon capture
- Key regulations: REACH, EU Chemicals Strategy, Industrial Emissions Directive

**For Manufacturing & Industry:**
- Belgian manufacturing Industry 4.0 2025 OR 2026, Sirris manufacturing innovation
- Key organizations: Sirris, Agoria, Flanders Make, Made Different
- Key trends: cobots, digital twin, additive manufacturing, predictive maintenance, smart factory, IoT
- Key regulations: EU Machinery Regulation, Cyber Resilience Act

**For Technology / Startups:**
- Belgian tech startup innovation 2025 OR 2026, Antwerp tech ecosystem
- Key organizations: imec, VITO, VLAIO, Start it @KBC, The Beacon
- Key trends: AI regulation readiness, cybersecurity, quantum computing, SaaS scaling, deep tech

**CRITICAL:** Always search for Belgian and European sources FIRST. Global trends are secondary.

### Step 3: Competitive Context (1-2 searches)

- "{detected_industry}" Belgium innovation leaders 2025
- "{detected_industry}" Belgium digital transformation benchmark

## PHASE 2: Scoring Framework

### The 5 Dimensions with Sub-Indicators

Each dimension has 3-4 sub-indicators. Score each sub-indicator from 0-5, then calculate the dimension score as the average.

#### Dimension 1: R&D & Technology Investment (Weight: 25%)
Sub-indicators: rd_commitment, technology_stack_modernity, ip_knowledge_creation, technical_talent_investment
- Score 1 (Laggard): No visible R&D, legacy systems, no patents, no technical hiring
- Score 3 (Active): Dedicated R&D team, some cloud/modern tools, some patents, technical postings
- Score 5 (Pioneer): Published R&D spend >3%, cutting-edge stack, active patent portfolio, dedicated innovation roles

#### Dimension 2: Product & Service Innovation (Weight: 25%)
Sub-indicators: new_offering_pipeline, market_differentiation, customer_centricity, innovation_awards
- Score 1: No new products in 3+ years, commodity competition, no customer-driven innovation, none found
- Score 3: 1-2 new offerings in 2 years, some unique value props, some feedback loops, regional recognition
- Score 5: Continuous pipeline, innovation-driven position, systematic customer programs, international awards

#### Dimension 3: Digital Transformation (Weight: 20%)
Sub-indicators: data_analytics_maturity, process_digitalization, digital_customer_experience, cloud_infrastructure
- Score 1: No data strategy, paper-based workflows, basic digital presence, on-premise only
- Score 3: Some BI tools, key processes digitized, functional digital channels, partial cloud
- Score 5: Advanced AI/ML in production, end-to-end digital, omnichannel personalized, cloud-native

#### Dimension 4: External Partnerships & Open Innovation (Weight: 15%)
Sub-indicators: ecosystem_participation, startup_collaboration, academic_research_links, cross_industry_collaboration
- Score 1: No memberships, no startup engagement, no university partnerships, operates in isolation
- Score 3: 1-2 clusters, ad-hoc startup projects, project-based academic collaboration, some cross-sector
- Score 5: Multiple ecosystems, structured open innovation, structural research partnerships, active cross-industry

#### Dimension 5: Market Leadership & Strategic Vision (Weight: 15%)
Sub-indicators: thought_leadership, strategic_vision_articulation, sustainability_esg_innovation, future_readiness
- Score 1: No public voice, no public strategy, no sustainability innovation, reactive
- Score 3: Occasional conferences, innovation mentioned in comms, some green initiatives, monitoring trends
- Score 5: Regular thought leadership, clear public strategy, leading on sustainability, proactively investing

### Scoring Rules
- Score what you can evidence. Absence of evidence = score 1.
- Round to 0.5 increments for dimension scores.
- Overall = (R&D x 0.25) + (Product x 0.25) + (Digital x 0.20) + (Partnerships x 0.15) + (Vision x 0.15). Round to 1 decimal.
- Maturity levels: 0.0-1.0 Laggard, 1.1-2.0 Follower, 2.1-3.0 Active, 3.1-4.0 Leader, 4.1-5.0 Pioneer

## PHASE 3: Source Attribution

Every factual claim must be traceable. Include a sources array with id (S1, S2...), title, url, date, type.
Reference sources in evidence like: "According to their 2024 annual report [S1], the company invested..."

## PHASE 4: The "What Surprised Us" Insight

Generate ONE specific, bold insight. Must be comparative, quantifiable if possible, non-obvious, and actionable.

## PHASE 5: Opportunity Framing

Frame all findings as opportunities, not deficiencies. This is an opportunity map, not a report card.

## PHASE 6: Beacon Relevance

Reference specific member types, event formats (Innovation Challenges, Tech Experiences, Inspiration Sessions), the Antwerp ecosystem advantage, and concrete outcomes.

## Output Format

Return ONLY a valid JSON object. No markdown, no code fences, no text before or after.

{
  "overall_score": 3.2,
  "maturity_level": "Innovation Active",
  "industry": "Chemical & Process Industry",
  "company_type": "Industrial",
  "surprising_insight": "One bold, specific insight.",
  "dimensions": [
    {
      "dimension_name": "R&D & Technology Investment",
      "score": 3.5,
      "weight": 0.25,
      "sub_scores": {
        "rd_commitment": 4.0,
        "technology_stack_modernity": 3.0,
        "ip_knowledge_creation": 3.5,
        "technical_talent_investment": 3.5
      },
      "evidence": "2-3 sentences with specific facts and source references [S1], [S2].",
      "key_findings": ["Specific finding with source [S1]", "Another finding [S3]"],
      "insight": "One sentence: what this means as an opportunity for the company."
    }
  ],
  "technologies_detected": [
    { "technology": "IoT Sensor Networks", "source": "S2", "context": "Used in process monitoring" }
  ],
  "strategic_goals": [
    { "goal": "Goal description", "relevance": "Why this matters", "source": "S1" }
  ],
  "active_projects": [
    { "name": "Project name", "status": "active", "description": "Brief description", "source": "S3" }
  ],
  "innovation_opportunities": [
    {
      "opportunity": "Opportunity name",
      "explanation": "Why this is valuable for this company specifically",
      "priority": "high",
      "quick_win": true,
      "beacon_connection": "How The Beacon ecosystem can help"
    }
  ],
  "pain_points_detected": [
    { "pain_point": "Pain point", "explanation": "Evidence and impact", "source": "S1" }
  ],
  "industry_landscape": {
    "current_trends": "2-3 paragraphs on what's transforming their sector in Belgium/Europe RIGHT NOW.",
    "competitive_position": "1 paragraph on where this company sits relative to sector innovation leaders.",
    "emerging_opportunities": "1 paragraph on what's coming in the next 2-3 years."
  },
  "beacon_relevance": "2-3 sentences on why The Beacon addresses this company's needs.",
  "recommended_offerings": [
    { "offering": "Explore Partnership", "price": "€5,000/year", "match_reason": "Specific reason" }
  ],
  "quick_win": {
    "action": "One specific thing they could start this quarter",
    "why": "Why this is the highest-ROI first move",
    "beacon_link": "How The Beacon can help"
  },
  "sources": [
    { "id": "S1", "title": "Source title", "url": "https://...", "date": "2025-03", "type": "company_website" }
  ],
  "data_confidence": "medium",
  "data_confidence_explanation": "What data was and wasn't available."
}`;

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
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 15,
          },
        ],
        messages: [
          { role: "user", content: userMessage },
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
        full_analysis_json: analysisData,
        analysis_status: "matching",
      })
      .eq("id", analysis_id);

    // Insert maturity dimensions with v2 fields
    const dimensionRows = (analysisData.dimensions || []).map(
      (d: {
        dimension_name: string;
        score: number;
        weight: number;
        evidence: string;
        key_findings: string[];
        sub_scores: Record<string, number>;
        insight: string;
      }) => ({
        analysis_id,
        dimension_name: d.dimension_name,
        dimension: d.dimension_name, // backwards compat with old column
        score: d.score,
        weight: d.weight,
        evidence: d.evidence,
        assessment: d.evidence, // backwards compat with old column
        key_findings: d.key_findings || [],
        sub_scores: d.sub_scores || {},
        insight: d.insight || null,
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
