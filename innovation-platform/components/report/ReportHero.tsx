'use client';

import { Analysis } from '@/lib/types';
import Badge from '@/components/ui/Badge';

interface ReportHeroProps {
  analysis: Analysis;
}

export default function ReportHero({ analysis }: ReportHeroProps) {
  const date = new Date(analysis.analyzed_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="bg-beacon-dark-teal text-white py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs tracking-widest uppercase text-white/40 mb-4">
          Innovation Opportunity Map
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[0.95]">
          {analysis.company_name}
          <span className="text-white/30"> × </span>
          The Beacon
        </h1>
        <p className="mt-4 text-lg text-white/50 max-w-2xl">
          An AI-powered look at where you stand, what&apos;s changing in your industry, and where the biggest opportunities lie.
        </p>

        <div className="mt-12 flex flex-wrap items-end gap-6">
          <div className="inline-block border border-white/20 bg-white/5 rounded-lg px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-1">
              Innovation Score
            </p>
            <div className="text-4xl font-black tracking-tight">
              {analysis.overall_score?.toFixed(1) || '—'}
              <span className="text-lg font-normal text-white/40"> / 5.0</span>
            </div>
          </div>
          {analysis.maturity_level && (
            <Badge variant="cyan" className="mb-1">{analysis.maturity_level}</Badge>
          )}
        </div>

        <p className="mt-8 font-mono text-xs tracking-widest text-white/30">
          {date}
        </p>
      </div>
    </section>
  );
}
