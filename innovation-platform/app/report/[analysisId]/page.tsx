'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackEvent, setupScrollTracking, trackTimeOnPage } from '@/lib/tracking';
import { Analysis, MaturityDimension, EcosystemMatch } from '@/lib/types';
import PageTransition from '@/components/ui/PageTransition';
import ReportHero from '@/components/report/ReportHero';
import SurprisingInsight from '@/components/report/SurprisingInsight';
import IndustryContext from '@/components/report/IndustryContext';
import RadarChart from '@/components/report/RadarChart';
import MaturityBreakdown from '@/components/report/MaturityBreakdown';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import TechTag from '@/components/ui/TechTag';
import EcosystemTeaser from '@/components/report/EcosystemTeaser';
import RecommendedServices from '@/components/report/RecommendedServices';
import QuickWin from '@/components/report/QuickWin';
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
    return <PageTransition message="Building your opportunity map" submessage="Preparing your personalized innovation insights..." />;
  }

  const fullJson = analysis.full_analysis_json as Record<string, unknown> | null;
  const dataConfidenceExplanation = fullJson?.data_confidence_explanation as string | undefined;

  // Parse gaps as opportunity areas
  const opportunities = (analysis.innovation_gaps || []).map((g) =>
    typeof g === 'string' ? { gap: g, explanation: '', priority: 'medium' } : g
  );
  const painPoints = (analysis.pain_points_detected || []).map((p) =>
    typeof p === 'string' ? { pain_point: p, explanation: '' } : p
  );

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero — Company × The Beacon, score de-emphasized */}
      <ReportHero analysis={analysis} />

      {/* Section 2: What Surprised Us — bold insight card */}
      <SurprisingInsight insight={analysis.surprising_insight} />

      {/* Section 3: Industry Landscape — what's transforming their sector */}
      <IndustryContext context={analysis.industry_context} industry={analysis.industry} />

      {/* Section 4: Your Position — radar chart + dimension breakdown */}
      <section className="bg-beacon-light-gray py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal">
              Where {analysis.company_name} Stands
            </h2>
            <Badge variant="cyan">AI-Analyzed</Badge>
          </div>
          <p className="text-beacon-medium-gray mb-4 max-w-2xl">
            Your innovation score of <strong className="text-beacon-dark-teal">{Number(analysis.overall_score)?.toFixed(1)}/5.0</strong> is
            based on 5 dimensions, scored from publicly available evidence — website, press releases,
            patent filings, partnerships, and industry publications.
          </p>
          {analysis.data_confidence && (
            <div className="p-3 bg-white/60 rounded border border-beacon-border mb-12 inline-block">
              <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
                Data confidence: {analysis.data_confidence}
              </span>
              {dataConfidenceExplanation && (
                <p className="text-xs text-beacon-medium-gray mt-1">{dataConfidenceExplanation}</p>
              )}
            </div>
          )}

          {dimensions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="lg:sticky lg:top-24">
                <RadarChart dimensions={dimensions} />
              </div>
              <MaturityBreakdown dimensions={dimensions} />
            </div>
          )}

          {/* Technologies + Active Projects — compact, under the dimensions */}
          {(analysis.technologies_detected.length > 0 || analysis.active_projects.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 pt-12 border-t border-beacon-border">
              {analysis.technologies_detected.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
                    Technologies Detected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.technologies_detected.map((tech, i) => (
                      <TechTag key={i} label={tech} />
                    ))}
                  </div>
                </div>
              )}
              {analysis.active_projects.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
                    Active Projects
                  </h3>
                  <div className="space-y-3">
                    {analysis.active_projects.map((project, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded mt-0.5 ${
                          project.status === 'active' ? 'bg-green-100 text-green-700' :
                          project.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{project.status}</span>
                        <div>
                          <span className="text-sm font-medium text-beacon-dark-teal">{project.name}</span>
                          {project.description && <p className="text-xs text-beacon-medium-gray mt-0.5">{project.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Section 5: Opportunity Areas — gaps reframed as opportunities */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
            Your Biggest Opportunities
          </h2>
          <p className="text-beacon-medium-gray mb-12 max-w-2xl">
            Based on {analysis.company_name}&apos;s profile and industry trends, these are the areas
            where you could gain the most ground.
          </p>

          {/* Strategic Goals */}
          {analysis.strategic_goals.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-beacon-dark-teal mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-beacon-cyan/10 flex items-center justify-center text-beacon-cyan text-sm font-bold">1</span>
                Where You&apos;re Heading
              </h3>
              <div className="space-y-4 ml-11">
                {analysis.strategic_goals.map((goal, i) => (
                  <Card key={i} className="p-6 border-l-4 border-l-beacon-cyan">
                    <h4 className="font-bold text-beacon-dark-teal">{goal.goal}</h4>
                    <p className="mt-1 text-sm text-beacon-dark-teal/70 leading-relaxed">{goal.relevance}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Opportunity Areas (was: Innovation Gaps) */}
          {opportunities.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-beacon-dark-teal mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-beacon-orange/10 flex items-center justify-center text-beacon-orange text-sm font-bold">2</span>
                Opportunity Areas
              </h3>
              <div className="space-y-4 ml-11">
                {opportunities.map((gap, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-beacon-dark-teal">{gap.gap}</h4>
                        {gap.explanation && (
                          <p className="mt-1 text-sm text-beacon-dark-teal/70 leading-relaxed">{gap.explanation}</p>
                        )}
                      </div>
                      {gap.priority && (
                        <span className={`text-[10px] font-mono tracking-widest uppercase px-2 py-1 rounded ml-4 flex-shrink-0 ${
                          gap.priority === 'high' ? 'bg-beacon-cyan/10 text-beacon-cyan' :
                          gap.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {gap.priority === 'high' ? 'high impact' : gap.priority === 'medium' ? 'medium impact' : 'explore'}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Untapped Potential (was: Pain Points) */}
          {painPoints.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-beacon-dark-teal mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-beacon-dark-teal/10 flex items-center justify-center text-beacon-dark-teal text-sm font-bold">3</span>
                Untapped Potential
              </h3>
              <div className="space-y-4 ml-11">
                {painPoints.map((p, i) => (
                  <Card key={i} className="p-6">
                    <h4 className="font-bold text-beacon-dark-teal">{p.pain_point}</h4>
                    {p.explanation && (
                      <p className="mt-1 text-sm text-beacon-dark-teal/70 leading-relaxed">{p.explanation}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quick Win */}
          <QuickWin quickWin={analysis.quick_win} />
        </div>
      </section>

      {/* Section 6: Your Ecosystem — matches teased mid-report */}
      <EcosystemTeaser matches={matches} companyName={analysis.company_name} />

      {/* Section 7: How The Beacon Can Help */}
      <RecommendedServices
        offerings={analysis.recommended_offerings}
        beaconRelevance={analysis.beacon_relevance}
      />

      {/* Section 8: Key Takeaway */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-beacon-dark-teal mb-6 leading-tight">
            {analysis.maturity_level === 'Innovation Pioneer' || analysis.maturity_level === 'Innovation Leader'
              ? `${analysis.company_name} is already innovating. The Beacon can help you go further, faster — with the right partners by your side.`
              : analysis.maturity_level === 'Innovation Active'
              ? `${analysis.company_name} has solid foundations. The next step? Moving from active to strategic — and The Beacon ecosystem is built for exactly that.`
              : `Every innovation leader started somewhere. The Beacon gives ${analysis.company_name} the ecosystem, expertise, and connections to accelerate.`
            }
          </h2>
        </div>
      </section>

      {/* Section 9: Rating → Tryout */}
      <RatingAndCTA analysisId={analysisId} companyName={analysis.company_name} />

      <Footer />
    </div>
  );
}
