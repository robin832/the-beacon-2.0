'use client';

import { useEffect, useState } from 'react';
import {
  getIndustryContent,
  IndustryFact,
  IndustryHeadline,
  IndustryPoll,
  PollOption,
} from '@/lib/industry-content';
import { trackEvent } from '@/lib/tracking';

interface IndustryBriefingProps {
  industry: string | null;
}

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

      {/* ETA hint — shown once at the start, no ticking counter */}
      <p className="text-[10px] font-mono tracking-wide text-white/40">
        Usually takes 60&ndash;90 seconds. Deep analyses can run up to 3 minutes.
      </p>

      {/* Scrolling news ticker (non-clickable — headlines are illustrative) */}
      <NewsTicker headlines={content.headlines} />

      {/* Rotating fun facts / stats */}
      <FunFacts facts={content.facts} />

      {/* Interactive poll sequence — each poll shown at most once */}
      <PollSequence polls={content.polls} industry={industry} />
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
          <div
            key={i}
            className="flex items-center gap-3 shrink-0 px-6 h-full"
          >
            <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan">
              {h.source}
            </span>
            <span className="text-[10px] font-mono text-white/20">&bull;</span>
            <span className="text-xs text-white/70">{h.title}</span>
          </div>
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

/* ---- Poll sequence ---- */

// How long poll results stay on screen before advancing to the next question.
const RESULTS_LINGER_MS = 6000;
// If the user doesn't answer, auto-advance after this many ms.
const UNANSWERED_TIMEOUT_MS = 45000;

function PollSequence({ polls, industry }: { polls: IndustryPoll[]; industry: string | null }) {
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const done = index >= polls.length;

  // Auto-advance if the user never answers this poll
  useEffect(() => {
    if (done || answered) return;
    const t = setTimeout(() => setIndex((i) => i + 1), UNANSWERED_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [index, answered, done]);

  const poll = polls[index];

  const handleSelect = (option: PollOption) => {
    if (answered) return;
    setAnswered(option.id);
    trackEvent('loading_poll', '/analyzing', {
      answer: option.id,
      answer_label: option.label,
      industry,
      question: poll?.question,
    });
    // Show the results briefly, then move to the next question.
    setTimeout(() => {
      setAnswered(null);
      setIndex((i) => i + 1);
    }, RESULTS_LINGER_MS);
  };

  if (done) {
    return (
      <div className="border border-white/10 bg-white/5 rounded-lg p-6 text-center">
        <p className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan mb-2">
          Thanks for playing along
        </p>
        <p className="text-sm text-white/70">
          Your report is almost ready. Hang tight.
        </p>
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div
      key={index}
      className="border border-white/10 bg-white/5 rounded-lg p-6 min-h-[200px]"
      style={{ animation: 'fadeInUp 0.5s ease-out' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan">
          Quick question &mdash; {index + 1} of {polls.length}
        </p>
        {polls.length > 1 && (
          <div className="flex items-center gap-1">
            {polls.map((_, i) => (
              <span
                key={i}
                className={`block h-1 w-4 rounded-full ${
                  i < index ? 'bg-beacon-cyan/60' : i === index ? 'bg-beacon-cyan' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>
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
