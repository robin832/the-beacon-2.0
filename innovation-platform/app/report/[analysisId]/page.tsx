'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackEvent, setupScrollTracking, trackTimeOnPage } from '@/lib/tracking';
import { Analysis, MaturityDimension } from '@/lib/types';
import PageTransition from '@/components/ui/PageTransition';
import Header from '@/components/layout/Header';
import ReportHero from '@/components/report/ReportHero';
import RadarChart from '@/components/report/RadarChart';
import MaturityBreakdown from '@/components/report/MaturityBreakdown';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import TechTag from '@/components/ui/TechTag';
import IndustryContext from '@/components/report/IndustryContext';
import RecommendedServices from '@/components/report/RecommendedServices';
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
    return <PageTransition message="Preparing your report" submessage="Loading your innovation maturity assessment..." />;
  }

  const fullJson = analysis.full_analysis_json as Record<string, unknown> | null;
  const dataConfidenceExplanation = fullJson?.data_confidence_explanation as string | undefined;

  // Parse gaps/pain points (handle both string[] and object[] formats)
  const gaps = (analysis.innovation_gaps || []).map((g) =>
    typeof g === 'string' ? { gap: g, explanation: '', priority: 'medium' } : g
  );
  const painPoints = (analysis.pain_points_detected || []).map((p) =>
    typeof p === 'string' ? { pain_point: p, explanation: '' } : p
  );

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero — Score + Maturity Level */}
      <ReportHero analysis={analysis} />

      {/* Section 2: How We Calculated Your Score */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-beacon-dark-teal mb-4">
            How We Calculated Your Score
          </h2>
          <p className="text-beacon-dark-teal/70 leading-relaxed mb-4">
            Your overall score of <strong className="text-beacon-dark-teal">{Number(analysis.overall_score)?.toFixed(1)}/5.0</strong> is
            a weighted average across 5 innovation dimensions. Each dimension was scored
            based on publicly available evidence — including your website, press releases,
            patent filings, partnerships, and industry publications.
          </p>
          <p className="text-beacon-dark-teal/70 leading-relaxed mb-4">
            We look at tangible innovation activity: R&D investments, new product launches,
            digital transformation initiatives, external collaborations, and strategic vision.
            Companies that actively invest in sustainability and ESG innovation receive
            higher scores in the relevant dimensions.
          </p>
          {analysis.data_confidence && (
            <div className="p-4 bg-beacon-light-gray rounded border border-beacon-border">
              <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
                Data confidence: {analysis.data_confidence}
              </span>
              {dataConfidenceExplanation && (
                <p className="text-xs text-beacon-medium-gray mt-1">{dataConfidenceExplanation}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: The 5 Dimensions — Radar + Detailed Breakdown */}
      <section className="bg-beacon-light-gray py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal">
              The 5 Innovation Dimensions
            </h2>
            <Badge variant="cyan">AI-Analyzed</Badge>
          </div>
          <p className="text-beacon-medium-gray mb-12 max-w-2xl">
            Each dimension represents a critical pillar of innovation maturity.
            Here&apos;s how {analysis.company_name} scores — with the evidence behind each rating.
          </p>

          {dimensions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="lg:sticky lg:top-24">
                <RadarChart dimensions={dimensions} />
              </div>
              <MaturityBreakdown dimensions={dimensions} />
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Strategic Goals → Innovation Gaps (logical flow) */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
            From Goals to Gaps
          </h2>
          <p className="text-beacon-medium-gray mb-12 max-w-2xl">
            We identified {analysis.company_name}&apos;s strategic direction and mapped the
            innovation gaps that stand between where you are and where you want to be.
          </p>

          {/* Strategic Goals */}
          {analysis.strategic_goals.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-beacon-dark-teal mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-beacon-cyan/10 flex items-center justify-center text-beacon-cyan text-sm font-bold">1</span>
                Your Strategic Goals
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

          {/* Innovation Gaps */}
          {gaps.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-beacon-dark-teal mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-beacon-orange/10 flex items-center justify-center text-beacon-orange text-sm font-bold">2</span>
                Innovation Gaps to Close
              </h3>
              <div className="space-y-4 ml-11">
                {gaps.map((gap, i) => (
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
                          gap.priority === 'high' ? 'bg-red-50 text-red-600' :
                          gap.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {gap.priority} priority
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pain Points */}
          {painPoints.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-beacon-dark-teal mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-beacon-dark-teal/10 flex items-center justify-center text-beacon-dark-teal text-sm font-bold">3</span>
                Detected Pain Points
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
        </div>
      </section>

      {/* Section 5: Technologies + Active Projects */}
      {(analysis.technologies_detected.length > 0 || analysis.active_projects.length > 0) && (
        <section className="bg-beacon-light-gray py-16 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
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
        </section>
      )}

      {/* Section 6: Industry Context */}
      <IndustryContext context={analysis.industry_context} industry={analysis.industry} />

      {/* Section 7: Community — what companies like yours do here */}
      <section className="bg-beacon-light-gray py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
            What Companies Like Yours Do at The Beacon
          </h2>
          <p className="text-beacon-medium-gray mb-12 max-w-2xl">
            60+ companies across technology, maritime, logistics, and industrial sectors
            collaborate daily at The Beacon. Here&apos;s how.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6" hover>
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="font-bold text-beacon-dark-teal mb-2">Innovation Challenges</h3>
              <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                Companies bring real business problems. Beacon members form cross-industry
                teams to develop solutions in focused 2-day sprints — delivering working
                prototypes for port logistics, predictive maintenance, and supply chain visibility.
              </p>
            </Card>
            <Card className="p-6" hover>
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="font-bold text-beacon-dark-teal mb-2">Cross-Industry Collaboration</h3>
              <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                Our members co-create across sector boundaries. A chemical company&apos;s
                sensor challenge was solved by a maritime tech startup. A logistics firm&apos;s
                automation needs were met by an AI company in the same building.
              </p>
            </Card>
            <Card className="p-6" hover>
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-bold text-beacon-dark-teal mb-2">Knowledge Exchange</h3>
              <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                Monthly tech talks, industry meetups, and inspiration sessions keep our
                community at the forefront. Members share learnings from their digital
                transformation journeys — the successes and the failures.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 8: How The Beacon Can Help — no prices */}
      <RecommendedServices
        offerings={analysis.recommended_offerings}
        beaconRelevance={analysis.beacon_relevance}
      />

      {/* Section 9: Key Takeaway — at the bottom, leading into CTA */}
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

      {/* Section 10: Rating → Tryout (dark section) */}
      <RatingAndCTA analysisId={analysisId} companyName={analysis.company_name} />

      <Footer />
    </div>
  );
}
