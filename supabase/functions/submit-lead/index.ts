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
    const body = await req.json();
    const {
      analysis_id,
      session_id,
      name,
      email,
      company_name,
      phone,
      message,
      lead_type,
      rating,
    } = body;

    if (!analysis_id || !lead_type) {
      return new Response(
        JSON.stringify({ error: "analysis_id and lead_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: "innovation" },
    });

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        analysis_id,
        session_id,
        name,
        email,
        company_name,
        phone: phone || null,
        message: message || null,
        lead_type,
        rating: rating || null,
        status: "New",
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("Lead insert error:", leadError);
      return new Response(
        JSON.stringify({ error: "Failed to submit lead" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log interaction
    if (session_id) {
      try {
        await supabase
          .from("interactions")
          .insert({
            session_id,
            event_type: "lead_submitted",
            page: "/report",
            metadata: { lead_id: lead.id, lead_type, rating },
          });
      } catch { /* interaction logging is non-critical */ }
    }

    // Persist feedback on the analysis itself when this submission is the
    // "feedback" lead type OR when we have a rating attached. Both the
    // feedback form and the tryout claim can carry a rating — we only
    // overwrite if the current analysis row doesn't already have feedback,
    // so accidental double-submits don't clobber the first pass.
    if (lead_type === "feedback" || (rating && rating >= 1 && rating <= 5)) {
      try {
        const { data: currentAnalysis } = await supabase
          .from("analyses")
          .select("feedback_submitted_at")
          .eq("id", analysis_id)
          .maybeSingle();

        if (!currentAnalysis?.feedback_submitted_at || lead_type === "feedback") {
          await supabase
            .from("analyses")
            .update({
              user_feedback: message || null,
              user_rating: rating || null,
              feedback_submitted_at: new Date().toISOString(),
            })
            .eq("id", analysis_id);
        }
      } catch (fbError) {
        console.error("Feedback persist failed (non-critical):", fbError);
      }
    }

    // Learning loop: if user provided a rating, update source quality for every source
    // used in the parent analysis. If the feedback text mentions a specific source
    // domain or title, boost/penalize that source directly.
    // We use direct .from() reads/updates instead of RPC to avoid schema-routing issues.
    if (rating && rating >= 1 && rating <= 5) {
      try {
        const { data: analysis } = await supabase
          .from("analyses")
          .select("industry, sources")
          .eq("id", analysis_id)
          .single();

        if (analysis?.sources && Array.isArray(analysis.sources)) {
          const vertical = (analysis.industry as string) || "General";
          const feedbackLower = (message || "").toLowerCase();
          const sources = analysis.sources as Array<{ url?: string; title?: string }>;

          for (const src of sources) {
            if (!src.url) continue;
            let domain = "";
            try {
              domain = new URL(src.url).hostname.replace(/^www\./, "");
            } catch { continue; }

            // Fetch the existing row to recompute the quality score
            const { data: row } = await supabase
              .from("source_quality")
              .select("id, total_report_rating, reports_rated, times_used, times_verified, positive_feedback_count, negative_feedback_count")
              .eq("source_domain", domain)
              .eq("industry_vertical", vertical)
              .maybeSingle();

            if (!row) continue; // source wasn't logged on the analysis side, skip

            const titleLower = (src.title || "").toLowerCase();
            const mentioned = feedbackLower.length > 0 && (
              feedbackLower.includes(domain) ||
              (titleLower.length > 3 && feedbackLower.includes(titleLower))
            );
            const positive = mentioned && rating >= 4;
            const negative = mentioned && rating < 4;

            const newTotalRating = Number(row.total_report_rating || 0) + rating;
            const newReportsRated = (row.reports_rated || 0) + 1;
            const newPos = (row.positive_feedback_count || 0) + (positive ? 1 : 0);
            const newNeg = (row.negative_feedback_count || 0) + (negative ? 1 : 0);

            // Quality score: 40% avg rating + 30% verification rate + 30% feedback ratio
            const avgRating = (newTotalRating / newReportsRated) / 5;
            const verificationRate = row.times_used > 0
              ? (row.times_verified || 0) / row.times_used
              : 0.5;
            const feedbackRatio = (newPos + newNeg) > 0
              ? newPos / (newPos + newNeg)
              : 0.5;
            const qualityScore = (avgRating * 0.4) + (verificationRate * 0.3) + (feedbackRatio * 0.3);

            await supabase
              .from("source_quality")
              .update({
                total_report_rating: newTotalRating,
                reports_rated: newReportsRated,
                positive_feedback_count: newPos,
                negative_feedback_count: newNeg,
                quality_score: Math.round(qualityScore * 100) / 100,
                updated_at: new Date().toISOString(),
              })
              .eq("id", row.id);
          }
        }
      } catch (srcError) {
        console.error("Source rating update failed (non-critical):", srcError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Submit lead error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to submit lead" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
