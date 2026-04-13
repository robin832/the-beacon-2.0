'use client';

import { useEffect, useState } from 'react';
import {
  getIndustryContent,
  IndustryFact,
  IndustryHeadline,
  IndustryQuote,
  IndustryPoll,
  PollOption,
} from '@/lib/industry-content';
import { trackEvent } from '@/lib/tracking';

interface IndustryBriefingProps {
  industry: string | null;
}

const QUOTE_ROTATION_MS = 8000;
const QUOTES_BEFORE_POLL = 2;

export default function IndustryBriefing({ industry }: IndustryBriefingProps) {
  const content = getIndustryContent(industry);

  return (
    <div className="w-full max-w-xl flex flex-col gap-6" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan">
          &#x1F4F0; Your Industry Right Now
        </span>
        {industry && (
          <span className="text-[10px] font-mono text-white/30 truncate">&mdash; {industry}</span>
        )}
      </div>

      {/* Scrolling news ticker */}
      <NewsTicker headlines={content.headlines} />

      {/* Rotating fun facts / stats */}
      <FunFacts facts={content.facts} />

      {/* Alternating witty quotes + interactive poll */}
      <QuotesAndPoll quotes={content.quotes} poll={content.poll} industry={industry} />

      {/* Footer hint */}
      <p className="text-[10px] font-mono tracking-widest uppercase text-white/20 text-center pt-2">
        &#x1F4A1; While your report generates, here&apos;s something to think about&hellip;
      </p>
    </div>
  );
}

/* ---- News Ticker ---- */

function NewsTicker({ headlines }: { headlines: IndustryHeadline[] }) {
  if (headlines.length === 0) return null;
  // Double the list so the translateX(-50%) loop is seamless
  const doubled = [...headlines, ...headlines];
  const durationSeconds = Math.max(30, headlines.length * 10);

  return (
    <div className="overflow-hidden bg-black/30 border-y border-white/10 h-9 relative">
      {/* Left/right fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-r from-beacon-dark-teal to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-l from-beacon-dark-teal to-transparent" />
      <div
        className="flex items-center h-full whitespace-nowrap w-max"
        style={{
          animation: `ticker ${durationSeconds}s linear infinite`,
        }}
      >
        {doubled.map((h, i) => (
          <a
            key={i}
            href={h.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { if (!h.url) e.preventDefault(); }}
            className="flex items-center gap-3 shrink-0 px-6 hover:bg-white/5 h-full transition-colors"
          >
            <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan">
              {h.source}
            </span>
            <span className="text-[10px] font-mono text-white/20">&bull;</span>
            <span className="text-xs text-white/70">{h.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---- Fun Facts rotator ---- */

const FACT_ROTATION_MS = 7000;

function FunFacts({ facts }: { facts: IndustryFact[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (facts.length === 0) return;
    const t = setInterval(() => setI((n) => (n + 1) % facts.length), FACT_ROTATION_MS);
    return () => clearInterval(t);
  }, [facts.length]);

  if (facts.length === 0) return null;
  const fact = facts[i];

  return (
    <div className="bg-beacon-cyan/5 border border-beacon-cyan/20 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-mono tracking-widest uppercase text-beacon-cyan">
          &#x1F4A1; Did you know
        </span>
        <span className="text-[9px] font-mono text-white/30 truncate">&mdash; {fact.source}</span>
      </div>
      <p key={i} className="text-xs text-white/80 leading-relaxed" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        {fact.stat}
      </p>
    </div>
  );
}

/* ---- Quotes + Poll ---- */

type Phase = 'quotes' | 'poll';

function QuotesAndPoll({
  quotes,
  poll,
  industry,
}: {
  quotes: IndustryQuote[];
  poll: IndustryPoll;
  industry: string | null;
}) {
  const [phase, setPhase] = useState<Phase>('quotes');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quotesShown, setQuotesShown] = useState(0);

  // Rotate quotes every QUOTE_ROTATION_MS; after QUOTES_BEFORE_POLL rotations, switch to poll
  useEffect(() => {
    if (phase !== 'quotes' || quotes.length === 0) return;
    const interval = setInterval(() => {
      setQuotesShown((n) => {
        const next = n + 1;
        if (next >= QUOTES_BEFORE_POLL) {
          setPhase('poll');
          return next;
        }
        return next;
      });
      setQuoteIndex((i) => (i + 1) % quotes.length);
    }, QUOTE_ROTATION_MS);
    return () => clearInterval(interval);
  }, [phase, quotes.length]);

  // After the poll is answered (or dismissed), return to quotes after a pause
  const returnToQuotes = () => {
    setPhase('quotes');
    setQuotesShown(0);
    setQuoteIndex((i) => (i + 1) % Math.max(quotes.length, 1));
  };

  if (phase === 'poll') {
    return <PollCard poll={poll} industry={industry} onDone={returnToQuotes} />;
  }

  const current = quotes[quoteIndex];
  if (!current) return null;

  return (
    <div className="min-h-[180px] flex items-center justify-center px-4">
      <div
        key={quoteIndex}
        className="text-center"
        style={{ animation: `quoteFade ${QUOTE_ROTATION_MS}ms ease-in-out forwards` }}
      >
        <p className="text-lg sm:text-xl text-white/90 leading-relaxed font-medium italic max-w-md mx-auto">
          &ldquo;{current.text}&rdquo;
        </p>
        {current.attribution && (
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/30 mt-4">
            &mdash; {current.attribution}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---- Poll ---- */

function PollCard({
  poll,
  industry,
  onDone,
}: {
  poll: IndustryPoll;
  industry: string | null;
  onDone: () => void;
}) {
  const [answered, setAnswered] = useState<string | null>(null);

  const handleSelect = (option: PollOption) => {
    setAnswered(option.id);
    trackEvent('loading_poll', '/analyzing', {
      answer: option.id,
      answer_label: option.label,
      industry,
      question: poll.question,
    });
    // Return to quotes after a few seconds so users can see the results
    setTimeout(() => onDone(), 5000);
  };

  return (
    <div
      className="border border-white/10 bg-white/5 rounded-lg p-6 min-h-[180px]"
      style={{ animation: 'fadeInUp 0.5s ease-out' }}
    >
      <p className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan mb-2">
        Quick question while you wait&hellip;
      </p>
      <h3 className="text-base sm:text-lg font-bold text-white mb-5 leading-tight">
        {poll.question}
      </h3>

      {!answered ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {poll.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              className="flex items-center gap-2 px-3 py-2.5 rounded border border-white/10 bg-white/5 hover:bg-beacon-cyan/20 hover:border-beacon-cyan/40 transition-colors text-left"
            >
              <span className="text-base">{opt.icon}</span>
              <span className="text-xs text-white/80">{opt.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/40 mb-3">
            Thanks! Here&apos;s what others said:
          </p>
          <div className="space-y-2">
            {poll.options.map((opt) => {
              const selected = opt.id === answered;
              return (
                <div key={opt.id} className="flex items-center gap-3">
                  <span className="text-sm w-5 flex-shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] truncate ${selected ? 'text-beacon-cyan font-bold' : 'text-white/60'}`}>
                        {opt.label}
                      </span>
                      <span className={`text-[10px] font-mono ml-2 ${selected ? 'text-beacon-cyan' : 'text-white/40'}`}>
                        {opt.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${selected ? 'bg-beacon-cyan' : 'bg-white/30'}`}
                        style={{ width: `${opt.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
