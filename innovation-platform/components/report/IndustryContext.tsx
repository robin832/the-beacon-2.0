'use client';

import { IndustryLandscape } from '@/lib/types';

interface IndustryContextProps {
  context: string | null;
  industry: string | null;
  landscape?: IndustryLandscape | null;
  companyName?: string;
}

export default function IndustryContext({ context, industry, landscape, companyName }: IndustryContextProps) {
  const hasLandscape = landscape && (landscape.current_trends || landscape.competitive_position || landscape.emerging_opportunities);

  if (!hasLandscape && !context) return null;

  return (
    <section className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
          Industry landscape
        </p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-8">
          {companyName ? `${companyName} &` : ''} {industry || 'Your Industry'}
        </h2>

        {hasLandscape ? (
          <div className="space-y-6">
            {landscape!.current_trends && (
              <p className="text-beacon-dark-teal/80 leading-relaxed">
                {landscape!.current_trends}
              </p>
            )}

            {landscape!.competitive_position && (
              <div className="border-l-4 border-beacon-cyan pl-5">
                <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                  {landscape!.competitive_position}
                </p>
              </div>
            )}

            {landscape!.emerging_opportunities && (
              <div className="border-l-4 border-beacon-orange pl-5">
                <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-2">
                  What&apos;s coming next
                </h3>
                <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                  {landscape!.emerging_opportunities}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-beacon-dark-teal/80 leading-relaxed">
            {context}
          </p>
        )}
      </div>
    </section>
  );
}
