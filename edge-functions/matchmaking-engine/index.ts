import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MatchRequest {
  account_id: string;
  limit?: number;
  exclude_ids?: string[];
}

interface MatchCandidate {
  id: string;
  name: string;
  account_type: string;
  technologies: string[];
  industry_verticals: string[];
  pain_points: string[];
  use_cases: string[];
  offering_capabilities: string[];
  collaboration_interests: string[];
  embedding_similarity: number;
  tag_overlap_score: number;
  complementary_score: number;
  composite_score: number;
}

function calculateTagOverlap(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const setA = new Set(a);
  const overlap = b.filter((item) => setA.has(item)).length;
  return overlap / Math.max(a.length, b.length);
}

function calculateComplementaryScore(
  painPoints: string[],
  offerings: string[],
  useCases: string[],
  targetPainPoints: string[],
  targetOfferings: string[],
  targetUseCases: string[]
): number {
  let score = 0;
  let signals = 0;

  // Their offerings match our pain points
  if (painPoints?.length && offerings?.length) {
    // Simple keyword overlap as proxy for complementarity
    const painSet = new Set(painPoints.map((p) => p.toLowerCase()));
    const offerMatch = offerings.filter((o) =>
      [...painSet].some((p) => o.toLowerCase().includes(p) || p.includes(o.toLowerCase()))
    ).length;
    if (offerings.length > 0) {
      score += offerMatch / offerings.length;
      signals++;
    }
  }

  // Our offerings match their pain points
  if (targetPainPoints?.length && targetOfferings?.length) {
    const targetPainSet = new Set(targetPainPoints.map((p) => p.toLowerCase()));
    const reverseMatch = targetOfferings.filter((o) =>
      [...targetPainSet].some((p) => o.toLowerCase().includes(p) || p.includes(o.toLowerCase()))
    ).length;
    if (targetOfferings.length > 0) {
      score += reverseMatch / targetOfferings.length;
      signals++;
    }
  }

  return signals > 0 ? score / signals : 0;
}

serve(async (req) => {
  try {
    const {
      account_id,
      limit = 10,
      exclude_ids = [],
    } = (await req.json()) as MatchRequest;

    if (!account_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: account_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch target account
    const { data: target, error: targetError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", account_id)
      .single();

    if (targetError || !target) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch candidate accounts (active, non-archived, not self)
    const { data: candidates, error: candidateError } = await supabase
      .from("accounts")
      .select(
        "id, name, account_type, membership_tier, technologies, industry_verticals, pain_points, use_cases, offering_capabilities, collaboration_interests, community_goals, embedding"
      )
      .neq("id", account_id)
      .is("archived_at", null)
      .in("account_type", ["Tech Member", "Industry Partner", "Ecosystem Partner"]);

    if (candidateError || !candidates) {
      throw new Error(`Failed to fetch candidates: ${candidateError?.message}`);
    }

    // Filter out excluded IDs
    const excludeSet = new Set(exclude_ids);
    const filtered = candidates.filter((c) => !excludeSet.has(c.id));

    // Score each candidate
    const scored: MatchCandidate[] = filtered.map((candidate) => {
      // Tag overlap (shared technologies + industry)
      const techOverlap = calculateTagOverlap(
        target.technologies || [],
        candidate.technologies || []
      );
      const industryOverlap = calculateTagOverlap(
        target.industry_verticals || [],
        candidate.industry_verticals || []
      );
      const tagScore = techOverlap * 0.6 + industryOverlap * 0.4;

      // Complementary score (pain points <-> offerings)
      const complementary = calculateComplementaryScore(
        target.pain_points || [],
        candidate.offering_capabilities || [],
        candidate.use_cases || [],
        candidate.pain_points || [],
        target.offering_capabilities || [],
        target.use_cases || []
      );

      // Embedding similarity (if both have embeddings)
      let embeddingSimilarity = 0;
      if (target.embedding && candidate.embedding) {
        // Cosine similarity calculated in DB would be better,
        // but for now we use a simplified approach
        embeddingSimilarity = 0.5; // Placeholder — use RPC for real similarity
      }

      // Composite score: weighted combination
      // Complementary (30%) + Tag overlap (25%) + Embedding (20%) + Industry (10%) + Collaboration fit (10%) + Size diversity (5%)
      const composite =
        complementary * 0.30 +
        tagScore * 0.25 +
        embeddingSimilarity * 0.20 +
        industryOverlap * 0.10 +
        (candidate.collaboration_interests?.length ? 0.10 : 0) +
        0.05; // Base score

      return {
        id: candidate.id,
        name: candidate.name,
        account_type: candidate.account_type,
        technologies: candidate.technologies || [],
        industry_verticals: candidate.industry_verticals || [],
        pain_points: candidate.pain_points || [],
        use_cases: candidate.use_cases || [],
        offering_capabilities: candidate.offering_capabilities || [],
        collaboration_interests: candidate.collaboration_interests || [],
        embedding_similarity: embeddingSimilarity,
        tag_overlap_score: tagScore,
        complementary_score: complementary,
        composite_score: Math.round(composite * 100) / 100,
      };
    });

    // Sort by composite score and take top N
    scored.sort((a, b) => b.composite_score - a.composite_score);
    const topMatches = scored.slice(0, limit);

    return new Response(
      JSON.stringify({
        target_account: {
          id: target.id,
          name: target.name,
          technologies: target.technologies,
          industry_verticals: target.industry_verticals,
        },
        match_count: topMatches.length,
        matches: topMatches,
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
