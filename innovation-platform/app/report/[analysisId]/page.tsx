'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackEvent, setupScrollTracking, trackTimeOnPage } from '@/lib/tracking';
import { Analysis, MaturityDimension, InnovationOpportunity, TechnologyDetected, AnalysisSource, EcosystemMatch } from '@/lib/types';
import PageTransition from '@/components/ui/PageTransition';
import ReportHero from '@/components/report/ReportHero';
import SurprisingInsight from '@/components/report/SurprisingInsight';
import DimensionExplorer from '@/components/report/DimensionExplorer';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import TechTag from '@/components/ui/TechTag';
import { RichText } from '@/components/ui/SourceLink';
import RatingAndCTA from '@/components/report/RatingAndCTA';
import EcosystemMatches from '@/components/report/EcosystemMatches';
import SourcesWidget from '@/components/report/SourcesWidget';
import Footer from '@/components/layout/Footer';

type CatalogEntry = {
  kind: 'product' | 'membership';
  name: string;
  description: string | null;
  meta: string | null;
  benefits: string[] | null;
};

function findCatalogMatch(name: string, catalog: CatalogEntry[]): CatalogEntry | null {
  if (!name) return null;
  const norm = name.toLowerCase().trim();
  let exact = catalog.find((c) => c.name.toLowerCase() === norm);
  if (exact) return exact;
  exact = catalog.find((c) => norm.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(norm));
  return exact || null;
}

