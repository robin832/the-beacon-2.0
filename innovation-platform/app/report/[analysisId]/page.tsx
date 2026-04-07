'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackEvent, setupScrollTracking, trackTimeOnPage } from '@/lib/tracking';
import { Analysis, MaturityDimension, EcosystemMatch } from '@/lib/types';

import ReportHero from '@/components/report/ReportHero';
import RadarChart from '@/components/report/RadarChart';
import MaturityBreakdown from '@/components/report/MaturityBreakdown';
import Badge from '@/components/ui/Badge';
import StrategicAnalysis from '@/components/report/StrategicAnalysis';
import IndustryContext from '@/components/report/IndustryContext';
import EcosystemMatches from '@/components/report/EcosystemMatches';
import RecommendedServices from '@/components/report/RecommendedServices';
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
        supabase
          .from('analyses')
          .select('*')
          .eq('id', analysisId)
          .single(),
        supabase
          .from('maturity_dimensions')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('weight', { ascending: false }),
        supabase
          .from('ecosystem_matches')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('match_rank', { ascending: true }),
      ]);

      if (analysisRes.data) setAnalysis(analysisRes.data as Analysis);
      if (dimensionsRes.data) setDimensions(dimensionsRes.data as MaturityDimension[]);
      if (matchesRes.data) setMatches(matchesRes.data as EcosystemMatch[]);

      setLoading(false);
    }
    load();
  }, [analysisId]);

  // Tracking
  useEffect(() => {
    trackEvent('page_view', '/report', { analysis_id: analysisId });
    const cleanupScroll = setupScrollTracking('/report');
    const cleanupTime = trackTimeOnPage('/report');
    return () => {
      cleanupScroll?.();
      cleanupTime?.();
    };
  }, [analysisId]);

  if (loading || !analysis) {
    return (
      <div className="min-h-screen bg-beacon-dark-teal flex items-center justify-center">
        <div className="text-center">
          <div className="text-white/20 font-black text-2xl tracking-tight mb-4">
            THE BEACON
          </div>
          <p className="text-white/40 font-mono text-sm">Loading your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero */}
      <ReportHero analysis={analysis} />

      {/* Section 2: Innovation Profile */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal">
              Your Innovation Profile
            </h2>
            <Badge variant="black">AI-Generated</Badge>
          </div>

          {dimensions.length > 0 && (
            <>
              <RadarChart dimensions={dimensions} />
              <div className="mt-12">
                <MaturityBreakdown dimensions={dimensions} />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Section 3: Strategic Analysis */}
      <StrategicAnalysis analysis={analysis} />

      {/* Section 4: Industry Context */}
      <IndustryContext context={analysis.industry_context} industry={analysis.industry} />

      {/* Section 5: Ecosystem Matches */}
      {matches.length > 0 && <EcosystemMatches matches={matches} />}

      {/* Section 6: Recommended Services */}
      <RecommendedServices offerings={analysis.recommended_offerings} />

      {/* Section 7: Rating & CTA */}
      <RatingAndCTA analysisId={analysisId} companyName={analysis.company_name} />

      <Footer />
    </div>
  );
}
