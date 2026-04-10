'use client';

import { AnalysisSource } from '@/lib/types';
import { RichText } from '@/components/ui/SourceLink';

interface SurprisingInsightProps {
  insight: string | null;
  sources: AnalysisSource[];
}

export default function SurprisingInsight({ insight, sources }: SurprisingInsightProps) {
  if (!insight) return null;

  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="relative border-2 border-beacon-cyan/30 rounded-lg p-8 bg-beacon-cyan/[0.03]">
          <div className="absolute -top-3 left-6 bg-white px-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan font-bold">
              What stood out
            </span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-beacon-dark-teal leading-relaxed">
            <RichText text={insight} sources={sources} />
          </p>
        </div>
      </div>
    </section>
  );
}