function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ReportPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [dimensions, setDimensions] = useState<MaturityDimension[]>([]);
  const [matches, setMatches] = useState<EcosystemMatch[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [analysisRes, dimensionsRes, matchesRes, productsRes, plansRes] = await Promise.all([
        supabase.from('analyses').select('*').eq('id', analysisId).single(),
        supabase.from('maturity_dimensions').select('*').eq('analysis_id', analysisId).order('weight', { ascending: false }),
        supabase.from('ecosystem_matches').select('*').eq('analysis_id', analysisId).order('match_rank', { ascending: true }),
        supabase.schema('public').from('products').select('name, description, category').eq('is_active', true),
        supabase.schema('public').from('membership_plans').select('name, description, target_audience, benefits').eq('is_active', true).order('display_order', { ascending: true }),
      ]);
      if (cancelled) return;
      if (analysisRes.data) setAnalysis(analysisRes.data as Analysis);
      if (dimensionsRes.data) setDimensions(dimensionsRes.data as MaturityDimension[]);
      if (matchesRes.data) setMatches(matchesRes.data as EcosystemMatch[]);
      const products: CatalogEntry[] = (productsRes.data || []).map((p) => ({
        kind: 'product',
        name: p.name,
        description: p.description,
        meta: p.category || null,
        benefits: null,
      }));
      const plans: CatalogEntry[] = (plansRes.data || []).map((p) => ({
        kind: 'membership',
        name: p.name,
        description: p.description,
        meta: p.target_audience || null,
        benefits: Array.isArray(p.benefits) ? (p.benefits as unknown[]).map(String).slice(0, 4) : null,
      }));
      setCatalog([...plans, ...products]);
      setLoading(false);
    }
    load();
    // Poll for ecosystem matches every 5s (up to ~90s) since matching runs as
    // a background task after the analysis completes.
    let attempts = 0;
    const interval = setInterval(async () => {
      if (cancelled || attempts >= 18) { clearInterval(interval); return; }
      attempts += 1;
      const { data } = await supabase
        .from('ecosystem_matches')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('match_rank', { ascending: true });
      if (cancelled) return;
      if (data && data.length > 0) {
        setMatches(data as EcosystemMatch[]);
        clearInterval(interval);
      }
    }, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [analysisId]);

  useEffect(() => {
    trackEvent('page_view', '/report', { analysis_id: analysisId });
    const cleanupScroll = setupScrollTracking('/report');
    const cleanupTime = trackTimeOnPage('/report');
    return () => { cleanupScroll?.(); cleanupTime?.(); };
  }, [analysisId]);

  // Sticky nav scroll tracking
  useEffect(() => {
    if (!analysis) return;
    const sectionIds = ['hero', 'standout', 'industry', 'dimensions', 'opportunities', 'matches', 'sources', 'cta'];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [analysis]);

  if (loading || !analysis) {
    return <PageTransition message="Building your opportunity map" submessage="Preparing your personalized innovation insights..." />;
  }

  const opportunities: InnovationOpportunity[] = (analysis.innovation_gaps || []).map((g) => {
    if (typeof g === 'string') return { opportunity: g, explanation: '', priority: 'medium', gap: g };
    return g as InnovationOpportunity;
  });

  const technologies: TechnologyDetected[] = (analysis.technologies_detected || []).map((t) =>
    typeof t === 'string' ? { technology: t } : t as TechnologyDetected
  );

  const sources: AnalysisSource[] = analysis.sources || [];
  const researchData = analysis.research_data;

  return (
    <div className="min-h-screen">
      {/* Sticky navigation */}
      <StickyNav activeSection={activeSection} />

      {/* Floating sources panel (fixed to right edge) */}
      <SourcesWidget
        sources={sources}
        confidence={analysis.data_confidence}
        explanation={analysis.data_confidence_explanation}
      />

      {/* AI disclaimer — sticky orange bar, stays visible while scrolling */}
      <div className="sticky top-0 z-[60] bg-beacon-orange text-white px-6 py-2 text-center">
        <p className="text-[11px] font-mono tracking-wide">
          This report is AI-generated from publicly available data. Some details may be limited by sites that restrict automated access.
        </p>
      </div>

      {/* Section 1: Hero */}
      <div id="hero">
        <ReportHero analysis={analysis} />
      </div>

      {/* Section 2: What Stood Out */}
      <div id="standout">
        <SurprisingInsight insight={analysis.surprising_insight} sources={sources} />
      </div>

      {/* Section 3: Two-column — Industry Landscape + Strategic Goals */}
      <section id="industry" className="bg-beacon-light-gray py-20 px-6">
        <FadeInSection>
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
              Industry landscape
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-10">
              {analysis.company_name} & {analysis.industry || 'Your Industry'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Left: Industry Landscape (60%) */}
              <div className="lg:col-span-3">
                {analysis.industry_landscape ? (
                  <div className="space-y-4">
                    {analysis.industry_landscape.current_trends && (
                      <p className="text-beacon-dark-teal/80 leading-relaxed">
                        <RichText text={analysis.industry_landscape.current_trends} sources={sources} />
                      </p>
                    )}
                    {analysis.industry_landscape.competitive_position && (
                      <div className="border-l-4 border-beacon-cyan pl-5">
                        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                          <RichText text={analysis.industry_landscape.competitive_position} sources={sources} />
                        </p>
                      </div>
                    )}
                    {analysis.industry_landscape.emerging_opportunities && (
                      <div className="border-l-4 border-beacon-orange pl-5">
                        <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-2">
                          What&apos;s coming next
                        </h3>
                        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                          <RichText text={analysis.industry_landscape.emerging_opportunities} sources={sources} />
                        </p>
                      </div>
                    )}
                  </div>
                ) : analysis.industry_context ? (
                  <p className="text-beacon-dark-teal/80 leading-relaxed">
                    <RichText text={analysis.industry_context} sources={sources} />
                  </p>
                ) : null}
              </div>

              {/* Right: Strategic Goals (40%) */}
              <div className="lg:col-span-2">
                <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
                  Your Strategic Priorities
                </h3>
                <div className="space-y-3">
                  {analysis.strategic_goals.slice(0, 3).map((goal, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        {goal.alignment && (
                          <span className={`text-sm flex-shrink-0 ${
                            goal.alignment === 'ahead' ? '' :
                            goal.alignment === 'counter' ? '' : ''
                          }`}>
                            {goal.alignment === 'ahead' ? '\u2605' : goal.alignment === 'counter' ? '\u26A0' : '\u2713'}
                          </span>
                        )}
                        <h4 className="font-bold text-beacon-dark-teal text-sm">{goal.goal}</h4>
                      </div>
                      {goal.alignment_explanation ? (
                        <p className="text-xs text-beacon-dark-teal/60 leading-relaxed">{goal.alignment_explanation}</p>
                      ) : (
                        <p className="text-xs text-beacon-dark-teal/60 leading-relaxed">{goal.relevance}</p>
                      )}
                      {goal.source && (
                        <span className="text-[9px] font-mono text-beacon-medium-gray mt-1 inline-block">
                          {goal.source.startsWith('S') ? <RichText text={`[${goal.source}]`} sources={sources} /> : 'Inferred from public data'}
                        </span>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Section 4: Interactive 5 Dimensions */}
      <section id="dimensions" className="bg-white py-20 px-6">
        <FadeInSection>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
              Where {analysis.company_name} Sits in This Landscape
            </h2>
            <p className="text-beacon-medium-gray mb-4 max-w-2xl">
              Your innovation score of <strong className="text-beacon-dark-teal">{Number(analysis.overall_score)?.toFixed(1)}/5.0</strong> is
              based on 5 dimensions, scored from publicly available evidence.
            </p>
            {analysis.data_confidence && (
              <div className="p-3 bg-beacon-light-gray/60 rounded border border-beacon-border mb-10 inline-block">
                <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
                  Data confidence: {analysis.data_confidence}
                </span>
                {analysis.data_confidence_explanation && (
                  <p className="text-xs text-beacon-medium-gray mt-1">{analysis.data_confidence_explanation}</p>
                )}
              </div>
            )}

            {dimensions.length > 0 && (
              <DimensionExplorer dimensions={dimensions} sources={sources} />
            )}

            {/* Technology profile — nested under Dimensions */}
            {technologies.length > 0 && (
              <div className="mt-16">
                <h3 className="text-2xl font-black tracking-tight text-beacon-dark-teal mb-3">
                  Detected Technologies
                </h3>
                <p className="text-beacon-medium-gray mb-8 max-w-2xl">
                  Technologies we detected in {analysis.company_name}&apos;s public footprint, and how they connect to The Beacon ecosystem.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {technologies.map((tech, i) => (
                    <Card key={i} className="p-5" hover>
                      <h4 className="font-bold text-beacon-dark-teal mb-2">{tech.technology}</h4>
                      {tech.context && (
                        <p className="text-xs text-beacon-dark-teal/60 mb-2">{tech.context}</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        {tech.maturity && (
                          <span className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded ${
                            tech.maturity === 'in_production' ? 'bg-green-50 text-green-700' :
                            tech.maturity === 'in_pilot' ? 'bg-blue-50 text-blue-700' :
                            tech.maturity === 'planned' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {tech.maturity.replace(/_/g, ' ')}
                          </span>
                        )}
                        {tech.source && (
                          <span className="text-[9px] font-mono text-beacon-medium-gray">
                            <RichText text={`[${tech.source}]`} sources={sources} />
                          </span>
                        )}
                      </div>
                      {tech.beacon_bridge && (
                        <p className="text-xs text-beacon-cyan mt-2 pt-2 border-t border-beacon-border">
                          {tech.beacon_bridge}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FadeInSection>
      </section>

      {/* Section 5: Innovation Opportunities with concrete ideas */}
      <section id="opportunities" className="bg-beacon-light-gray py-20 px-6">
        <FadeInSection>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
              Your Innovation Opportunities
            </h2>
            <p className="text-beacon-medium-gray mb-12 max-w-2xl">
              Concrete ideas backed by real-world examples from companies in similar positions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {opportunities.map((opp, i) => (
                <OpportunityCard key={i} opportunity={opp} sources={sources} />
              ))}
            </div>

            {/* Recommended Beacon offerings */}
            {analysis.recommended_offerings && analysis.recommended_offerings.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
                  Recommended Beacon Offerings
                </h3>
                {analysis.beacon_relevance && (
                  <p className="text-beacon-dark-teal/70 leading-relaxed mb-6 max-w-3xl">
                    <RichText text={analysis.beacon_relevance} sources={sources} />
                  </p>
                )}
                <div className="space-y-3">
                  {analysis.recommended_offerings.map((offering, i) => {
                    const match = findCatalogMatch(offering.offering, catalog);
                    return (
                      <Card key={i} className="p-5" hover>
                        <div className="flex items-start gap-3">
                          {i === 0 && <Badge variant="default" className="flex-shrink-0">Best Match</Badge>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-beacon-dark-teal">{match?.name || offering.offering}</h4>
                              {match && (
                                <span className="text-[9px] font-mono tracking-widest uppercase text-beacon-cyan border border-beacon-cyan/30 bg-beacon-cyan/5 px-2 py-0.5 rounded">
                                  {match.kind === 'membership' ? 'Membership' : 'Service'}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-beacon-dark-teal/70 leading-relaxed">{offering.match_reason}</p>
                            {match?.description && (
                              <p className="mt-2 text-xs text-beacon-medium-gray leading-relaxed">{match.description}</p>
                            )}
                            {match?.benefits && match.benefits.length > 0 && (
                              <ul className="mt-3 space-y-1">
                                {match.benefits.map((b, j) => (
                                  <li key={j} className="text-xs text-beacon-dark-teal/70 flex items-start gap-1.5">
                                    <span className="text-beacon-cyan mt-0.5">&#x2713;</span>
                                    <span>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </FadeInSection>
      </section>

      {/* Section 6: Ecosystem Matches */}
      {matches.length > 0 && (
        <div id="matches">
          <EcosystemMatches matches={matches} />
        </div>
      )}

      {/* Section 7: Sources & Methodology */}
      <section id="sources" className="bg-beacon-light-gray py-16 px-6">
        <SourcesSection sources={sources} confidence={analysis.data_confidence} explanation={analysis.data_confidence_explanation} researchData={researchData} />
      </section>

      {/* Section 8: CTA */}
      <div id="cta">
        <RatingAndCTA analysisId={analysisId} analysis={analysis} />
      </div>

      <Footer />
    </div>
  );
}

/* ---- Sub-components ---- */

function StickyNav({ activeSection }: { activeSection: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  const sections = [
    { id: 'standout', label: 'What Stood Out' },
    { id: 'industry', label: 'Industry' },
    { id: 'dimensions', label: 'Dimensions' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'matches', label: 'Matches' },
    { id: 'sources', label: 'Sources' },
  ];

  return (
    <nav className="fixed top-[34px] left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-beacon-border shadow-sm" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 h-12 overflow-x-auto">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded whitespace-nowrap transition-colors ${
              activeSection === s.id
                ? 'bg-beacon-cyan/10 text-beacon-cyan'
                : 'text-beacon-medium-gray hover:text-beacon-dark-teal'
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function FadeInSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {children}
    </div>
  );
}

function OpportunityCard({ opportunity, sources }: { opportunity: InnovationOpportunity; sources: AnalysisSource[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-bold text-beacon-dark-teal text-sm leading-tight">{opportunity.opportunity || opportunity.gap}</h4>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {opportunity.quick_win && (
            <span className="text-[9px] font-mono tracking-widest uppercase bg-beacon-cyan/10 text-beacon-cyan px-2 py-0.5 rounded">
              Quick Win
            </span>
          )}
          {opportunity.priority && (
            <span className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded ${
              opportunity.priority === 'high' ? 'bg-beacon-cyan/10 text-beacon-cyan' :
              opportunity.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
              'bg-gray-50 text-gray-500'
            }`}>
              {opportunity.priority}
            </span>
          )}
        </div>
      </div>

      {/* Specific idea or explanation */}
      <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-3 flex-1">
        <RichText text={opportunity.specific_idea || opportunity.explanation || ''} sources={sources} />
      </p>

      {/* Real-world example — expandable. Only show if we have a real company name. */}
      {opportunity.real_world_example?.company && opportunity.real_world_example.what_they_did && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan hover:text-beacon-dark-teal transition-colors"
          >
            {expanded ? 'Hide example' : 'See real-world example \u2192'}
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-beacon-light-gray rounded text-xs" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
              <p className="font-bold text-beacon-dark-teal mb-1">{opportunity.real_world_example.company}</p>
              <p className="text-beacon-dark-teal/60 mb-1">{opportunity.real_world_example.what_they_did}</p>
              {opportunity.real_world_example.result && (
                <p className="text-beacon-dark-teal/70 font-medium mb-1">Result: {opportunity.real_world_example.result}</p>
              )}
              {isValidHttpUrl(opportunity.real_world_example.url) ? (
                <a href={opportunity.real_world_example.url!} target="_blank" rel="noopener noreferrer" className="text-beacon-cyan hover:underline">
                  See how {opportunity.real_world_example.company} did it &rarr;
                </a>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Expected impact */}
      {opportunity.expected_impact && (
        <p className="text-xs text-beacon-dark-teal/50 mb-2">{opportunity.expected_impact}</p>
      )}

      {/* Beacon connection */}
      {opportunity.beacon_connection && (
        <p className="text-xs text-beacon-cyan mt-auto pt-2 border-t border-beacon-border">
          {opportunity.beacon_connection}
        </p>
      )}
    </Card>
  );
}

function SourcesSection({ sources, confidence, explanation, researchData }: {
  sources: AnalysisSource[];
  confidence: string | null;
  explanation: string | null;
  researchData: Analysis['research_data'];
}) {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0 && !confidence) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black tracking-tight text-beacon-dark-teal">
          Data Sources & Methodology
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

      {/* Research stats (always visible) */}
      {researchData && (
        <div className="flex gap-6 mb-4">
          {researchData.total_sources_found > 0 && (
            <div>
              <span className="text-2xl font-black text-beacon-dark-teal">{researchData.total_sources_found}</span>
              <span className="text-xs font-mono text-beacon-medium-gray ml-1">found</span>
            </div>
          )}
          {researchData.sources_used > 0 && (
            <div>
              <span className="text-2xl font-black text-beacon-cyan">{researchData.sources_used}</span>
              <span className="text-xs font-mono text-beacon-medium-gray ml-1">used</span>
            </div>
          )}
          {researchData.sources_rejected > 0 && (
            <div>
              <span className="text-2xl font-black text-beacon-medium-gray">{researchData.sources_rejected}</span>
              <span className="text-xs font-mono text-beacon-medium-gray ml-1">excluded</span>
            </div>
          )}
        </div>
      )}

      {/* Compact summary — expands on click */}
      {sources.length > 0 && !expanded && (
        <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-beacon-border">
          <p className="text-sm text-beacon-dark-teal/70 flex-1">
            This analysis used <strong className="text-beacon-dark-teal">{sources.length}</strong> source{sources.length !== 1 ? 's' : ''}
            {explanation ? ` — ${explanation}` : '.'}
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="text-xs font-mono tracking-widest uppercase text-beacon-cyan hover:text-beacon-dark-teal whitespace-nowrap"
          >
            View all &rarr;
          </button>
        </div>
      )}

      {/* Expanded list */}
      {sources.length > 0 && expanded && (
        <>
          {explanation && (
            <p className="text-sm text-beacon-dark-teal/60 leading-relaxed mb-4">{explanation}</p>
          )}
          {researchData?.rejection_reasons && (
            <p className="text-xs text-beacon-medium-gray mb-4">{researchData.rejection_reasons}</p>
          )}
          <div className="space-y-2">
            {sources.map((source) => {
              const clickable = isValidHttpUrl(source.url) && source.verified !== false;
              return (
              <div key={source.id} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-beacon-border">
                <span className="text-[10px] font-mono font-bold text-beacon-cyan bg-beacon-cyan/10 px-2 py-1 rounded flex-shrink-0 mt-0.5">
                  {source.id}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-beacon-dark-teal">{source.title}</span>
                  {clickable ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-beacon-cyan hover:underline truncate mt-0.5">
                      {source.url}
                    </a>
                  ) : (
                    <span className="block text-xs text-beacon-medium-gray italic mt-0.5">link unavailable</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {source.date && <span className="text-[10px] font-mono text-beacon-medium-gray">{source.date}</span>}
                  {source.type && (
                    <span className="text-[10px] font-mono text-beacon-medium-gray bg-beacon-light-gray px-2 py-0.5 rounded">
                      {source.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
              );
            })}
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="mt-3 text-xs font-mono tracking-widest uppercase text-beacon-medium-gray hover:text-beacon-dark-teal"
          >
            &larr; Collapse
          </button>
        </>
      )}

      <p className="text-[10px] font-mono text-beacon-medium-gray mt-6">
        This analysis is based on publicly available information. Scores reflect visible innovation activity and may not capture internal initiatives.
      </p>
    </div>
  );
}
