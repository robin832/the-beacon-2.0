'use client';

import { IndustryLandscape } from '@/lib/types';

interface IndustryContextProps {
  context: string | null;
  industry: string | null;
  landscape?: IndustryLandscape | null;
}

export default function IndustryContext({ context, industry, landscape }: IndustryContextProps) {
  // Prefer structured landscape data, fall back to plain text context
  const hasLandscape = landscape && (landscape.current_trends || landscape.competitive_position || landscape.emerging_opportunities);

  if (!hasLandscape && !context) return null;

  return (
    <section className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
          What&apos;s Transforming {industry || 'Your Industry'} Right Now
        </h2>
        <p className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-8">
          Industry landscape
        </p>

        {hasLandscape ? (
          <div className="space-y-8">
            {landscape!.current_trends && (
              <div className="prose prose-lg max-w-none text-beacon-dark-teal/80 leading-relaxed">
                {landscape!.current_trends.split('\n').map((paragraph, i) => (
                  paragraph.trim() ? <p key={i}>{paragraph}</p> : null
                ))}
              </div>
            )}

            {landscape!.competitive_position && (
              <div className="border-l-4 border-beacon-cyan pl-6">
                <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-3">
                  Competitive Position
                </h3>
                <p className="text-beacon-dark-teal/80 leading-relaxed">
                  {landscape!.competitive_position}
                </p>
              </div>
            )}

            {landscape!.emerging_opportunities && (
              <div className="border-l-4 border-beacon-orange pl-6">
                <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-3">
                  What&apos;s Coming Next
                </h3>
                <p className="text-beacon-dark-teal/80 leading-relaxed">
                  {landscape!.emerging_opportunities}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="prose prose-lg max-w-none text-beacon-dark-teal/80 leading-relaxed">
            {context!.split('\n').map((paragraph, i) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : null
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
