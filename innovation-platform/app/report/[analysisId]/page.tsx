'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackEvent, setupScrollTracking, trackTimeOnPage } from '@/lib/tracking';
import { Analysis, MaturityDimension, EcosystemMatch } from '@/lib/types';
import PageTransition from '@/components/ui/PageTransition';

import ReportHero from '@/components/report/ReportHero';
import RadarChart from '@/components/report/RadarChart';
import MaturityBreakdown from '@/components/report/MaturityBreakdown';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import TechTag from '@/components/ui/TechTag';
import StrategicAnalysis from '@/components/report/StrategicAnalysis';
import IndustryContext from '@/components/report/IndustryContext';
import EcosystemMatches from '@/components/report/EcosystemMatches';
import RatingAndCTA from '@/components/report/RatingAndCTA';
import Footer from '@/components/layout/Footer';

export default function ReportPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [dimensions, setDimensions] = useState<MaturityDimension[]>([]);
  const [matches, setMatches] = useState<EcosystemMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [analysisRes, dimensionsRes, matchesRes] = await Promise.all([
        supabase.from('analyses').select('*').eq('id', analysisId).single(),
        supabase.from('maturity_dimensions').select('*').eq('analysis_id', analysisId).order('weight', { ascending: false }),
        supabase.from('ecosystem_matches').select('*').eq('analysis_id', analysisId).order('match_rank', { ascending: true }),
      ]);

      if (analysisRes.data) setAnalysis(analysisRes.data as Analysis);
      if (dimensionsRes.data) setDimensions(dimensionsRes.data as MaturityDimension[]);
      if (matchesRes.data) setMatches(matchesRes.data as EcosystemMatch[]);
      setLoading(false);
    }
    load();
  }, [analysisId]);

  useEffect(() => {
    trackEvent('page_view', '/report', { analysis_id: analysisId });
    const cleanupScroll = setupScrollTracking('/report');
    const cleanupTime = trackTimeOnPage('/report');
    return () => { cleanupScroll?.(); cleanupTime?.(); };
  }, [analysisId]);

  if (loading || !analysis) {
    return <PageTransition message="Preparing your report" submessage="Loading your innovation maturity assessment..." />;
  }

  const fullJson = analysis.full_analysis_json as Record<string, unknown> | null;
  const dataConfidenceExplanation = fullJson?.data_confidence_explanation as string | undefined;

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero with score */}
      <ReportHero analysis={analysis} />

      {/* Section 2: Key Takeaway — the most important thing first */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="black" className="mb-6">Key Takeaway</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-beacon-dark-teal mb-6 leading-tight">
            {analysis.maturity_level === 'Innovation Pioneer' || analysis.maturity_level === 'Innovation Leader'
              ? `${analysis.company_name} shows strong innovation maturity — but there are clear opportunities to accelerate further.`
              : analysis.maturity_level === 'Innovation Active'
              ? `${analysis.company_name} has solid innovation foundations. The next step is moving from active to strategic.`
              : `${analysis.company_name} has room to grow. The right ecosystem and partnerships could fast-track your innovation journey.`
            }
          </h2>
          {analysis.beacon_relevance && (
            <p className="text-beacon-dark-teal/70 leading-relaxed text-lg">
              {analysis.beacon_relevance}
            </p>
          )}
        </div>
      </section>

      {/* Section 3: Innovation Profile — Radar + Dimensions */}
      <section className="bg-beacon-light-gray py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal">
              Your Innovation Profile
            </h2>
            <Badge variant="cyan">AI-Generated</Badge>
          </div>
          <p className="text-beacon-medium-gray mb-12 max-w-2xl">
            We researched {analysis.company_name} across 5 innovation dimensions
            using publicly available data. Each dimension is scored from 0 to 5
            based on concrete evidence.
          </p>

          {dimensions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="lg:sticky lg:top-24">
                <RadarChart dimensions={dimensions} />
                {/* Data confidence note */}
                {analysis.data_confidence && (
                  <div className="mt-4 p-4 bg-white rounded border border-beacon-border">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
                      Data confidence: {analysis.data_confidence}
                    </span>
                    {dataConfidenceExplanation && (
                      <p className="text-xs text-beacon-medium-gray mt-1">{dataConfidenceExplanation}</p>
                    )}
                  </div>
                )}
              </div>
              <MaturityBreakdown dimensions={dimensions} />
            </div>
          )}
        </div>
      </section>

      {/* Section 4: What We Found — Strategic insights, gaps, tech stack */}
      <StrategicAnalysis analysis={analysis} />

      {/* Section 5: Industry Context */}
      <IndustryContext context={analysis.industry_context} industry={analysis.industry} />

      {/* Section 6: The Beacon Community — what companies like yours are doing here */}
      <section className="bg-beacon-light-gray py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
            What Companies Like Yours Do at The Beacon
          </h2>
          <p className="text-beacon-medium-gray mb-12 max-w-2xl">
            The Beacon brings together 60+ companies across technology, maritime, logistics,
            and industrial sectors. Here&apos;s how our community tackles innovation challenges
            similar to yours.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6" hover>
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="font-bold text-beacon-dark-teal mb-2">Innovation Challenges</h3>
              <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                Companies bring real business problems. Beacon members form cross-industry
                teams to develop solutions in focused 2-day sprints. Past challenges have
                delivered working prototypes for port logistics, predictive maintenance,
                and supply chain visibility.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="font-bold text-beacon-dark-teal mb-2">Cross-Industry Collaboration</h3>
              <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                Our members regularly co-create solutions across sector boundaries.
                A chemical company&apos;s sensor data challenge was solved by a maritime
                tech startup. A logistics firm&apos;s automation needs were met by
                an AI company in the same building.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-bold text-beacon-dark-teal mb-2">Knowledge Exchange</h3>
              <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                Monthly tech talks, industry meetups, and inspiration sessions
                keep our community at the forefront of innovation trends. Members
                share learnings from their digital transformation journeys — the
                successes and the failures.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 7: Ecosystem Matches — 2 visible + 4 locked */}
      {matches.length > 0 && <EcosystemMatches matches={matches} />}

      {/* Section 8: How The Beacon Can Help — recommendations tied to gaps */}
      {analysis.recommended_offerings && analysis.recommended_offerings.length > 0 && (
        <section className="bg-beacon-light-gray py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
              How The Beacon Can Help
            </h2>
            <p className="text-beacon-medium-gray mb-12 max-w-2xl">
              Based on the gaps and opportunities we identified, here are the Beacon
              programs that would have the highest impact for {analysis.company_name}.
            </p>

            <div className="space-y-6">
              {analysis.recommended_offerings.map((offering, i) => (
                <Card key={i} className="p-6 sm:p-8" hover>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {i === 0 && <Badge variant="default">Best Match</Badge>}
                        <h3 className="text-lg font-bold text-beacon-dark-teal">{offering.offering}</h3>
                      </div>
                      {offering.price && (
                        <span className="text-sm font-mono text-beacon-medium-gray">{offering.price}</span>
                      )}
                      <p className="mt-3 text-sm text-beacon-dark-teal/70 leading-relaxed">
                        {offering.match_reason}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 9: Tech Stack detected */}
      {analysis.technologies_detected && analysis.technologies_detected.length > 0 && (
        <section className="bg-white py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
              Technologies We Detected
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.technologies_detected.map((tech, i) => (
                <TechTag key={i} label={tech} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 10: Rating → Unlock Tryout */}
      <RatingAndCTA analysisId={analysisId} companyName={analysis.company_name} />

      <Footer />
    </div>
  );
}
