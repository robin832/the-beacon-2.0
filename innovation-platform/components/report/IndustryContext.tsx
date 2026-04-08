'use client';

interface IndustryContextProps {
  context: string | null;
  industry: string | null;
}

export default function IndustryContext({ context, industry }: IndustryContextProps) {
  if (!context) return null;

  return (
    <section className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
          What&apos;s Transforming {industry || 'Your Industry'} Right Now
        </h2>
        <p className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-8">
          Industry landscape
        </p>
        <div className="prose prose-lg max-w-none text-beacon-dark-teal/80 leading-relaxed">
          {context.split('\n').map((paragraph, i) => (
            paragraph.trim() ? <p key={i}>{paragraph}</p> : null
          ))}
        </div>
      </div>
    </section>
  );
}
