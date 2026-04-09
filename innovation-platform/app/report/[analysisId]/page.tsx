'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackEvent, setupScrollTracking, trackTimeOnPage } from '@/lib/tracking';
import { Analysis, MaturityDimension, InnovationOpportunity, TechnologyDetected, AnalysisSource } from '@/lib/types';
import PageTransition from '@/components/ui/PageTransition';
import ReportHero from '@/components/report/ReportHero';
import SurprisingInsight from '@/components/report/SurprisingInsight';
import IndustryContext from '@/components/report/IndustryContext';
import RadarChart from '@/components/report/RadarChart';
import MaturityBreakdown from '@/components/report/MaturityBreakdown';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import TechTag from '@/components/ui/TechTag';
import QuickWin from '@/components/report/QuickWin';
import RatingAndCTA from '@/components/report/RatingAndCTA';
import Footer from '@/components/layout/Footer';

export default function ReportPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [dimensions, setDimensions] = useState<MaturityDimension[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [analysisRes, dimensionsRes] = await Promise.all([
        supabase.from('analyses').select('*').eq('id', analysisId).single(),
        supabase.from('maturity_dimensions').select('*').eq('analysis_id', analysisId).order('weight', { ascending: false }),
      ]);
      if (analysisRes.data) setAnalysis(analysisRes.data as Analysis);
      if (dimensionsRes.data) setDimensions(dimensionsRes.data as MaturityDimension[]);
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

  // Parse opportunities from innovation_gaps (v2 uses innovation_opportunities stored in same column)
  const opportunities: InnovationOpportunity[] = (analysis.innovation_gaps || []).map((g) => {
    if (typeof g === 'string') return { opportunity: g, explanation: '', priority: 'medium', gap: g };
    return {
      opportunity: (g as InnovationOpportunity).opportunity || (g as InnovationOpportunity).gap || '',
      explanation: (g as InnovationOpportunity).explanation || '',
      priority: (g as InnovationOpportunity).priority || 'medium',
      quick_win: (g as InnovationOpportunity).quick_win,
      beacon_connection: (g as InnovationOpportunity).beacon_connection,
      gap: (g as InnovationOpportunity).gap,
    };
  });

  // Parse technologies — handle both string[] and object[] formats
  const technologies: TechnologyDetected[] = (analysis.technologies_detected || []).map((t) =>
    typeof t === 'string' ? { technology: t } : t as TechnologyDetected
  );

  // Sources
  const sources: AnalysisSource[] = analysis.sources || [];

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero — dark background */}
      <ReportHero analysis={analysis} />

      {/* Section 2: What Surprised Us — white background */}
      <SurprisingInsight insight={analysis.surprising_insight} />

      {/* Section 3: Industry Landscape — light gray background */}
      <IndustryContext
        context={analysis.industry_context}
        industry={analysis.industry}
        landscape={analysis.industry_landscape}
        companyName={analysis.company_name}
      />

      {/* Section 4: Your Position — white background */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal">
              Where {analysis.company_name} Sits in This Landscape
            </h2>
          </div>
          <p className="text-beacon-medium-gray mb-12 max-w-2xl">
            Your innovation score of <strong className="text-beacon-dark-teal">{Number(analysis.overall_score)?.toFixed(1)}/5.0</strong> is
            based on 5 dimensions, scored from publicly available evidence — website, press releases,
            patent filings, partnerships, and industry publications.
          </p>

          {dimensions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="lg:sticky lg:top-24">
                <RadarChart dimensions={dimensions} />
                {/* Dimension score legend below chart */}
                <div className="mt-6 grid grid-cols-1 gap-2">
                  {dimensions.map((d) => (
                    <div key={d.id} className="flex items-center justify-between px-3 py-2 bg-beacon-light-gray rounded">
                      <span className="text-sm text-beacon-dark-teal font-medium">{d.dimension_name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-beacon-border rounded-full">
                          <div
                            className="h-1.5 bg-beacon-cyan rounded-full"
                            style={{ width: `${((d.score || 0) / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-beacon-dark-teal w-8 text-right">{d.score?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <MaturityBreakdown dimensions={dimensions} />
            </div>
          )}
        </div>
      </section>

      {/* Section 5: Opportunity Areas — light gray background */}
      <section className="bg-beacon-light-gray py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
            Your Innovation Opportunities
          </h2>
          <p className="text-beacon-medium-gray mb-12 max-w-2xl">
            Based on {analysis.company_name}&apos;s profile and industry trends, these are the areas
            where you could gain the most ground.
          </p>

          {/* Opportunity Cards */}
          {opportunities.length > 0 && (
            <div className="space-y-4 mb-12">
              {opportunities.map((opp, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-beacon-dark-teal">{opp.opportunity || opp.gap}</h4>
                        {opp.quick_win && (
                          <span className="text-[10px] font-mono tracking-widest uppercase bg-beacon-cyan/10 text-beacon-cyan px-2 py-0.5 rounded">
                            Quick Win
                          </span>
                        )}
                      </div>
                      {opp.explanation && (
                        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-2">{opp.explanation}</p>
                      )}
                      {opp.beacon_connection && (
                        <p className="text-xs text-beacon-cyan mt-2">
                          <span className="font-mono tracking-widest uppercase">Beacon:</span> {opp.beacon_connection}
                        </p>
                      )}
                    </div>
                    {opp.priority && (
                      <span className={`text-[10px] font-mono tracking-widest uppercase px-2 py-1 rounded flex-shrink-0 ${
                        opp.priority === 'high' ? 'bg-beacon-cyan/10 text-beacon-cyan' :
                        opp.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {opp.priority === 'high' ? 'high priority' : opp.priority === 'medium' ? 'medium' : 'explore'}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Technologies detected — enriched tags */}
          {technologies.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
                Technologies Detected
              </h3>
              <div className="flex flex-wrap gap-2">
                {technologies.map((tech, i) => (
                  <TechTag
                    key={i}
                    label={tech.technology}
                    source={tech.source}
                    context={tech.context}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Strategic goals */}
          {analysis.strategic_goals.length > 0 && (
            <div>
              <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
                Strategic Goals
              </h3>
              <div className="space-y-3">
                {analysis.strategic_goals.map((goal, i) => (
                  <Card key={i} className="p-5 border-l-4 border-l-beacon-cyan">
                    <h4 className="font-bold text-beacon-dark-teal text-sm">{goal.goal}</h4>
                    <p className="mt-1 text-sm text-beacon-dark-teal/70 leading-relaxed">{goal.relevance}</p>
                    {goal.source && (
                      <span className="text-[10px] font-mono text-beacon-medium-gray mt-1 inline-block">[{goal.source}]</span>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 6: Recommended Next Steps — white background */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-8">
            Your Recommended Next Steps
          </h2>

          {/* Quick Win */}
          <QuickWin quickWin={analysis.quick_win} />

          {/* Recommended Beacon offerings — no pricing */}
          {analysis.recommended_offerings && analysis.recommended_offerings.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-6">
                Recommended Beacon Offerings
              </h3>
              {analysis.beacon_relevance && (
                <p className="text-beacon-dark-teal/70 leading-relaxed mb-8 max-w-3xl">
                  {analysis.beacon_relevance}
                </p>
              )}
              <div className="space-y-4">
                {analysis.recommended_offerings.map((offering, i) => (
                  <Card key={i} className="p-6" hover>
                    <div className="flex items-start gap-4">
                      {i === 0 && <Badge variant="default" className="flex-shrink-0">Best Match</Badge>}
                      <div>
                        <h4 className="text-lg font-bold text-beacon-dark-teal">{offering.offering}</h4>
                        <p className="mt-1 text-sm text-beacon-dark-teal/70 leading-relaxed">
                          {offering.match_reason}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 7: Sources & Confidence — clearly visible */}
      <SourcesSection sources={sources} confidence={analysis.data_confidence} explanation={analysis.data_confidence_explanation} />

      {/* Section 8: CTA — Rating + Contact */}
      <RatingAndCTA analysisId={analysisId} companyName={analysis.company_name} />

      <Footer />
    </div>
  );
}

function SourcesSection({ sources, confidence, explanation }: {
  sources: AnalysisSource[];
  confidence: string | null;
  explanation: string | null;
}) {
  if (sources.length === 0 && !confidence) return null;

  return (
    <section className="bg-beacon-light-gray py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight text-beacon-dark-teal">
            Data Sources
          </h2>
          {confidence && (
            <span className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded ${
              confidence === 'high' ? 'bg-green-50 text-green-700' :
              confidence === 'medium' ? 'bg-yellow-50 text-yellow-700' :
              'bg-red-50 text-red-600'
            }`}>
              {confidence} confidence
            </span>
          )}
        </div>

        {explanation && (
          <p className="text-sm text-beacon-dark-teal/60 leading-relaxed mb-6">{explanation}</p>
        )}

        {sources.length > 0 && (
          <div className="space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-beacon-border">
                <span className="text-[10px] font-mono font-bold text-beacon-cyan bg-beacon-cyan/10 px-2 py-1 rounded flex-shrink-0 mt-0.5">
                  {source.id}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-beacon-dark-teal">{source.title}</span>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-beacon-cyan hover:underline truncate mt-0.5"
                    >
                      {source.url}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {source.date && (
                    <span className="text-[10px] font-mono text-beacon-medium-gray">{source.date}</span>
                  )}
                  {source.type && (
                    <span className="text-[10px] font-mono text-beacon-medium-gray bg-beacon-light-gray px-2 py-0.5 rounded">
                      {source.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
