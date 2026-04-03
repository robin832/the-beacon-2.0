import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SearchRequest {
  query: string;
  tables?: string[];
  limit?: number;
  threshold?: number;
  filters?: Record<string, unknown>;
}

async function embedQuery(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  try {
    const {
      query,
      tables = ["accounts", "contacts", "events"],
      limit = 10,
      threshold = 0.3,
    } = (await req.json()) as SearchRequest;

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing required field: query" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const queryEmbedding = await embedQuery(query);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Search each table and merge results
    const results: Array<{
      table: string;
      id: string;
      name: string;
      similarity: number;
      data: Record<string, unknown>;
    }> = [];

    // Table-specific configurations
    const tableConfig: Record<string, { nameField: string; selectFields: string }> = {
      accounts: {
        nameField: "name",
        selectFields: "id, name, account_type, membership_tier, technologies, industry_verticals, description",
      },
      contacts: {
        nameField: "full_name",
        selectFields: "id, full_name, job_title, email, tech_interests, industry_focus",
      },
      events: {
        nameField: "name",
        selectFields: "id, name, event_type, event_date, topics, industry_focus, status",
      },
      community_news: {
        nameField: "headline",
        selectFields: "id, headline, news_type, description, status",
      },
      trends_intel: {
        nameField: "name",
        selectFields: "id, name, industry, category, relevance_score, stage",
      },
      knowledge_base: {
        nameField: "title",
        selectFields: "id, title, resource_type, category, description",
      },
    };

    for (const table of tables) {
      const config = tableConfig[table];
      if (!config) continue;

      // Use RPC call for vector similarity search
      const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: JSON.stringify(queryEmbedding),
        match_table: table,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) {
        console.error(`Error searching ${table}:`, error.message);
        continue;
      }

      if (data) {
        for (const row of data) {
          results.push({
            table,
            id: row.id,
            name: row[config.nameField] || row.name || "Unknown",
            similarity: row.similarity,
            data: row,
          });
        }
      }
    }

    // Sort by similarity and limit
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, limit);

    return new Response(
      JSON.stringify({
        query,
        result_count: topResults.length,
        results: topResults,
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
