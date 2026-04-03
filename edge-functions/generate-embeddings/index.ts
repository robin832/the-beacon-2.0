import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface EmbeddingRequest {
  table: string;
  id: string;
  text: string;
  schema?: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // Limit input length
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  try {
    const { table, id, text, schema = "public" } = (await req.json()) as EmbeddingRequest;

    if (!table || !id || !text) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: table, id, text" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate embedding
    const embedding = await generateEmbedding(text);

    // Store in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema },
    });

    const { error } = await supabase
      .from(table)
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", id);

    if (error) {
      throw new Error(`Database update error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        table,
        id,
        dimensions: embedding.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
