'use client';

import { useEffect, useState } from 'react';

const statusMessages = [
  { text: 'Initializing innovation scanner...', delay: 0 },
  { text: 'Scanning public data sources...', delay: 3000 },
  { text: 'Searching for R&D activities and patents...', delay: 8000 },
  { text: 'Analyzing technology investments...', delay: 14000 },
  { text: 'Evaluating digital transformation maturity...', delay: 22000 },
  { text: 'Reviewing product and service innovation...', delay: 30000 },
  { text: 'Identifying strategic partnerships...', delay: 38000 },
  { text: 'Detecting innovation gaps and opportunities...', delay: 46000 },
  { text: 'Assessing market leadership position...', delay: 54000 },
  { text: 'Matching with Beacon ecosystem partners...', delay: 64000 },
  { text: 'Calculating innovation maturity scores...', delay: 74000 },
  { text: 'Generating your personalized report...', delay: 84000 },
  { text: 'Almost there — finalizing analysis...', delay: 100000 },
];

interface TerminalLoaderProps {
  analysisStatus: string | null;
  embedded?: boolean;
}

export default function TerminalLoader({ analysisStatus, embedded = false }: TerminalLoaderProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextVisible = statusMessages.filter((m) => elapsed >= m.delay).length;
      setVisibleLines(nextVisible);
    }, 500);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    if (analysisStatus === 'complete') {
      setVisibleLines(statusMessages.length);
    }
  }, [analysisStatus]);

  const containerClass = embedded
    ? 'relative w-full max-w-xl'
    : 'relative min-h-screen bg-beacon-dark-teal flex items-center justify-center overflow-hidden';

  return (
    <div className={containerClass}>
      {/* CRT scanline overlay — only render when standalone */}
      {!embedded && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,172,217,0.03) 2px, rgba(0,172,217,0.03) 4px)',
          }}
        />
      )}

      <div className={embedded ? 'relative z-20 w-full' : 'relative z-20 max-w-xl w-full px-6'}>
        {/* Logo */}
        <div className="text-center mb-12">
          <img src="/logo-white.svg" alt="The Beacon" className="h-8 mx-auto opacity-20" />
        </div>

        {/* Terminal window */}
        <div className="bg-black/40 rounded-lg border border-white/10 p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>

          <div className="space-y-3 font-mono text-sm">
            {statusMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 transition-all duration-700 ${
                  i < visibleLines ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${i < visibleLines - 1 ? 'text-green-400' : 'text-beacon-cyan'}`}>
                  {i < visibleLines - 1 ? '✓' : '▸'}
                </span>
                <span className={i < visibleLines - 1 ? 'text-white/50' : 'text-white'}>
                  {msg.text}
                </span>
              </div>
            ))}

            {visibleLines < statusMessages.length && visibleLines > 0 && (
              <span
                className="inline-block w-2 h-4 bg-beacon-cyan ml-6"
                style={{ animation: 'blink 1s step-end infinite' }}
              />
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-xs font-mono mt-8 tracking-wider">
          This typically takes 30–60 seconds
        </p>
      </div>
    </div>
  );
}
