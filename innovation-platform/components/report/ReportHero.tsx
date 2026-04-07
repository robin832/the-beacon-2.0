'use client';

import { Analysis } from '@/lib/types';

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
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[0.95]">
          {analysis.company_name}
          <span className="text-white/30"> × </span>
          The Beacon
        </h1>
        <p className="mt-4 text-xl text-white/60">Innovation Maturity Report</p>

        <div className="mt-12 inline-block border border-white/30 bg-white/10 rounded-lg p-8">
          <div className="text-6xl sm:text-7xl font-black tracking-tight">
            {analysis.overall_score?.toFixed(1) || '—'}
            <span className="text-2xl font-normal text-white/50"> / 5.0</span>
          </div>
          <p className="mt-2 font-mono text-xs tracking-widest uppercase text-white/60">
            {analysis.maturity_level || 'Assessment Pending'}
          </p>
        </div>

        <p className="mt-8 font-mono text-xs tracking-widest text-white/30">
          {date}
        </p>
      </div>
    </section>
  );
}
