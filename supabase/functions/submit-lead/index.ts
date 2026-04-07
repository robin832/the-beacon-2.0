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
      await supabase
        .from("interactions")
        .insert({
          session_id,
          event_type: "lead_submitted",
          page: "/report",
          metadata: { lead_id: lead.id, lead_type, rating },
        })
        .catch(() => {});
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
