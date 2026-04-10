'use client';

import { useEffect, useState } from 'react';
import { getIndustryContent, IndustryFact, IndustryHeadline } from '@/lib/industry-content';

interface IndustryBriefingProps {
  industry: string | null;
}

const HEADLINE_ROTATION_MS = 10000;
const FACT_ROTATION_MS = 7000;

export default function IndustryBriefing({ industry }: IndustryBriefingProps) {
  const content = getIndustryContent(industry);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    if (content.headlines.length <= 1) return;
    const interval = setInterval(() => {
      setHeadlineIndex((i) => (i + 1) % content.headlines.length);
    }, HEADLINE_ROTATION_MS);
    return () => clearInterval(interval);
  }, [content.headlines.length]);

  useEffect(() => {
    if (content.facts.length <= 1) return;
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % content.facts.length);
    }, FACT_ROTATION_MS);
    return () => clearInterval(interval);
  }, [content.facts.length]);

  const currentHeadline = content.headlines[headlineIndex];
  const currentFact = content.facts[factIndex];

  return (
    <div className="w-full max-w-xl space-y-6" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
      {/* Section label */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan">
          &#x1F4F0; Your Industry Right Now
        </span>
        {industry && (
          <span className="text-[10px] font-mono text-white/30 truncate">— {industry}</span>
        )}
      </div>

      {/* Headline card (rotating) */}
      <HeadlineCard key={headlineIndex} headline={currentHeadline} />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/30">Did you know</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Fact card (rotating) */}
      <FactCard key={factIndex} fact={currentFact} />

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {content.headlines.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              i === headlineIndex ? 'bg-beacon-cyan w-6' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function HeadlineCard({ headline }: { headline: IndustryHeadline | undefined }) {
  if (!headline) return null;
  return (
    <div
      className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
      style={{ animation: 'fadeInUp 0.5s ease-out' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-mono tracking-widest uppercase text-beacon-cyan/80">
          {headline.source}
        </span>
        <span className="text-[9px] font-mono text-white/30">&middot;</span>
        <span className="text-[9px] font-mono text-white/30">{headline.date}</span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2 leading-tight">{headline.title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{headline.snippet}</p>
      {headline.url && (
        <a
          href={headline.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-beacon-cyan hover:underline font-mono"
        >
          Read more &rarr;
        </a>
      )}
    </div>
  );
}

function FactCard({ fact }: { fact: IndustryFact | undefined }) {
  if (!fact) return null;
  return (
    <div
      className="border-l-2 border-beacon-orange/50 pl-5 py-2"
      style={{ animation: 'fadeInUp 0.5s ease-out' }}
    >
      <p className="text-base text-white/80 leading-relaxed font-medium">
        &ldquo;{fact.stat}&rdquo;
      </p>
      <p className="text-[10px] font-mono tracking-widest uppercase text-white/30 mt-2">
        &mdash; {fact.source}
      </p>
    </div>
  );
}
